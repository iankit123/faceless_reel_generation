import fetch from 'node-fetch';

export const handler = async (event: any) => {
    console.log('--- IMAGE FUNCTION INVOKED ---');

    if (event.httpMethod === 'GET') {
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'text/plain' },
            body: "image alive"
        };
    }

    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            body: ''
        };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { prompt, model, size, quality, style } = JSON.parse(event.body);
        console.log('Image Prompt:', prompt);

        const token = process.env.IMAGEROUTER_TOKEN;
        if (!token) {
            console.error('Missing IMAGEROUTER_TOKEN');
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Server configuration error: Missing Image Token' })
            };
        }

        const models = [
            'bria/bria-3.2',
            'openai/gpt-image-1.5:free',
            'black-forest-labs/flux-1-schnell',
            'stability-ai/sdxl'
        ];

        const tryModel = async (modelName: string) => {
            console.log(`Trying model: ${modelName}`);
            const response = await fetch('https://api.imagerouter.io/v1/openai/images/generations', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt,
                    model: modelName,
                    n: 1,
                    size: size || "512x512",
                    response_format: "url",
                    quality: quality || "low",
                    style: style || "vivid"
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Model ${modelName} failed: ${response.status} ${JSON.stringify(errorData)}`);
            }

            const data: any = await response.json();
            return data.data[0].url;
        };

        // Try in batches of 2 for speed and reliability
        let imageUrl = null;
        try {
            imageUrl = await Promise.any([tryModel(models[0]), tryModel(models[1])]);
        } catch (e) {
            console.log('First batch failed, trying second batch...');
            try {
                imageUrl = await Promise.any([tryModel(models[2]), tryModel(models[3])]);
            } catch (e2) {
                throw new Error('All models failed');
            }
        }

        console.log('Image generated successfully:', imageUrl);
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ url: imageUrl })
        };

    } catch (error: any) {
        console.error('Image Generation Error:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ error: 'Image generation failed', details: error.message })
        };
    }
};
