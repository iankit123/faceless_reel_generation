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
  "theme": "...",
  "narration": "[Location] - [Date] | [Headline] ... [Investigation/Details]"
}

${languageInstruction}
` : `
You are a storyteller.
Expand even a 1–5 word idea into a short narrated story.

Rules:
- Add characters, setting, conflict, resolution
- Spoken narration style, not prose
- Short clear sentences
- NO scenes
- NO image prompts

Output ONLY JSON:
{
  "title": "...",
  "theme": "...",
  "narration": "full story narration"
}

${languageInstruction}
`;

    const completion = await groq.chat.completions.create({
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
        ],
        model: MODEL,
        temperature: 0.8,
        response_format: { type: 'json_object' }
    });

    return JSON.parse(completion.choices[0]?.message?.content || '{}');
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

        const systemPrompt = isHoroscope ? `
You are an expert astrologer. Convert the provided horoscope text into EXACTLY 13 SCENES. NO MORE, NO LESS.
CRITICAL: You MUST include every single zodiac sign. Do NOT truncate or stop early.

Structure:
1. Scene 1: THUMBNAIL. 'isThumbnail': true. Viral headline like "TODAY'S DESTINY: ALL 12 SIGNS REVEALED".
2. Scene 2: Aries
3. Scene 3: Taurus
4. Scene 4: Gemini
5. Scene 5: Cancer
6. Scene 6: Leo
7. Scene 7: Virgo
8. Scene 8: Libra
9. Scene 9: Scorpio
10. Scene 10: Sagittarius
11. Scene 11: Capricorn
12. Scene 12: Aquarius
13. Scene 13: Pisces

Rules:
- Total scenes MUST BE EXACTLY 13.
- All signs MUST be in the specified order.
- Sign predictions MUST be extracted from the input data.
- All scenes after the first one MUST have 'isThumbnail': false.

Output ONLY JSON:
{
  "title": "Daily Horoscope",
  "theme": "Astrology",
  "scenes": [
    { "text": "...", "isThumbnail": true, "motionType": "zoom_in" },
    { "text": "Aries: ...", "isThumbnail": false, "motionType": "zoom_in" },
    ...
  ]
}
` : `
You convert a news report or story into Instagram Reel scenes.

Rules:
- Do NOT invent new story content
- Use the narration exactly as given
- 7–10 scenes total
- FIRST scene MUST be thumbnail (isThumbnail=true)
- Thumbnail text must be a short, viral BREAKING NEWS headline
- LAST scene must conclude with the current status of the situation
- Keep the visual theme consistent with news reporting

Output ONLY JSON:
{
  "title": "...",
  "theme": "...",
  "scenes": [
    {
      "text": "...",
      "imagePrompt": "...",
      "motionType": "zoom_in | pan_left | pan_right | pan_up | pan_down | none",
      "isThumbnail": true
    }
  ]
}
`;

        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                {
                    role: "user",
                    content: isHoroscope
                        ? `Horoscope Data (Convert to EXACTLY 13 SCENES: 1 Thumbnail + 12 Signs):\n${expandedStory.narration}`
                        : `Title: ${expandedStory.title}\nTheme: ${expandedStory.theme}\nStory:\n${expandedStory.narration}\n${isNews ? 'NOTE: This is a NEWS REPORT. Keep the tone professional and journalistic.' : ''}`
                }
            ],
            model: MODEL,
            temperature: isHoroscope ? 0.5 : 0.6,
            max_tokens: isHoroscope ? 4000 : 1500,
            response_format: { type: "json_object" }
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) throw new Error('No content received from Groq');

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
