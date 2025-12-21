import Groq from 'groq-sdk';

export const handler = async (event: any) => {
    console.log('--- STORY FUNCTION INVOKED ---');

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

    if (event.httpMethod === 'GET') {
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'text/plain' },
            body: "story alive"
        };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { prompt, language } = JSON.parse(event.body);
        console.log('Story Prompt:', prompt);

        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            console.error('Missing GROQ_API_KEY');
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Server configuration error: Missing Groq API Key' })
            };
        }

        const groq = new Groq({ apiKey });

        let languageInstruction = "User input may be in Hindi or Hinglish. ALWAYS generate the 'text' field in Hindi (Devanagari script).";
        if (language === 'english') {
            languageInstruction = "Generate the 'text' field in English.";
        }

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `You are a viral short-form video script writer. 
                    Create a compelling story based on the user's prompt.
                    Output ONLY a JSON object with this structure:
                    {
                        "title": "...",
                        "theme": "...",
                        "scenes": [
                            {
                                "text": "...",
                                "imagePrompt": "...",
                                "motionType": "zoom_in" | "pan_left" | "pan_right" | "pan_up" | "pan_down" | "none"
                            }
                        ]
                    }
                    Keep it to 5-7 scenes. ${languageInstruction}

                    For each imagePrompt:
                    Write a single, vivid, cinematic description suitable for image generation.
                    Always specify camera framing (close-up, medium shot, wide shot, aerial, low angle, over-the-shoulder).
                    Always specify lighting (soft daylight, warm indoor light, dramatic contrast, sunset glow, moonlight, etc.).
                    Always specify mood or emotion (playful, tense, joyful, mysterious, calm, emotional).
                    Describe key visual details (setting, subject appearance, environment, colors, textures).
                    Keep the style consistent with the story context (realistic, animated, fantasy, kids-friendly, cinematic).
                    The prompt must read like a movie frame description, not a list of keywords.
                    Internal guiding pattern:
                    “cinematic [camera framing] of [subject] in [setting], [lighting], [mood], highly detailed, visually coherent”
                    `
                },
                {
                    role: "user",
                    content: `Create a story about: ${prompt}`
                }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.7,
            max_tokens: 1000,
            response_format: { type: "json_object" }
        });

        const story = JSON.parse(completion.choices[0]?.message?.content || '{}');
        console.log('Story generated successfully');

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(story)
        };

    } catch (error: any) {
        console.error('Story Generation Error:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ error: 'Story generation failed', details: error.message })
        };
    }
};
