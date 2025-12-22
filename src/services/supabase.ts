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
    },

    async getProfile(userId: string) {
        return await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
    },

    async decrementCredits(userId: string) {
        let { data: profile, error: fetchError } = await this.getProfile(userId);

        // Handle profile initialization race condition
        if (fetchError && fetchError.code === 'PGRST116') {
            const { data: newProfile, error: createError } = await supabase
                .from('profiles')
                .upsert({ id: userId, credits: 1 })
                .select()
                .single();

            if (createError) throw createError;
            return newProfile;
        }

        if (fetchError) {
            // Check for schema issues (406 Not Acceptable)
            if (fetchError.message?.includes('Not Acceptable') || fetchError.code === 'PGRST102') {
                throw new Error('Database schema issue: The "credits" column is missing. Please run the SQL script in the walkthrough.');
            }
            throw fetchError;
        }

        if (!profile || typeof profile.credits === 'undefined') {
            throw new Error('Profile or credits column not found. Please ensure the SQL script from the walkthrough has been executed.');
        }

        if (profile.credits <= 0) throw new Error('Insufficient credits');

        const { data, error } = await supabase
            .from('profiles')
            .update({ credits: profile.credits - 1 })
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async logPaymentAttempt(userId: string, amount: number, credits: number, status: string) {
        const { data, error } = await supabase
            .from('payment_attempts')
            .insert({
                user_id: userId,
                amount,
                credits_requested: credits,
                status,
                created_at: new Date()
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};
