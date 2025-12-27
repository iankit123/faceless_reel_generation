export const handler = async (event: any) => {
    console.log('--- MUSIC FUNCTION INVOKED ---');

    if (event.httpMethod === 'GET') {
        const files = [
            { id: 'jalwa-hai-hamara', name: 'Jalwa Hai Hamara', url: '/background_music/Jalwa Hai Hamara.mp3' },
            { id: 'mirzapur-guddu', name: 'Guddu Bhaiya Dialogue', url: '/background_music/Mirzapur Guddu Bhaiya Dialogue.mp3' },
            { id: 'pathan-zinda', name: 'Pathan Zinda Hai', url: '/background_music/Pathan Zinda Hai _ Pathaan Dialogue _ SRK.mp3' },
            { id: 'pushpa-2', name: 'Pushpa 2 Dialogue', url: '/background_music/Pushpa 2 Dialogue.mp3' },
            { id: 'sanjay-dutt', name: 'Sanjay Dutt Dialogue', url: '/background_music/Sanjay Dutt Dialogue.mp3' },
            { id: 'shivaji-maharaj', name: 'Shivaji Maharaj Dialogue', url: '/background_music/Chhatrapati Shivaji Maharaj Ko Sher Kehte Hai Dialogue.mp3' },
            { id: 'fashion-jalwa', name: 'Fashion Ka Jalwa', url: '/background_music/Fashion Ka Jalwa Song.mp3' },
            { id: 'hindi-funny', name: 'Hindi Funny Ringtone', url: '/background_music/Hindi Funny Ringtone Download Mp3.mp3' },
            { id: 'kya-hasin-hai', name: 'Kya Hasin Hai Sama', url: '/background_music/Kya Hasin Hai Sama - Shaam Bhi Khoob Hai _ Karz The Burden Of Truth _ Hindi.mp3' },
            { id: 'tu-jitna-bharat', name: 'Tu Jitna Bharat Ka Tha', url: '/background_music/Tu Jitna Bharat Ka Tha Utna Hi Hamara Hai - Ram Lala _ Vishal Mishra _ Bhakti.mp3' },
            { id: 'else', name: 'Else (Instrumental)', url: '/background_music/Else.mp3' },
            { id: 'disco', name: 'Disco', url: '/background_music/disco.mp3' },
            { id: 'disney', name: 'Disney', url: '/background_music/Disney.mp3' },
            { id: 'teddy', name: 'Teddy', url: '/background_music/Teddy.mp3' },
            { id: 'doodoo', name: 'Doodoo', url: '/background_music/Doodoo.mp3' }
        ].map(f => ({ ...f, duration: 0 }));

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify(files)
        };
    }

    return { statusCode: 405, body: 'Method Not Allowed' };
};
