import type { StoryRequest, StoryResponse } from '../types';

export const storyService = {
    generateStory: async (request: StoryRequest): Promise<StoryResponse> => {
        try {
            const response = await fetch('/api/story', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(request),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('Server Error Details:', errorData);
                throw new Error(errorData.details || 'Failed to generate story');
            }

            return await response.json();
        } catch (error) {
            console.error('Story Service Error:', error);
            throw error;
        }
    }
};
