import { EdgeTTS } from '@andresaya/edge-tts';

export default async (req: Request) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
        });
    }

    if (req.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    try {
        const { text, voice } = await req.json();

        if (!text) {
            return new Response('Missing text', { status: 400 });
        }

        const tts = new EdgeTTS({
            voice: voice || 'hi-IN-SwaraNeural'
        });

        await tts.synthesize(text, voice || 'hi-IN-SwaraNeural');
        const audioBuffer = tts.toBuffer();

        // Return audio as base64 or binary
        // Using base64 for simplicity in JSON response, or direct binary.
        // Let's return direct binary with correct content type.

        return new Response(audioBuffer, {
            headers: {
                'Content-Type': 'audio/mpeg',
                'Access-Control-Allow-Origin': '*',
                'X-Duration': tts.getDuration().toString() // Optional: if available
            }
        });

    } catch (error: any) {
        console.error('TTS Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}
