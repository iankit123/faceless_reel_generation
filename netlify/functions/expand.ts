import Groq from 'groq-sdk';

const MODEL = "llama-3.3-70b-versatile";

async function expandPromptToStory(groq: Groq, prompt: string, language: string) {
    let languageInstruction =
        language === 'english'
            ? 'Write in simple spoken English.'
            : language === 'hindi'
                ? 'ALWAYS write the "narration" field in Hindi (Devanagari script).'
                : 'Write in Hinglish (Hindi written in English alphabets like "Aaj hum baat karenge...")';

    const systemPrompt = `
You are a storyteller.
Expand even a 1–5 word idea into a short narrated story. If words do not make sense still up a story closest to that word.

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
        const { prompt, language } = JSON.parse(event.body);
        const apiKey = process.env.GROQ_API_KEY;

        if (!apiKey) {
            return { statusCode: 500, body: JSON.stringify({ error: 'Missing GROQ_API_KEY' }) };
        }

        const groq = new Groq({ apiKey });
        const expandedStory = await expandPromptToStory(groq, prompt, language);

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify(expandedStory)
        };

    } catch (error: any) {
        console.error('Expansion Error:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Story expansion failed', details: error.message })
        };
    }
};
