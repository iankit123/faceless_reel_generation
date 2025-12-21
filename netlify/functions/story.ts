import serverless from 'serverless-http';
import { app } from '../../server';

const serverlessHandler = serverless(app);

export const handler = async (event: any, context: any) => {
    console.log('--- STORY FUNCTION INVOKED ---');
    console.log('Method:', event.httpMethod);
    console.log('Path:', event.path);
    console.log('Query:', JSON.stringify(event.queryStringParameters));

    // Validate Environment Variables
    const hasGroq = !!process.env.GROQ_API_KEY;
    const hasImageRouter = !!process.env.IMAGEROUTER_TOKEN;
    console.log('Env GROQ_API_KEY present:', hasGroq);
    console.log('Env IMAGEROUTER_TOKEN present:', hasImageRouter);

    // Hard GET sanity check
    if (event.httpMethod === 'GET') {
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'text/plain' },
            body: "story alive"
        };
    }

    if (!hasGroq) {
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Missing GROQ_API_KEY environment variable' })
        };
    }

    try {
        console.log('Parsing body...');
        if (event.body) {
            console.log('Body length:', event.body.length);
            console.log('Body preview:', event.body.substring(0, 100));
        }

        const result = await serverlessHandler(event, context);
        console.log('Function execution successful');
        return result;
    } catch (error: any) {
        console.error('--- STORY FUNCTION CRITICAL ERROR ---');
        console.error('Message:', error.message);
        console.error('Stack:', error.stack);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                error: 'Internal Server Error',
                message: error.message,
                stack: error.stack
            })
        };
    }
};
