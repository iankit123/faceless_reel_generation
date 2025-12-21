export const handler = async (event: any) => {
    console.log('--- MUSIC FUNCTION INVOKED ---');

    if (event.httpMethod === 'GET') {
        const files = [
            {
                id: 'else',
                name: 'Else',
                url: '/background_music/Else.mp3',
                duration: 0
            },
            {
                id: 'disco',
                name: 'Disco',
                url: '/background_music/disco.mp3',
                duration: 0
            },
            {
                id: 'disney',
                name: 'Disney',
                url: '/background_music/Disney.mp3',
                duration: 0
            },
            {
                id: 'teddy',
                name: 'Teddy',
                url: '/background_music/Teddy.mp3',
                duration: 0
            }
        ];

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify(files)
        };
    }

    return { statusCode: 405, body: 'Method Not Allowed' };
};
