import { useRef, useEffect } from 'react';
import { useVideoStore } from '../store/useVideoStore';

export function VideoCarousel() {
    const uiLanguage = useVideoStore((s) => s.uiLanguage);
    const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

    const samples = [
        { type: 'video', url: '/samples/my-reel-1766600900717.mp4', title: uiLanguage === 'hi' ? 'द क्लियोपेट्रा इफ़ेक्ट' : 'Astroid story' },
        { type: 'image', url: 'https://images.unsplash.com/photo-1541873676-a18131494184?auto=format&fit=crop&q=80&w=800', title: uiLanguage === 'hi' ? 'इतिहास' : 'Moon Landing was FAKE' },
        { type: 'video', url: '/samples/my-reel-1766603727116.mp4', title: uiLanguage === 'hi' ? 'वायरल रील्स' : 'Mahabharat' },
        { type: 'image', url: 'https://images.unsplash.com/photo-1582125169590-59f4985fb32a?auto=format&fit=crop&q=80&w=800', title: uiLanguage === 'hi' ? 'द क्लियोपेट्रा इफ़ेक्ट' : 'Cleaupatra' },
        { type: 'video', url: '/samples/my-reel-1766604338659.mp4', title: uiLanguage === 'hi' ? 'इतिहास' : 'EAGEL AND CHICKEN' },
        { type: 'image', url: 'https://plus.unsplash.com/premium_vector-1721077382049-f4deff3c4cf7?auto=format&fit=crop&q=80&w=800', title: uiLanguage === 'hi' ? 'एक लड़का और उसका कुत्ता' : 'School Boy' },
    ];

    // Repeat samples to insure the carousel is wide enough for infinite scroll
    const allSamples = [...samples, ...samples, ...samples, ...samples];

    // Synchronization Logic:
    // Periodically sync currentTime of videos with the same source to prevent jarring "restarts"
    useEffect(() => {
        const interval = setInterval(() => {
            const videoMap = new Map<string, number>();

            videoRefs.current.forEach((video) => {
                if (!video || video.paused) return;

                const src = video.currentSrc || video.src;
                if (!videoMap.has(src)) {
                    // This is the "master" for this src
                    videoMap.set(src, video.currentTime);
                } else {
                    // Sync this one to the master if it drifts significantly (> 0.2s)
                    const masterTime = videoMap.get(src)!;
                    if (Math.abs(video.currentTime - masterTime) > 0.2) {
                        video.currentTime = masterTime;
                    }
                }
            });
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="w-full overflow-hidden mt-0 py-4 flex flex-shrink-0">
            <div className="flex gap-3 animate-infinite-scroll hover:[animation-play-state:paused] w-max px-4">
                {allSamples.map((item, idx) => (
                    <div
                        key={idx}
                        className="w-[124px] sm:w-[130px] aspect-[9/16] bg-zinc-900 rounded-xl border border-zinc-800 shadow-xl overflow-hidden relative group transition-all duration-500 hover:scale-[1.02] hover:border-zinc-700"
                    >
                        {item.type === 'video' ? (
                            <video
                                ref={(el) => { videoRefs.current[idx] = el; }}
                                src={item.url}
                                autoPlay
                                muted
                                loop
                                playsInline
                                className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity duration-500"
                            />
                        ) : (
                            <img
                                src={item.url}
                                className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity duration-500"
                                alt={item.title}
                            />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/20 to-transparent pointer-events-none" />
                        <div className="absolute bottom-3 left-3 right-3 text-left">
                            <p className="text-[10px] font-black italic tracking-wider text-white mb-0.5 drop-shadow-lg leading-tight uppercase truncate">
                                {item.title}
                            </p>
                            <div className="h-0.5 w-6 bg-cyan-500 rounded-full" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
