import express from 'express';
import cors from 'cors';
import { EdgeTTS } from '@andresaya/edge-tts';
import { Groq } from 'groq-sdk';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

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

// TTS Endpoint
app.post('/api/tts', async (req, res) => {
    let retryCount = 0;
    const maxRetries = 2;

    const attemptTTS = async () => {
        try {
            const { text, voice } = req.body;

            if (!text) {
                return res.status(400).json({ error: 'Missing text' });
            }

            const tts = new EdgeTTS();
            await tts.synthesize(text, voice || 'hi-IN-SwaraNeural');
            const audioBuffer = tts.toBuffer();

            if (!audioBuffer || audioBuffer.length === 0) {
                throw new Error('Empty audio buffer generated');
            }

            res.set({
                'Content-Type': 'audio/mpeg',
                'Content-Length': audioBuffer.length,
            });

            res.send(audioBuffer);

        } catch (error) {
            console.error(`TTS Attempt ${retryCount + 1} failed:`, error);
            if (retryCount < maxRetries) {
                retryCount++;
                console.log(`Retrying TTS (${retryCount}/${maxRetries})...`);
                await attemptTTS();
            } else {
                res.status(500).json({ error: 'TTS generation failed after retries', details: error instanceof Error ? error.message : String(error) });
            }
        }
    };

    await attemptTTS();
});

// Story Generation Endpoint
app.post('/api/story', async (req, res) => {
    try {
        const { prompt, language } = req.body;

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
                    content: `You are a short vertical video story engine optimized for Instagram Reels and YouTube Shorts. Output JSON ONLY. No markdown. No explanations.Structure:
                    {
                        "language": "${language || 'hinglish'}",
                        "theme": "A concise visual theme description (e.g., 'Dark cinematic horror', 'Bright vibrant cartoon', 'Epic historical drama')",
                        "scenes": [
                            {
                                "id": 1,
                                "text": "Scene text based on language instruction",
                                "duration": 5,
                                "imagePrompt": "English image prompt for scene 1"
                            }
                        ]
                    }
                    ${languageInstruction}
                    Create 3-5 scenes. Keep text concise (1-2 sentences).
                    Include 'imagePrompt' in English for AI image generation.
                    - Scene 1 MUST be a strong hook within first 2 seconds.
                    - Each next scene must progress the story logically.
                    - Final scene MUST deliver emotional payoff or resolution.
                    - No filler scenes.
                    `
                },
                {
                    role: "user",
                    content: `Create a story about: ${prompt}`
                }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.7,
            response_format: { type: "json_object" }
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) {
            throw new Error('No content received from Groq');
        }

        const story = JSON.parse(content);
        res.json(story);

    } catch (error) {
        console.error('Story Error Details:', error);
        if (error instanceof Error) {
            console.error('Message:', error.message);
            console.error('Stack:', error.stack);
        }
        res.status(500).json({ error: 'Story generation failed', details: error instanceof Error ? error.message : String(error) });
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
                    'Authorization': 'Bearer 7f766bb0dcbf3660ca3435d5d7c20c5606f42696a8b153246876f100bca78bed',
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

// Serve Background Music
app.use('/background_music', express.static('background_music'));

app.get('/api/music', (req, res) => {
    try {
        const musicDir = path.join(__dirname, 'background_music');
        if (!fs.existsSync(musicDir)) {
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

if (process.env.NODE_ENV !== 'production') {
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
}
