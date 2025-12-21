import type { WordTiming } from '../types';

export const ttsService = {
    generateAudio: async (text: string, voice?: string): Promise<{ audioUrl: string, wordTimings: WordTiming[] }> => {
        try {
            console.log('TTS Service: Requesting audio for text:', text.substring(0, 30));
            const response = await fetch('/api/tts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text, voice }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('Server Error Details:', errorData);
                throw new Error(errorData.details || 'Failed to generate audio');
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
