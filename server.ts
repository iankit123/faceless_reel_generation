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
import multer from 'multer';
import { exec } from 'child_process';

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
    apiKey: process.env.GROQ_API_KEY
});

app.use(cors());

function wrapText(text: string, maxChars: number = 20): string {
    const words = text.split(' ');
    let lines = [];
    let currentLine = '';

    words.forEach(word => {
        if ((currentLine + word).length <= maxChars) {
            currentLine += (currentLine === '' ? '' : ' ') + word;
        } else {
            if (currentLine) lines.push(currentLine);
            currentLine = word;
        }
    });
    if (currentLine) lines.push(currentLine);
    // For textfile, we use literal newlines
    return lines.join('\n');
}

function getTimedCaptions(text: string, totalDuration: number) {
    if (!text || totalDuration <= 0) return [];

    // Split by punctuation: . ! ? , ;
    const rawSegments = text.split(/(?<=[.!?,;])\s+/);
    const segments: string[] = [];
    const MAX_LENGTH = 45;

    rawSegments.forEach(seg => {
        if (seg.length <= MAX_LENGTH) {
            segments.push(seg);
        } else {
            const words = seg.split(/\s+/);
            let current = '';
            words.forEach(word => {
                if ((current + (current ? ' ' : '') + word).length <= MAX_LENGTH) {
                    current += (current ? ' ' : '') + word;
                } else {
                    if (current) segments.push(current);
                    current = word;
                }
            });
            if (current) segments.push(current);
        }
    });

    const totalChars = segments.reduce((acc, s) => acc + s.length, 0);
    let currentTime = 0;

    return segments.map(s => {
        const duration = (s.length / totalChars) * totalDuration;
        const seg = {
            text: s.trim(),
            start: currentTime,
            end: currentTime + duration
        };
        currentTime += duration;
        return seg;
    });
}

async function getTTSBuffer(text: string, voice?: string): Promise<Buffer> {
    console.log(`TTS: Generating buffer for text: ${text.substring(0, 30)}...`);
    const tts = new EdgeTTS();
    const selectedVoice = voice || 'hi-IN-SwaraNeural';
    await tts.synthesize(text, selectedVoice);
    const audioBuffer = tts.toBuffer();
    if (!audioBuffer || audioBuffer.length === 0) {
        throw new Error('Empty audio buffer generated');
    }
    return audioBuffer;
}

const storage = multer.diskStorage({
    destination: '/tmp/reel-ocr-uploads',
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});
const upload = multer({ storage });

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
            const audioBuffer = await getTTSBuffer(text, voice);
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
                    content: `You are a viral reels video script writer. 
                    Create a compelling story to be put on instagram reels based on the user's prompt.
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
                    Keep it to 7-10 scenes. ${languageInstruction}

                    CRITICAL: The FIRST scene (index 0) MUST ALWAYS be a Thumbnail scene.
                    - Set "isThumbnail": true for 이 scene.
                    - "text" for this scene should be a short, highly compelling hook/title (e.g. "Secret of the Pyramids", "Why Lions don't eat Grass"). 
                    - It should NOT be a long character dialogue, but a viral hook.
                    - "duration" should be short (2-3 seconds).

                    CRITICAL: The LAST scene should be either a moral of story or end of story type or a suspense creating scene.

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
    const { scenes, backgroundMusic, narrationVolume, language, captionSettings } = req.body;
    console.log('EXPORT_REQUEST: Starting export for', scenes?.length, 'scenes');

    if (!scenes || scenes.length === 0) {
        return res.status(400).json({ error: 'No scenes provided' });
    }

    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'reel-export-'));
    console.log('EXPORT: Created temp directory:', tempDir);

    try {
        const scenePaths: string[] = [];
        const captionStyle = captionSettings?.style || 'default';
        console.log(`EXPORT: Applying caption style: ${captionStyle}`);

        for (let i = 0; i < scenes.length; i++) {
            const scene = scenes[i];
            console.log(`EXPORT: Processing scene ${i + 1}/${scenes.length} (Thumbnail: ${!!scene.isThumbnail})`);

            // Download or Resolve Image Asset
            const imagePath = path.join(tempDir, `image_${i}.jpg`);
            if (scene.imageUrl?.startsWith('http')) {
                console.log(`EXPORT: Downloading image from ${scene.imageUrl}`);
                const imgRes = await fetch(scene.imageUrl);
                if (!imgRes.ok) throw new Error(`Failed to download image: ${scene.imageUrl}`);
                fs.writeFileSync(imagePath, Buffer.from(await imgRes.arrayBuffer()));
            } else if (scene.imageUrl?.startsWith('/')) {
                const localPath = path.join(__dirname, 'public', scene.imageUrl);
                console.log(`EXPORT: Using local image from ${localPath}`);
                if (fs.existsSync(localPath)) {
                    fs.copyFileSync(localPath, imagePath);
                } else {
                    throw new Error(`Local image not found: ${localPath}`);
                }
            } else {
                throw new Error(`Invalid image URL: ${scene.imageUrl}`);
            }

            // Obtain Audio Asset
            const audioPath = path.join(tempDir, `audio_${i}.mp3`);
            const sceneOutputPath = path.join(tempDir, `scene_${i}.mp4`);

            if (scene.audioUrl && scene.audioUrl.startsWith('http') && !scene.audioUrl.includes('blob:')) {
                console.log(`EXPORT: Downloading audio from ${scene.audioUrl}`);
                const audioRes = await fetch(scene.audioUrl);
                if (!audioRes.ok) throw new Error(`Failed to download audio: ${scene.audioUrl}`);
                fs.writeFileSync(audioPath, Buffer.from(await audioRes.arrayBuffer()));
            } else {
                console.log(`EXPORT: Audio URL is blob or missing, re-generating TTS for scene ${i}`);
                const voice = language === 'english' ? 'en-GB-SoniaNeural' : 'hi-IN-SwaraNeural';
                const audioBuffer = await getTTSBuffer(scene.text, voice);
                fs.writeFileSync(audioPath, audioBuffer);
            }

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

                // Scale and Crop to 9:16 + Motion Effects
                if (scene.motionType && scene.motionType !== 'none') {
                    // Pre-scale to a larger size for zoompan to avoid quality loss (2x 1080x1920)
                    // CRITICAL: Use force_original_aspect_ratio and crop to prevent stretching
                    filters.push('scale=w=2160:h=3840:force_original_aspect_ratio=increase,crop=2160:3840');

                    const durationFrames = Math.ceil(scene.duration * 30);
                    let zoompanFilter = '';

                    switch (scene.motionType) {
                        case 'zoom_in':
                            zoompanFilter = `zoompan=z='min(zoom+0.001,1.5)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1080x1920:fps=30`;
                            break;
                        case 'pan_left':
                            zoompanFilter = `zoompan=z='1.2':x='(1-on/${durationFrames})*(iw-iw/zoom)':y='ih/2-(ih/zoom/2)':d=1:s=1080x1920:fps=30`;
                            break;
                        case 'pan_right':
                            zoompanFilter = `zoompan=z='1.2':x='(on/${durationFrames})*(iw-iw/zoom)':y='ih/2-(ih/zoom/2)':d=1:s=1080x1920:fps=30`;
                            break;
                        case 'pan_up':
                            zoompanFilter = `zoompan=z='1.2':x='iw/2-(iw/zoom/2)':y='(1-on/${durationFrames})*(ih-ih/zoom)':d=1:s=1080x1920:fps=30`;
                            break;
                        case 'pan_down':
                            zoompanFilter = `zoompan=z='1.2':x='iw/2-(iw/zoom/2)':y='(on/${durationFrames})*(ih-ih/zoom)':d=1:s=1080x1920:fps=30`;
                            break;
                        default:
                            zoompanFilter = `scale=w=1080:h=1920:force_original_aspect_ratio=increase,crop=1080:1920`;
                    }
                    filters.push(zoompanFilter);
                } else {
                    filters.push('scale=w=1080:h=1920:force_original_aspect_ratio=increase,crop=1080:1920');
                }

                const fontBold = '/System/Library/Fonts/Supplemental/Arial Bold.ttf';
                const fontUnicode = '/Library/Fonts/Arial Unicode.ttf';
                const fontComic = '/System/Library/Fonts/Supplemental/Comic Sans MS Bold.ttf';
                const fontElegant = '/System/Library/Fonts/Supplemental/Georgia Bold.ttf';

                let fontToUse = (language === 'hindi') ? fontUnicode : fontBold;

                // Determine styling based on theme
                let fontColor = 'yellow';
                let boxColor = 'black@0.5';
                let boxBorder = 20;

                if (captionStyle === 'tiktok') {
                    fontColor = 'white';
                    boxColor = 'black@0.5';
                } else if (captionStyle === 'beast') {
                    fontColor = 'yellow';
                    boxColor = 'black@0.8';
                } else if (captionStyle === 'neon') {
                    fontColor = '0x4ADE80'; // Neon Green
                    boxColor = 'black@0.8';
                } else if (captionStyle === 'comic') {
                    fontToUse = fontComic;
                    fontColor = '0xFFD700'; // Gold/Yellow
                    boxColor = 'white@0.1';
                } else if (captionStyle === 'elegant') {
                    fontToUse = fontElegant;
                    fontColor = 'white';
                    boxColor = 'black@0.3';
                }

                if (scene.isThumbnail) {
                    // UPPERCASE for Thumbnail as in UI, Much Bigger
                    const wrapped = wrapText(scene.text.toUpperCase(), 12);
                    const txtPath = path.join(tempDir, `thumb_${i}.txt`);
                    fs.writeFileSync(txtPath, wrapped);
                    filters.push(`drawtext=textfile='${txtPath}':fontfile='${fontToUse}':fontcolor=${fontColor}:fontsize=110:x=(w-text_w)/2:y=(h-text_h)/2:box=1:boxcolor=${boxColor}:boxborderw=60:line_spacing=40:shadowcolor=black@0.8:shadowx=5:shadowy=5:text_align=center`);
                } else if (scene.captionsEnabled) {
                    const segments = getTimedCaptions(scene.text, scene.duration);
                    segments.forEach((seg, idx) => {
                        const textToWrap = (captionStyle === 'beast') ? seg.text.toUpperCase() : seg.text;
                        const wrapped = wrapText(textToWrap, 25);
                        const txtPath = path.join(tempDir, `cap_${i}_${idx}.txt`);
                        fs.writeFileSync(txtPath, wrapped);
                        filters.push(`drawtext=textfile='${txtPath}':fontfile='${fontToUse}':fontcolor=${fontColor}:fontsize=75:x=(w-text_w)/2:y=h*0.82-text_h/2:box=1:boxcolor=${boxColor}:boxborderw=${boxBorder}:line_spacing=20:enable='between(t,${seg.start},${seg.end})':shadowcolor=black@0.8:shadowx=3:shadowy=3:text_align=center`);
                    });
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
            console.log(`EXPORT: Adding background music: ${backgroundMusic.name} (Volume: ${backgroundMusic.volume})`);
            const musicPath = path.join(tempDir, 'music.mp3');

            try {
                // Background music URLs might be relative (/background_music/...) or absolute
                if (backgroundMusic.url.startsWith('http') && !backgroundMusic.url.includes('localhost')) {
                    console.log(`EXPORT: Downloading remote music from ${backgroundMusic.url}`);
                    const musicRes = await fetch(backgroundMusic.url);
                    if (!musicRes.ok) throw new Error(`Failed to download music: ${backgroundMusic.url}`);
                    fs.writeFileSync(musicPath, Buffer.from(await musicRes.arrayBuffer()));
                } else {
                    // Resolve locally from public folder
                    const localMusicPath = path.join(__dirname, 'public', backgroundMusic.url);
                    console.log(`EXPORT: Resolving local music from ${localMusicPath}`);
                    if (fs.existsSync(localMusicPath)) {
                        fs.copyFileSync(localMusicPath, musicPath);
                    } else {
                        // Try stripped path
                        const strippedPath = backgroundMusic.url.replace(/^\//, '');
                        const altLocalPath = path.join(__dirname, 'public', strippedPath);
                        if (fs.existsSync(altLocalPath)) {
                            fs.copyFileSync(altLocalPath, musicPath);
                        } else {
                            throw new Error(`Local music not found: ${localMusicPath}`);
                        }
                    }
                }

                if (fs.existsSync(musicPath)) {
                    const mixedPath = path.join(tempDir, 'final_video.mp4');
                    const nVol = (narrationVolume !== undefined) ? narrationVolume : 1.0;
                    const mVol = (backgroundMusic.volume !== undefined) ? backgroundMusic.volume : 0.2;

                    console.log(`EXPORT: Mixing audio - Narration: ${nVol}, Music: ${mVol}`);

                    await new Promise((resolve, reject) => {
                        ffmpeg()
                            .input(concatenatedPath)
                            .input(musicPath)
                            .complexFilter([
                                `[0:a]volume=${nVol}[a1]`,
                                `[1:a]volume=${mVol}[a2]`,
                                '[a1][a2]amix=inputs=2:duration=first:dropout_transition=2[a]'
                            ])
                            .outputOptions(['-map 0:v', '-map [a]', '-c:v copy', '-c:a aac', '-shortest'])
                            .on('end', resolve)
                            .on('error', (err) => {
                                console.error('EXPORT: FFmpeg amix error:', err);
                                reject(err);
                            })
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

app.post('/api/ocr', upload.single('image'), async (req, res) => {
    let imagePath = '';

    if (req.file) {
        imagePath = req.file.path;
    } else if (req.body.image) {
        // Handle base64 from JSON (needed for deployment/refactored frontend)
        const base64Data = req.body.image;
        const tempFilename = `ocr-${Date.now()}-${Math.round(Math.random() * 1E9)}.png`;
        imagePath = path.join('/tmp/reel-ocr-uploads', tempFilename);
        if (!fs.existsSync('/tmp/reel-ocr-uploads')) {
            fs.mkdirSync('/tmp/reel-ocr-uploads', { recursive: true });
        }
        fs.writeFileSync(imagePath, Buffer.from(base64Data, 'base64'));
    }

    if (!imagePath) {
        return res.status(400).json({ error: 'No image provided' });
    }

    console.log(`OCR: Processing image at ${imagePath}`);

    // paddleocr ocr -i ./sample.png
    const command = `/opt/miniconda3/bin/paddleocr ocr -i "${imagePath}"`;

    exec(command, {
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
        env: { ...process.env, DISABLE_MODEL_SOURCE_CHECK: 'True' }
    }, (error, stdout, stderr) => {
        const cleanup = () => {
            try {
                if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
            } catch (e) { }
        };

        // Combine both because paddleocr often logs to stderr
        const fullOutput = (stdout + '\n' + stderr).replace(/\x1B\[[0-9;]*[mK]/g, ''); // Strip ANSI colors
        console.log('--- OCR FULL OUTPUT ---');
        console.log(fullOutput);

        try {
            let extractedText = '';

            // Look for 'rec_texts': [...] or "rec_texts": [...]
            const recTextsMatch = fullOutput.match(/['"]rec_texts['"]\s*:\s*\[(.*?)\]/s);

            if (recTextsMatch && recTextsMatch[1]) {
                const textsStr = recTextsMatch[1];
                // Extract strings: correctly handles '...' and "..." segments 
                // by matching each quote type until its specific closing counterpart.
                const textSegments = textsStr.match(/'[^']*'|"[^"]*"/g)?.map(s => s.slice(1, -1)) || [];
                extractedText = textSegments.join(' ');
            }

            if (!extractedText || extractedText.trim() === '') {
                console.warn('OCR: No text extracted from output strings');

                // Fallback: If we can't find rec_texts list, maybe it failed
                if (!fullOutput.includes('rec_texts')) {
                    return res.status(500).json({
                        error: 'OCR extraction failed - No result found',
                        details: error?.message || 'Command succeeded but produced no text marker',
                        stdout: stdout,
                        stderr: stderr
                    });
                }
            }

            console.log('OCR: Extracted Text Success:', extractedText.substring(0, 50) + '...');
            cleanup();
            res.json({ text: extractedText });

        } catch (err: any) {
            console.error('OCR Parse Error:', err);
            cleanup();
            res.status(500).json({
                error: 'Failed to parse OCR output',
                details: err.message,
                stdout: stdout,
                stderr: stderr
            });
        }
    });
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
