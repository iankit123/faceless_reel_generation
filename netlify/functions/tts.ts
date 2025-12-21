import { EdgeTTS } from '@andresaya/edge-tts';

export const handler = async (event: any) => {
    console.log('--- TTS FUNCTION INVOKED ---');

    if (event.httpMethod === 'GET') {
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'text/plain' },
            body: "tts alive"
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
        const { text, voice } = JSON.parse(event.body);
        console.log('TTS Text:', text?.substring(0, 50));

        if (!text) {
            return { statusCode: 400, body: 'Missing text' };
        }

        let lastError = null;
        for (let i = 0; i < 3; i++) {
            try {
                console.log(`TTS Attempt ${i + 1}...`);
                const tts = new EdgeTTS();
                await tts.synthesize(text, voice || 'hi-IN-SwaraNeural');
                const audioBuffer = tts.toBuffer();

                if (!audioBuffer || audioBuffer.length === 0) {
                    throw new Error('Empty audio buffer generated');
                }

                console.log('TTS generated successfully, size:', audioBuffer.length);
                return {
                    statusCode: 200,
                    headers: {
                        'Content-Type': 'audio/mpeg',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: audioBuffer.toString('base64'),
                    isBase64Encoded: true
                };
            } catch (error) {
                console.error(`TTS Attempt ${i + 1} failed:`, error);
                lastError = error;
            }
        }

        throw lastError || new Error('TTS failed after retries');

    } catch (error: any) {
        console.error('TTS Critical Error:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ error: 'TTS generation failed', details: error.message })
        };
    }
};
