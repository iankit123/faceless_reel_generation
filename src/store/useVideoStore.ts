import { create } from 'zustand';
import type { Scene, VideoProject } from '../types';
import { supabaseService } from '../services/supabase';
import { getISTDate } from '../utils/date';

interface VideoState {
    project: VideoProject | null;
    isGenerating: boolean;
    currentSceneId: number | string | null;
    utmSource?: string;
    utmCampaign?: string;

    // Actions
    initProject: (theme?: string, language?: string, prompt?: string) => void;
    captureUTMParams: () => void;
    setProject: (project: VideoProject) => void;
    updateScene: (sceneId: number | string, updates: Partial<Scene>) => void;
    addScene: (scene: Scene) => void;
    addSceneAt: (index: number, scene: Scene) => void;
    removeScene: (sceneId: number | string) => void;
    setGenerating: (isGenerating: boolean) => void;
    setCurrentSceneId: (id: number | string | null) => void;
    updateCaptionSettings: (settings: Partial<import('../types').CaptionSettings>) => void;
    setBackgroundMusic: (music: import('../types').BackgroundMusic | undefined) => void;
    setNarrationVolume: (volume: number) => void;
    saveProject: (userId: string) => Promise<void>;
    setTheme: (theme: string) => void;
    resetProject: () => void;
    regenerateAllAudio: () => void;
    uiLanguage: 'en' | 'hi';
    setUILanguage: (lang: 'en' | 'hi') => void;
    timer: number;
    setTimer: (time: number | ((prev: number) => number)) => void;
}

import { persist } from 'zustand/middleware';

export const useVideoStore = create<VideoState>()(
    persist(
        (set, get) => ({
            project: null,
            isGenerating: false,
            currentSceneId: null,
            uiLanguage: (localStorage.getItem('preferred_ui_lang') as 'en' | 'hi') || 'en',
            timer: 150,
            utmSource: undefined,
            utmCampaign: undefined,

            captureUTMParams: () => {
                const params = new URLSearchParams(window.location.search);
                const utm_source = params.get('utm_source');
                const utm_campaign = params.get('utm_campaign');

                if (utm_source || utm_campaign) {
                    set({
                        utmSource: utm_source || undefined,
                        utmCampaign: utm_campaign || undefined
                    });
                }
            },

            setTimer: (time) => set((state) => ({
                timer: typeof time === 'function' ? time(state.timer) : time
            })),

            setUILanguage: (lang) => {
                localStorage.setItem('preferred_ui_lang', lang);
                set({ uiLanguage: lang });
            },

            initProject: (theme, language, prompt) => set({
                timer: 150,
                project: {
                    id: crypto.randomUUID(),
                    title: 'New Video',
                    theme,
                    prompt,
                    scenes: [],
                    captionSettings: { style: 'default' },
                    backgroundMusic: {
                        name: 'Else.mp3',
                        url: '/background_music/Else.mp3',
                        volume: 0.3
                    },
                    narrationVolume: 3.0,
                    language: language || 'hinglish',
                    utmSource: get().utmSource,
                    utmCampaign: get().utmCampaign,
                    createdAt: getISTDate()
                }
            }),

            setProject: (project) => set({ project }),

            updateScene: (sceneId, updates) => set((state) => {
                if (!state.project) return state;
                const newScenes = state.project.scenes.map((scene) =>
                    scene.id === sceneId ? { ...scene, ...updates } : scene
                );
                return { project: { ...state.project, scenes: newScenes } };
            }),

            addScene: (scene) => set((state) => {
                if (!state.project) return state;
                return { project: { ...state.project, scenes: [...state.project.scenes, scene] } };
            }),

            addSceneAt: (index, scene) => set((state) => {
                if (!state.project) return state;
                const newScenes = [...state.project.scenes];
                newScenes.splice(index, 0, scene);
                return { project: { ...state.project, scenes: newScenes } };
            }),

            removeScene: (sceneId) => set((state) => {
                if (!state.project) return state;
                return { project: { ...state.project, scenes: state.project.scenes.filter(s => s.id !== sceneId) } };
            }),

            setGenerating: (isGenerating) => set({ isGenerating }),
            setCurrentSceneId: (currentSceneId) => set({ currentSceneId }),

            updateCaptionSettings: (settings) => set((state) => {
                if (!state.project) return state;
                return {
                    project: {
                        ...state.project,
                        captionSettings: { ...state.project.captionSettings, ...settings }
                    }
                };
            }),

            setBackgroundMusic: (music) => set((state) => {
                if (!state.project) return state;
                return {
                    project: {
                        ...state.project,
                        backgroundMusic: music
                    }
                };
            }),
            setNarrationVolume: (volume) => set((state) => {
                if (!state.project) return state;
                return {
                    project: {
                        ...state.project,
                        narrationVolume: volume
                    }
                };
            }),
            saveProject: async (userId) => {
                const { project } = get();
                if (!project || !userId) return;

                try {
                    await supabaseService.saveProject(project, userId);
                    // Save all scenes
                    await Promise.all(
                        project.scenes.map((scene, index) =>
                            supabaseService.saveScene(scene, project.id, index)
                        )
                    );
                } catch (error: any) {
                    // Check if this is a guest session (using device ID, not a real user)
                    const isGuest = !userId || (userId.includes('-') && userId.length > 20); // UUID-ish check

                    // common Supabase/PostgREST error codes:
                    // 42501: RLS Permission Denied
                    // 23503: Foreign Key Violation (guest deviceId doesn't exist in auth.users)
                    // 23505: Unique Violation (already handled by upsert, but just in case)
                    // 401: Unauthorized (missing schema permissions for anon)
                    const isPermissionOrFKError =
                        error.code === '42501' ||
                        error.code === '23503' ||
                        error.status === 401 ||
                        error.message?.includes('permission denied');

                    if (isGuest && isPermissionOrFKError) {
                        console.warn('Supabase Guest Save Skipped:', {
                            reason: error.message || 'RLS/FK Restriction',
                            code: error.code,
                            status: error.status,
                            suggestion: 'To enable guest persistence, run the SQL script provided in the walkthrough.'
                        });
                        return; // Catch and swallow for guests so they aren't blocked from generating
                    }

                    console.error('Failed to save project to Supabase:', error);
                    throw error;
                }
            },
            setTheme: (theme) => set((state) => {
                if (!state.project) return state;
                return {
                    project: {
                        ...state.project,
                        theme
                    }
                };
            }),
            resetProject: () => set({ project: null, currentSceneId: null, isGenerating: false }),
            regenerateAllAudio: () => set((state) => {
                if (!state.project) return state;
                const newScenes = state.project.scenes.map(s => ({
                    ...s,
                    audioUrl: undefined,
                    status: 'pending' as const
                }));
                return {
                    project: {
                        ...state.project,
                        scenes: newScenes
                    }
                };
            }),
        }),
        {
            name: 'reel-generator-storage',
            partialize: (state) => ({ project: state.project }), // Only persist the project
        }
    )
);
