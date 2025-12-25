import Groq from 'groq-sdk';
const MODEL = "llama-3.3-70b-versatile";

/**
 * STAGE 1: Story Expansion
 * Goal: Turn a short user prompt into a rich, full narrated story script.
 */
async function expandStory(groq: Groq, prompt: string, language: string) {
    console.log('--- STAGE 1: EXPANDING STORY ---');

    let languageInstruction = "User input may be in Hindi or Hinglish. ALWAYS generate the 'narration' field in Hindi (Devanagari script).";
    if (language === 'english') {
        languageInstruction = "Generate the 'narration' field in English.";
    }

    const completion = await groq.chat.completions.create({
        messages: [
            {
                role: "system",
                content: `You are a viral storyteller. Your goal is to expand even 1-5 word prompts into a rich, cinematic short story.
                
                REQUIREMENTS:
                1. Characters & Arc: Add specific characters, a setting, and a clear emotional conflict or arc.
                2. Narration Style: Write in a natural, spoken narration style suitable for a voiceover.
                3. Structure: Keep it conversational and fast-paced for short-form video (Reels/TikTok).
                4. Output Structure: You MUST return a JSON object with:
                   {
                     "title": "A catchy viral title",
                     "theme": "A concise visual style description (e.g. Cinematic, Cyberpunk, Watercolor)",
                     "narration": "The full narrated text (60-90 seconds worth of speech)."
                   }
                
                ${languageInstruction}
                Short sentences only. No prose or stage directions in the narration field.`
            },
            {
                role: "user",
                content: `Expand this idea into a full viral story: ${prompt}`
            }
        ],
        model: MODEL,
        temperature: 0.8,
        response_format: { type: "json_object" }
    });

    const result = JSON.parse(completion.choices[0]?.message?.content || '{}');
    console.log('Stage 1 Result:', result.title);
    return result;
}

/**
 * STAGE 2: Scene Generation
 * Goal: Decompose the expanded narration into optimized scenes for the video pipeline.
 */
async function generateScenes(groq: Groq, expandedStory: any, language: string) {
    console.log('--- STAGE 2: GENERATING SCENES ---');

    let languageInstruction = "The 'text' field for each scene MUST be in Hindi (Devanagari script).";
    if (language === 'english') {
        languageInstruction = "The 'text' field for each scene MUST be in English.";
    }

    const completion = await groq.chat.completions.create({
        messages: [
            {
                role: "system",
                content: `You are a film director. Take the provided Story Narration and turn it into 6 to 10 cinematic scenes.
                
                INPUT:
                Title: ${expandedStory.title}
                Theme: ${expandedStory.theme}
                Full Narration: ${expandedStory.narration}

                REQUIREMENTS:
                1. Fragmentation: Split the "Full Narration" into 6-10 logical scene segments. Every word of the narration must be included across the scenes.
                2. Thumbnail: The VERY FIRST scene (index 0) MUST be a thumbnail scene. 
                   - Set "isThumbnail": true.
                   - "text" should be a short, clickable hook (e.g. "The Secret is Out!").
                   - "duration" should be 2-3 seconds.
                3. Image Prompts: For each scene, write an imagePrompt that:
                   - Describes the subject, setting, and mood in detail.
                   - Maintains STRICT visual consistency (features, clothes, age) for characters across all scenes.
                4. Motion: Assign "motionType" (zoom_in, pan_left, etc.) that fits the scene's mood.
                5. Output Structure: Return the exact JSON expected by the video pipeline:
                   {
                     "title": "...",
                     "theme": "...",
                     "scenes": [
                       { "text": "...", "imagePrompt": "...", "motionType": "...", "isThumbnail": boolean, "duration": number }
                     ]
                   }
                
                ${languageInstruction}
                Do NOT change the story content. ONLY decompose the provided narration into scenes.`
            }
        ],
        model: MODEL,
        temperature: 0.4, // Lower temperature for more consistent structural decomposition
        response_format: { type: "json_object" }
    });

    const result = JSON.parse(completion.choices[0]?.message?.content || '{}');
    console.log('Stage 2 Complete. Scenes:', result.scenes?.length);
    return result;
}

export const handler = async (event: any) => {
    console.log('--- STORY FUNCTION INVOKED (Two-Stage) ---');

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
        const { prompt, language } = JSON.parse(event.body);
        const apiKey = process.env.GROQ_API_KEY;

        if (!apiKey) {
            return { statusCode: 500, body: JSON.stringify({ error: 'Missing GROQ_API_KEY' }) };
        }

        const groq = new Groq({ apiKey });

        // --- PIPELINE EXECUTION ---
        // Stage 1: Expand the prompt into a rich narration
        const expanded = await expandStory(groq, prompt, language);

        // Stage 2: Convert narration into consistent scenes
        const finalProject = await generateScenes(groq, expanded, language);

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify(finalProject)
        };

    } catch (error: any) {
        console.error('Pipeline Error:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Story generation failed', details: error.message })
        };
    }
};
