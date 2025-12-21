import type { WordTiming } from '../types';

export const ttsService = {
    generateAudio: async (text: string, voice: string = 'hi-IN-SwaraNeural'): Promise<{ audioUrl: string, wordTimings: WordTiming[] }> => {
        try {
            console.log('TTS Service: Requesting audio for text:', text.substring(0, 30));
            const response = await fetch('/api/tts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text, voice }),
            });

            console.log('TTS Service: Response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('TTS Service: Error response:', errorText);
                throw new Error(`Failed to generate audio: ${response.status} ${errorText}`);
            }

            const blob = await response.blob();
            console.log('TTS Service: Blob received, size:', blob.size);
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
