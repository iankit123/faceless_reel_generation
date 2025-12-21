import serverless from 'serverless-http';
import { app } from '../../server';

const serverlessHandler = serverless(app);

export const handler = async (event: any, context: any) => {
    console.log('--- FUNCTION INVOKED ---');
    console.log('Method:', event.httpMethod);
    console.log('Path:', event.path);
    console.log('Body:', event.body ? (event.body.length > 100 ? event.body.substring(0, 100) + '...' : event.body) : 'empty');
    console.log('Env GROQ_API_KEY present:', !!process.env.GROQ_API_KEY);
    console.log('Env IMAGEROUTER_TOKEN present:', !!process.env.IMAGEROUTER_TOKEN);

    // Sanity check for GET requests to the function URL directly
    if (event.httpMethod === 'GET' && (event.path.includes('/api') || event.path.includes('/story'))) {
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: "Story function alive", environment: process.env.NODE_ENV })
        };
    }

    try {
        const result = await serverlessHandler(event, context);
        return result;
    } catch (error: any) {
        console.error('--- TOP LEVEL FUNCTION ERROR ---');
        console.error(error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                error: 'Internal Server Error in Netlify Function',
                message: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            })
        };
    }
};
