import Groq from 'groq-sdk';

export const handler = async (event: any) => {
    console.log('--- OCR FUNCTION INVOKED ---');

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
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Missing GROQ_API_KEY' })
            };
        }

        const groq = new Groq({ apiKey });

        // Netlify functions handle multipart/form-data as a base64 encoded string in event.body if isBase64Encoded is true
        // However, for simplicity and reliability with mobile uploads, 
        // we'll expect the frontend to send a JSON with { image: "base64..." } or just raw binary if we can parse it.
        // Given ScriptInput.tsx uses FormData, we need to handle that.

        // For a quick robust fix, we'll use a simple strategy:
        // Extract the base64 part if it's there, or the whole body if it looks like one.
        let base64Image = '';

        if (event.isBase64Encoded) {
            // This is likely the raw multipart body. 
            // Parsing multipart in serverless is tricky without heavy deps.
            // Better to change the frontend to send JSON { image: base64 }
            // But let's try to support what we have if possible or just update frontend soon.
            base64Image = event.body;
        } else {
            try {
                const body = JSON.parse(event.body);
                base64Image = body.image;
            } catch (e) {
                base64Image = event.body;
            }
        }

        // If it's multipart, it's messy. Let's update ScriptInput.tsx to send JSON for the Netlify path.
        // For now, let's assume we'll fix the frontend to send a clean base64.

        const response = await groq.chat.completions.create({
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: "Extract all the text from this image. Return ONLY the extracted text, no explanations." },
                        {
                            type: "image_url",
                            image_url: {
                                url: `data:image/jpeg;base64,${base64Image}`,
                            },
                        },
                    ],
                },
            ],
            model: "meta-llama/llama-4-scout-17b-16e-instruct",
        });

        const extractedText = response.choices[0]?.message?.content || '';

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ text: extractedText })
        };

    } catch (error: any) {
        console.error('OCR Error:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ error: 'OCR failed', details: error.message })
        };
    }
};
