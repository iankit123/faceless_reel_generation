import type { ImageSettings } from '../types';

interface ImageGenerationResponse {
    data: {
        url: string;
        revised_prompt?: string;
    }[];
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const imageService = {
    generateImage: async (prompt: string, settings?: ImageSettings, retries = 3): Promise<string> => {
        for (let i = 0; i < retries; i++) {
            try {
                console.log(`Image Service: Starting generation (Attempt ${i + 1}/${retries})...`);
                const response = await fetch('/api/image/generate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        prompt: prompt,
                        settings: settings
                    })
                });

                if (!response.ok) {
                    const text = await response.text();
                    // If rate limited or server error, retry
                    if (response.status === 429 || response.status >= 500) {
                        const waitTime = Math.pow(2, i) * 2000;
                        console.warn(`Image Service: Error ${response.status}. Retrying in ${waitTime}ms...`);
                        await sleep(waitTime);
                        continue;
                    }
                    throw new Error(`Image API Error: ${response.statusText} - ${text}`);
                }

                const data: ImageGenerationResponse = await response.json();
                console.log('Image Service: Data received', data);

                if (data.data && data.data.length > 0) {
                    return data.data[0].url;
                }

                throw new Error('No image URL received');

            } catch (error) {
                console.error(`Image Generation Error (Attempt ${i + 1}):`, error);
                if (i === retries - 1) throw error;
                const waitTime = Math.pow(2, i) * 2000;
                await sleep(waitTime);
            }
        }
        throw new Error('Failed to generate image after retries');
    }
};
