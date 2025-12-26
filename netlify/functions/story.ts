import Groq from 'groq-sdk';
const MODEL = "llama-3.3-70b-versatile";

async function expandPromptToStory(groq: Groq, prompt: string, language: string, isNews: boolean = false) {
    let languageInstruction =
        language === 'english'
            ? 'Write in simple spoken English.'
            : language === 'hindi'
                ? 'ALWAYS write the "narration" field in Hindi (Devanagari script).'
                : 'Write in Hinglish (Hindi written in English alphabets like "Aaj hum baat karenge...")';

    const systemPrompt = isNews ? `
You are a viral news reporter.
Expand a short news headline into a detailed narrated news report.

Rules:
- Professional, high-energy tone.
- Mention current events as if reporting live.
- Spoken narration style, not prose.
- Short clear sentences.
- NO scenes.
- NO image prompts.

Output ONLY JSON:
{
  "title": "...",
  "theme": "Journalistic",
  "narration": "[Location] - [Date] | [Headline] ... [Investigation/Details]"
}

${languageInstruction}
` : `
You are a storyteller.
Expand even a 1–5 word idea into a short narrated story.

Rules:
- Add characters, setting, conflict, resolution
- Identify a CONSISTENT main character (age, gender, appearance)
- Choose a CONSISTENT visual theme (one of: realistic, comic, cartoon, lego, 3d-animation, cinematic)
- Spoken narration style, not prose
- Short clear sentences
- NO scenes
- NO image prompts

Output ONLY JSON:
{
  "title": "...",
  "theme": "chosen theme from list",
  "mainCharacter": "detailed description of main character/species",
  "narration": "full story narration"
}

${languageInstruction}
`;

    console.log('--- STAGE 1: PROMPT EXPANSION START ---');
    console.log('USER_PROMPT:', prompt);
    console.log('SYSTEM_PROMPT:', systemPrompt);

    const completion = await groq.chat.completions.create({
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
        ],
        model: MODEL,
        temperature: 0.8,
        response_format: { type: 'json_object' }
    });

    const content = completion.choices[0]?.message?.content || '{}';
    console.log('STAGE 1: OUTPUT:', content);
    console.log('--- STAGE 1: PROMPT EXPANSION END ---');

    return JSON.parse(content);
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

    try {
        const { prompt, language, isNews, isHoroscope } = JSON.parse(event.body);
        const apiKey = process.env.GROQ_API_KEY;

        if (!apiKey) {
            return { statusCode: 500, body: JSON.stringify({ error: 'Missing GROQ_API_KEY' }) };
        }

        const groq = new Groq({ apiKey });

        let expandedStory;
        if (isHoroscope) {
            expandedStory = {
                title: "Daily Horoscope",
                theme: "Astrology & Destiny",
                narration: prompt
            };
        } else {
            expandedStory = await expandPromptToStory(groq, prompt, language, isNews);
        }

        let systemPrompt = "";

        if (isHoroscope) {
            systemPrompt = `
You are an expert astrologer. Convert the provided horoscope text into EXACTLY 13 SCENES. NO MORE, NO LESS.
CRITICAL: You MUST include every single zodiac sign. Do NOT truncate or stop early.

Structure:
1. Scene 1: THUMBNAIL. 'isThumbnail': true. Viral headline like "TODAY'S DESTINY: ALL 12 SIGNS REVEALED".
2. Scenes 2-13: Each zodiac sign in order (Aries to Pisces).

Rules:
- Total scenes MUST BE EXACTLY 13.
- Format 'imagePrompt' to be celestial and zodiac-specific for each sign.
- Sign predictions MUST be extracted from the input data.

Output ONLY JSON:
{
  "title": "Daily Horoscope",
  "theme": "Astrology",
  "scenes": [
    { "text": "...", "imagePrompt": "celestial cosmic Aries sign...", "isThumbnail": true, "motionType": "zoom_in" },
    ...
  ]
}
`;
        } else if (isNews) {
            systemPrompt = `
You are a news video editor. Convert the news report into 7-10 Reel scenes.

Rules:
- Professional, journalistic tone.
- FIRST scene MUST be thumbnail (isThumbnail: true).
- Thumbnail text: viral, short news headline.
- imagePrompt: Realistic, photograph style, news reporting visuals.
- LAST scene: conclude with current status.

Output ONLY JSON:
{
  "title": "...",
  "theme": "News",
  "scenes": [
    { "text": "...", "imagePrompt": "realistic photo of...", "isThumbnail": true, "motionType": "zoom_in" }
  ]
}
`;
        } else {
            // General Video From Script
            const theme = (expandedStory as any).theme || 'realistic';
            const character = (expandedStory as any).mainCharacter || 'person';

            systemPrompt = `
You are a viral reel storyteller. Convert the story into 7-10 Reel scenes.

CONSISTENCY RULES (CRITICAL):
- Global Theme: ${theme}
- Main Character: ${character}
- EVERY 'imagePrompt' MUST strictly follow this format: 
  (theme: ${theme}, person/species: ${character}, scene prompt: [detailed specific scene description])

Rules:
- Spoken, engaging narration.
- FIRST scene MUST be thumbnail (isThumbnail: true).
- Thumbnail text: catchy, short hook.
- LAST scene: satisfying conclusion.

Output ONLY JSON:
{
  "title": "...",
  "theme": "${theme}",
  "scenes": [
    { 
      "text": "...", 
      "imagePrompt": "(theme: ${theme}, person/species: ${character}, scene prompt: ...)", 
      "isThumbnail": true, 
      "motionType": "zoom_in" 
    }
  ]
}
`;
        }

        const userMsg = isHoroscope
            ? `Horoscope Data (Convert to EXACTLY 13 SCENES: 1 Thumbnail + 12 Signs):\n${expandedStory.narration}`
            : `Title: ${expandedStory.title}\nTheme: ${expandedStory.theme}\nStory:\n${expandedStory.narration}\n${isNews ? 'NOTE: This is a NEWS REPORT. Keep the tone professional and journalistic.' : ''}`;

        console.log('--- STAGE 2: SCENE GENERATION START ---');
        console.log('USER_MESSAGE:', userMsg);
        console.log('SYSTEM_PROMPT:', systemPrompt);

        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                {
                    role: "user",
                    content: userMsg
                }
            ],
            model: MODEL,
            temperature: isHoroscope ? 0.5 : 0.6,
            max_tokens: isHoroscope ? 4000 : 1500,
            response_format: { type: "json_object" }
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) throw new Error('No content received from Groq');

        console.log('STAGE 2: OUTPUT:', content);
        console.log('--- STAGE 2: SCENE GENERATION END ---');

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: content
        };

    } catch (error: any) {
        console.error('Story Error:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Story generation failed', details: error.message })
        };
    }
};
