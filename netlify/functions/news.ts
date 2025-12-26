export const handler = async (event: any) => {
    try {
        const { language } = event.queryStringParameters || {};
        const isHindi = language === 'hindi' || language === 'hinglish';

        // News18 Hindi for Hindi/Hinglish, TOI for English
        const storiesUrl = isHindi
            ? 'https://hindi.news18.com/rss/khabar/nation/nation.xml'
            : 'https://timesofindia.indiatimes.com/rssfeedstopstories.cms';

        const horoUrl = 'https://feeds.feedburner.com/dayhoroscope';

        console.log(`NEWS_RSS: Fetching feeds for language: ${language}`);
        const [storiesRes, horoRes] = await Promise.all([
            fetch(storiesUrl),
            fetch(horoUrl)
        ]);

        const [xml, horoXml] = await Promise.all([
            storiesRes.ok ? storiesRes.text() : '',
            horoRes.ok ? horoRes.text() : ''
        ]);

        const news = [];

        // 1. Prioritize Horoscope
        if (horoXml) {
            const hItems = horoXml.matchAll(/<item>(.*?)<\/item>/gs);
            let combinedHoro = "";
            for (const m of hItems) {
                const itemXml = m[1];
                const title = (itemXml.match(/<title>\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*<\/title>/) || itemXml.match(/<title>([\s\S]*?)<\/title>/))?.[1]?.trim() || "";
                const desc = (itemXml.match(/<description>\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*<\/description>/) || itemXml.match(/<description>([\s\S]*?)<\/description>/))?.[1]?.trim() || "";
                if (title && desc) {
                    combinedHoro += `${title}\n${desc.replace(/<[^>]*>/g, '').trim()}\n\n`;
                }
            }

            if (combinedHoro) {
                news.push({
                    title: isHindi ? "✨ आज का राशिफल" : "✨ Daily Horoscope",
                    description: isHindi
                        ? "आपका आज का भाग्य! सभी 12 राशियों के लिए विस्तृत भविष्यफल प्राप्त करें।"
                        : "Your destiny for today! Get detailed readings for all 12 zodiac signs.",
                    imageUrl: "/assets/horoscope_bg.jpg",
                    isHoroscope: true,
                    fullContent: combinedHoro.substring(0, 15000)
                });
            }
        }

        // 2. Regular News
        if (xml) {
            const itemMatches = xml.matchAll(/<item>(.*?)<\/item>/gs);
            for (const match of itemMatches) {
                const itemXml = match[1];
                const titleMatch = itemXml.match(/<title>\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*<\/title>/) || itemXml.match(/<title>([\s\S]*?)<\/title>/);
                const descMatch = itemXml.match(/<description>\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*<\/description>/) || itemXml.match(/<description>([\s\S]*?)<\/description>/);

                let imageUrl = (itemXml.match(/<enclosure.*?url="(.*?)"/) || itemXml.match(/<media:content.*?url="(.*?)"/))?.[1] || null;

                if (titleMatch && descMatch) {
                    news.push({
                        title: titleMatch[1].trim().replace(/<[^>]*>/g, ''),
                        description: descMatch[1].trim().replace(/<[^>]*>/g, ''),
                        imageUrl: imageUrl
                    });
                }
                if (news.length >= 25) break;
            }
        }

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(news)
        };

    } catch (error: any) {
        console.error('NEWS_ERROR:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to fetch news', details: error.message })
        };
    }
};
