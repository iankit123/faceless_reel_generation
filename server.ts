import express from 'express';
import cors from 'cors';
import { EdgeTTS } from '@andresaya/edge-tts';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import os from 'os';
import { pipeline } from 'stream/promises';

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
                    Keep it to 6-10 scenes. ${languageInstruction}

                    CRITICAL: The FIRST scene (index 0) MUST ALWAYS be a Thumbnail scene.
                    - Set "isThumbnail": true for 이 scene.
                    - "text" for this scene should be a short, highly compelling hook/title (e.g. "Secret of the Pyramids", "Why Lions don't eat Grass"). 
                    - It should NOT be a long character dialogue, but a viral hook.
                    - "duration" should be short (2-3 seconds).

                    For each imagePrompt:
                    Write a prompt for text to image generation
                    Describe key visual details (setting, subject appearance, environment, colors, textures)
                    Keep the theme same in all scenes consistent with the story context (Comic, Sketch, animated, fantasy, kids-friendly, etc). If mentioned specifically by user, use that theme.
                    If a person is mentioned in image prompt, try to describe the person in detail speacially gender and age in all scenes, so that character remains similar in all scenes.
                    Internal guiding pattern:
                    “Image Theme: [Comic], [Ancient times] (same for all scenes)
                    Person/Animal mentions: [name1, gender1, age1, species1; name2, gender2, age2, species2; ... ] (same for all scenes)
                    Scene Description: [camera framing] of [subject] in [setting], [lighting], [mood], highly detailed, visually coherent”
                    `
                },
                {
                    role: "user",
                    content: `Create a insta reel compatible story about: ${prompt}`
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
        "openai/gpt-image-1.5:free",
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
                    size: "1024x1024",
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

app.post('/api/video/export', async (req, res) => {
    const { scenes, backgroundMusic, narrationVolume } = req.body;
    console.log('EXPORT_REQUEST: Starting export for', scenes?.length, 'scenes');

    if (!scenes || scenes.length === 0) {
        return res.status(400).json({ error: 'No scenes provided' });
    }

    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'reel-export-'));
    console.log('EXPORT: Created temp directory:', tempDir);

    try {
        const scenePaths: string[] = [];

        for (let i = 0; i < scenes.length; i++) {
            const scene = scenes[i];
            console.log(`EXPORT: Processing scene ${i + 1}/${scenes.length} (Thumbnail: ${!!scene.isThumbnail})`);

            // Download assets
            const imagePath = path.join(tempDir, `image_${i}.jpg`);
            const audioPath = path.join(tempDir, `audio_${i}.mp3`);
            const sceneOutputPath = path.join(tempDir, `scene_${i}.mp4`);

            const imgRes = await fetch(scene.imageUrl);
            if (!imgRes.ok) throw new Error(`Failed to download image: ${scene.imageUrl}`);
            const imgBuffer = Buffer.from(await imgRes.arrayBuffer());
            fs.writeFileSync(imagePath, imgBuffer);

            const audioRes = await fetch(scene.audioUrl);
            if (!audioRes.ok) throw new Error(`Failed to download audio: ${scene.audioUrl}`);
            const audioBuf = Buffer.from(await audioRes.arrayBuffer());
            fs.writeFileSync(audioPath, audioBuf);

            // Render scene clip
            await new Promise((resolve, reject) => {
                let f = ffmpeg()
                    .input(imagePath)
                    .loop(scene.duration)
                    .input(audioPath)
                    .videoCodec('libx264')
                    .audioCodec('aac')
                    .outputOptions([
                        '-pix_fmt yuv420p',
                        '-r 30',
                        '-s 1080x1920',
                        '-shortest'
                    ]);

                // Filters for Captions/Thumbnail
                const filters = [];

                // Scale and Crop to 9:16
                filters.push('scale=w=1080:h=1920:force_original_aspect_ratio=increase,crop=1080:1920');

                if (scene.isThumbnail) {
                    // Centered Hook Text for Thumbnail
                    // We use a simple box background
                    const cleanText = scene.text.replace(/[:"']/g, '');
                    filters.push(`drawtext=text='${cleanText}':fontcolor=yellow:fontsize=80:x=(w-text_w)/2:y=(h-text_h)/2:box=1:boxcolor=black@0.6:boxborderw=40`);
                } else if (scene.captionsEnabled) {
                    // Bottom Captions
                    const cleanText = scene.text.replace(/[:"']/g, '');
                    filters.push(`drawtext=text='${cleanText}':fontcolor=yellow:fontsize=60:x=(w-text_w)/2:y=h*0.8:box=1:boxcolor=black@0.5:boxborderw=20`);
                }

                f.videoFilters(filters)
                    .on('end', () => {
                        console.log(`EXPORT: Scene ${i} rendered successfully`);
                        resolve(true);
                    })
                    .on('error', (err) => {
                        console.error(`EXPORT: Error rendering scene ${i}:`, err);
                        reject(err);
                    })
                    .save(sceneOutputPath);
            });

            scenePaths.push(sceneOutputPath);
        }

        // Concatenate Scenes
        console.log('EXPORT: Concatenating', scenePaths.length, 'scenes');
        const listPath = path.join(tempDir, 'list.txt');
        const listContent = scenePaths.map(p => `file '${p}'`).join('\n');
        fs.writeFileSync(listPath, listContent);

        const concatenatedPath = path.join(tempDir, 'concatenated.mp4');
        await new Promise((resolve, reject) => {
            ffmpeg()
                .input(listPath)
                .inputOptions(['-f concat', '-safe 0'])
                .videoCodec('copy')
                .audioCodec('copy')
                .on('end', resolve)
                .on('error', reject)
                .save(concatenatedPath);
        });

        // Add Background Music if present
        let finalOutputPath = concatenatedPath;
        if (backgroundMusic) {
            console.log('EXPORT: Adding background music:', backgroundMusic.name);
            const musicPath = path.join(tempDir, 'music.mp3');

            // Background music URLs might be relative (/background_music/...)
            const musicUrl = backgroundMusic.url.startsWith('http')
                ? backgroundMusic.url
                : `http://localhost:${port}${backgroundMusic.url}`;

            try {
                const musicRes = await fetch(musicUrl);
                if (musicRes.ok) {
                    const musicBuf = Buffer.from(await musicRes.arrayBuffer());
                    fs.writeFileSync(musicPath, musicBuf);

                    const mixedPath = path.join(tempDir, 'final_video.mp4');
                    await new Promise((resolve, reject) => {
                        ffmpeg()
                            .input(concatenatedPath)
                            .input(musicPath)
                            .complexFilter([
                                `[0:a]volume=${narrationVolume || 1.0}[a1]`,
                                `[1:a]volume=${backgroundMusic.volume || 0.2}[a2]`,
                                '[a1][a2]amix=inputs=2:duration=first[a]'
                            ])
                            .outputOptions(['-map 0:v', '-map [a]', '-c:v copy', '-c:a aac'])
                            .on('end', resolve)
                            .on('error', reject)
                            .save(mixedPath);
                    });
                    finalOutputPath = mixedPath;
                }
            } catch (err) {
                console.error('EXPORT: Error adding music, fallback to no-music version:', err);
            }
        }

        console.log('EXPORT: Sending final file to client');
        res.download(finalOutputPath, 'my-reel.mp4', () => {
            // Cleanup temp dir
            try {
                fs.rmSync(tempDir, { recursive: true, force: true });
                console.log('EXPORT: Cleaned up temp directory');
            } catch (err) {
                console.error('EXPORT: Failed to cleanup temp dir:', err);
            }
        });

    } catch (error) {
        console.error('EXPORT_ERROR:', error);
        res.status(500).json({
            error: 'Video export failed',
            details: error instanceof Error ? error.message : String(error)
        });
        // Cleanup on error
        try {
            fs.rmSync(tempDir, { recursive: true, force: true });
        } catch (err) { }
    }
});

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
