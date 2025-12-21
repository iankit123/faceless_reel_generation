import type { WordTiming } from '../types';

export const ttsService = {
    generateAudio: async (text: string, voice: string = 'hi-IN-SwaraNeural'): Promise<{ audioUrl: string, wordTimings: WordTiming[] }> => {
        try {
            const response = await fetch('/api/tts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text, voice }),
            });

            if (!response.ok) {
                throw new Error('Failed to generate audio');
            }

            const blob = await response.blob();
            const audioUrl = URL.createObjectURL(blob);

            return {
                audioUrl,
                wordTimings: []
            };

        } catch (error) {
            console.error('TTS Service Error:', error);
            throw error;
        }
    }
};
