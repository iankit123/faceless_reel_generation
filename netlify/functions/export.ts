import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { EdgeTTS } from '@andresaya/edge-tts';

async function getTTSBuffer(text: string, voice?: string): Promise<Buffer> {
    const tts = new EdgeTTS();
    const selectedVoice = voice || 'hi-IN-SwaraNeural';
    await tts.synthesize(text, selectedVoice);
    return tts.toBuffer();
}

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
    return lines.join('\n');
}

export const handler = async (event: any) => {
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

    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'export-'));

    try {
        const { scenes, backgroundMusic, narrationVolume, language, captionSettings, isHoroscope, fixedImageUrl } = JSON.parse(event.body);

        if (!scenes || scenes.length === 0) {
            return { statusCode: 400, body: 'No scenes provided' };
        }

        // Check for ffmpeg
        try {
            await new Promise((resolve, reject) => {
                ffmpeg.getAvailableFormats((err) => {
                    if (err) reject(err);
                    else resolve(true);
                });
            });
        } catch (e) {
            return {
                statusCode: 501,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({
                    error: 'FFmpeg not available',
                    details: 'You need a paid plan to download the video'
                })
            };
        }

        const scenePaths: string[] = [];
        const captionStyle = captionSettings?.style || 'default';

        for (let i = 0; i < scenes.length; i++) {
            const scene = scenes[i];
            const imagePath = path.join(tempDir, `image_${i}.jpg`);
            const audioPath = path.join(tempDir, `audio_${i}.mp3`);
            const sceneOutputPath = path.join(tempDir, `scene_${i}.mp4`);

            // Download or Resolve Image Asset
            try {
                const imgRes = await fetch(scene.imageUrl);
                if (!imgRes.ok) throw new Error(`Failed to download image: ${scene.imageUrl}`);
                fs.writeFileSync(imagePath, Buffer.from(await imgRes.arrayBuffer()));
            } catch (e) {
                // Fallback to a placeholder or skip if needed
                console.error(`Failed to get image for scene ${i}:`, e);
                // Creating a black image if download fails to prevent crash
                await new Promise((resolve, reject) => {
                    ffmpeg().input('color=c=black:s=1080x1920').inputOptions(['-f lavfi']).frames(1).save(imagePath).on('end', resolve).on('error', reject);
                });
            }

            // Obtain Audio Asset (TTS)
            const voice = language === 'english' ? 'en-GB-SoniaNeural' : 'hi-IN-SwaraNeural';
            const audioBuffer = await getTTSBuffer(scene.text, voice);
            fs.writeFileSync(audioPath, audioBuffer);

            // Render Scene
            await new Promise((resolve, reject) => {
                const f = ffmpeg()
                    .input(imagePath)
                    .loop(scene.duration || 5)
                    .input(audioPath)
                    .videoCodec('libvpx-vp9') // Often better supported in serverless if libx264 is missing
                    .outputOptions([
                        '-pix_fmt yuv420p',
                        '-shortest',
                        '-vf', `scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920`
                    ]);

                // Captions (Using basic drawtext without explicit font paths for Linux compatibility)
                const textToWrap = (captionStyle === 'beast') ? scene.text.toUpperCase() : scene.text;
                const wrapped = wrapText(textToWrap, 25);
                const txtPath = path.join(tempDir, `cap_${i}.txt`);
                fs.writeFileSync(txtPath, wrapped);

                // On Linux, drawtext will look for fonts in /usr/share/fonts.
                // If it fails, it might be due to missing font entirely.
                f.videoFilters([
                    `drawtext=textfile='${txtPath}':fontcolor=white:fontsize=75:x=(w-text_w)/2:y=h*0.82-text_h/2:box=1:boxcolor=black@0.6:boxborderw=20`
                ]);

                f.on('end', resolve).on('error', reject).save(sceneOutputPath);
            });
            scenePaths.push(sceneOutputPath);
        }

        // Concatenate Scenes
        const listPath = path.join(tempDir, 'list.txt');
        fs.writeFileSync(listPath, scenePaths.map(p => `file '${p}'`).join('\n'));
        const finalPath = path.join(tempDir, 'final.mp4');

        await new Promise((resolve, reject) => {
            ffmpeg()
                .input(listPath)
                .inputOptions(['-f concat', '-safe 0'])
                .videoCodec('copy')
                .on('end', resolve)
                .on('error', reject)
                .save(finalPath);
        });

        const videoBuffer = fs.readFileSync(finalPath);

        // Cleanup temp files
        try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (e) { }

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'video/mp4',
                'Access-Control-Allow-Origin': '*',
                'Content-Disposition': 'attachment; filename="reel.mp4"'
            },
            body: videoBuffer.toString('base64'),
            isBase64Encoded: true
        };

    } catch (error: any) {
        console.error('Export Error:', error);
        try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (e) { }
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Export failed', details: error.message })
        };
    }
};
