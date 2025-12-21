import express from 'express';
import cors from 'cors';
import { EdgeTTS } from '@andresaya/edge-tts';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.resolve();

dotenv.config();

console.log('SERVER_INIT: Starting Express app');
console.log('SERVER_INIT: __dirname is', __dirname);
console.log('SERVER_INIT: NODE_ENV is', process.env.NODE_ENV);

export const app = express();
const port = process.env.PORT || 3000;

// Simple in-memory cache for images
const imageCache = new Map<string, any>();

// Initialize Groq
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || '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'
});

app.use(cors());
app.use(express.json());

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', environment: process.env.NODE_ENV || 'development' });
});

// TTS Endpoint
app.post('/api/tts', async (req, res) => {
    const { text, voice } = req.body;
    if (!text) {
        return res.status(400).json({ error: 'Missing text' });
    }

    console.log('TTS_REQUEST:', { textLength: text.length, voice });

    let lastError = null;
    for (let i = 0; i <= 2; i++) {
        try {
            console.log(`TTS Attempt ${i + 1} for text: ${text.substring(0, 30)}...`);
            const tts = new EdgeTTS();
            const selectedVoice = voice || 'hi-IN-SwaraNeural';
            await tts.synthesize(text, selectedVoice);
            const audioBuffer = tts.toBuffer();

            if (!audioBuffer || audioBuffer.length === 0) {
                throw new Error('Empty audio buffer generated');
            }

            res.set({
                'Content-Type': 'audio/mpeg',
                'Content-Length': audioBuffer.length.toString(),
            });
            return res.send(audioBuffer);
        } catch (error) {
            console.error(`TTS Attempt ${i + 1} failed:`, error);
            lastError = error;
        }
    }

    return res.status(500).json({
        error: 'TTS generation failed after retries',
        details: lastError instanceof Error ? lastError.message : String(lastError)
    });
});

// Story Generation Endpoint
app.post('/api/story', async (req, res) => {
    try {
        const { prompt, language } = req.body;
        console.log('STORY_REQUEST:', { promptLength: prompt?.length, language });

        if (!process.env.GROQ_API_KEY) {
            console.error('CRITICAL: GROQ_API_KEY is missing from environment');
            return res.status(500).json({ error: 'Server configuration error: Missing API Key' });
        }

        console.log('Generating story for prompt:', prompt, 'in language:', language);
        if (!prompt) {
            return res.status(400).json({ error: 'Missing prompt' });
        }

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
            max_tokens: 1000, // Keep it fast
            response_format: { type: "json_object" }
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) {
            throw new Error('No content received from Groq');
        }

        const story = JSON.parse(content);
        res.json(story);

    } catch (error) {
        console.error('STORY_ERROR_CRITICAL:', error);
        res.status(500).json({
            error: 'Story generation failed',
            details: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
        });
    }
});

// Image Generation Endpoint (ImageRouter.io)
app.post('/api/image/generate', async (req, res) => {
    const models = [
        "bria/bria-3.2",
        "openai/gpt-image-1.5:free"
    ];

    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: 'Missing prompt' });
    }

    // Check cache
    if (imageCache.has(prompt)) {
        console.log('Serving image from cache for prompt:', prompt);
        return res.json(imageCache.get(prompt));
    }

    console.log('Generating image for prompt:', prompt);

    const tryModel = async (model: string) => {
        try {
            console.log(`Attempting generation with model: ${model}`);
            const response = await fetch('https://api.imagerouter.io/v1/openai/images/generations', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.IMAGEROUTER_TOKEN}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: prompt,
                    model: model,
                    size: "512x512",
                    response_format: "url",
                    output_format: "webp", /*still gives png, some issue in api */
                    quality: "low"
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Model ${model} failed (${response.status}): ${errorText}`);
            }

            const data = await response.json();
            if (data.data?.[0]?.url) {
                console.log(`Successfully generated image with model: ${model}`);
                return data;
            }
            throw new Error(`Model ${model} returned no URL`);

        } catch (error) {
            console.warn(error instanceof Error ? error.message : String(error));
            throw error;
        }
    };

    // Try in batches of 3 to find a working one faster
    const batchSize = 3;
    for (let i = 0; i < models.length; i += batchSize) {
        const batch = models.slice(i, i + batchSize);
        console.log(`Trying batch: ${batch.join(', ')}`);

        try {
            // Use Promise.any to get the first successful result from the batch
            const result = await Promise.any(batch.map(model => tryModel(model)));

            // Cache and return the successful result
            imageCache.set(prompt, result);
            return res.json(result);
        } catch (error) {
            console.log(`Batch starting at index ${i} failed, trying next batch...`);
            // Continue to next batch if all in current batch failed
        }
    }

    res.status(500).json({
        error: 'All image generation models failed',
        details: 'Checked all available models in batches and none succeeded.'
    });
});

// Background music is served from the public folder by Vite/Netlify

app.get('/api/music', (req, res) => {
    try {
        const musicDir = path.join(__dirname, 'public', 'background_music');
        if (!fs.existsSync(musicDir)) {
            console.log('Music directory not found, returning empty list');
            return res.json([]);
        }
        const files = fs.readdirSync(musicDir)
            .filter(file => file.endsWith('.mp3'))
            .map(file => ({
                name: file,
                url: `/background_music/${file}`
            }));
        res.json(files);
    } catch (error) {
        console.error('Music List Error:', error);
        res.status(500).json({ error: 'Failed to list music' });
    }
});

if (process.env.NODE_ENV !== 'production' && !process.env.NETLIFY) {
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
}
