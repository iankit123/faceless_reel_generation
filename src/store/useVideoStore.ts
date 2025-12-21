import { create } from 'zustand';
import type { Scene, VideoProject } from '../types';

interface VideoState {
    project: VideoProject | null;
    isGenerating: boolean;
    currentSceneId: number | string | null;

    // Actions
    initProject: (theme?: string) => void;
    setProject: (project: VideoProject) => void;
    updateScene: (sceneId: number | string, updates: Partial<Scene>) => void;
    addScene: (scene: Scene) => void;
    addSceneAt: (index: number, scene: Scene) => void;
    removeScene: (sceneId: number | string) => void;
    setGenerating: (isGenerating: boolean) => void;
    setCurrentSceneId: (id: number | string | null) => void;
    updateCaptionSettings: (settings: Partial<import('../types').CaptionSettings>) => void;
    setBackgroundMusic: (music: import('../types').BackgroundMusic | undefined) => void;
    setTheme: (theme: string) => void;
}

export const useVideoStore = create<VideoState>((set) => ({
    project: null,
    isGenerating: false,
    currentSceneId: null,

    initProject: (theme) => set({
        project: {
            id: crypto.randomUUID(),
            title: 'New Video',
            theme,
            scenes: [],
            captionSettings: { style: 'default' },
            backgroundMusic: {
                name: 'Else.mp3',
                url: '/background_music/Else.mp3',
                volume: 0.3
            },
            createdAt: new Date()
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
    setTheme: (theme) => set((state) => {
        if (!state.project) return state;
        return {
            project: {
                ...state.project,
                theme
            }
        };
    }),
}));
