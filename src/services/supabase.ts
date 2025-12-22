import { supabase } from '../lib/supabase';
import type { Scene, VideoProject } from '../types';

export const supabaseService = {
    async saveProject(project: VideoProject, userId: string) {
        const { data, error } = await supabase
            .from('projects')
            .upsert({
                id: project.id,
                user_id: userId,
                title: project.title,
                theme: project.theme,
                prompt: project.prompt,
                language: project.language,
                narration_volume: project.narrationVolume,
                caption_settings: project.captionSettings,
                background_music: project.backgroundMusic,
                created_at: project.createdAt
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async saveScene(scene: Scene, projectId: string, index: number) {
        const { data, error } = await supabase
            .from('scenes')
            .upsert({
                id: typeof scene.id === 'string' && scene.id.includes('-') ? scene.id : undefined, // only use id if it's a UUID
                project_id: projectId,
                scene_index: index,
                text: scene.text,
                image_prompt: scene.imagePrompt,
                image_url: scene.imageUrl,
                audio_url: scene.audioUrl,
                motion_type: scene.motionType,
                duration: scene.duration,
                status: scene.status
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async getProjects(userId: string) {
        const { data, error } = await supabase
            .from('projects')
            .select(`
        *,
        scenes (*)
      `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    }
};
