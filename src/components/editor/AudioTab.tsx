import { useEffect, useState, useRef } from 'react';
import { useVideoStore } from '../../store/useVideoStore';
import { Play, Pause, Volume2 } from 'lucide-react';

interface MusicFile {
    name: string;
    url: string;
}

interface AudioTabProps {
    onSelect?: () => void;
}

export function AudioTab({ onSelect }: AudioTabProps) {
    const project = useVideoStore((state) => state.project);
    const setBackgroundMusic = useVideoStore((state) => state.setBackgroundMusic);
    const [musicFiles, setMusicFiles] = useState<MusicFile[]>([
        { name: 'Jalwa Hai Hamara', url: '/background_music/Jalwa Hai Hamara.mp3' },
        { name: 'Guddu Bhaiya Dialogue', url: '/background_music/Mirzapur Guddu Bhaiya Dialogue.mp3' },
        { name: 'Pathan Zinda Hai', url: '/background_music/Pathan Zinda Hai _ Pathaan Dialogue _ SRK.mp3' },
        { name: 'Pushpa 2 Dialogue', url: '/background_music/Pushpa 2 Dialogue.mp3' },
        { name: 'Sanjay Dutt Dialogue', url: '/background_music/Sanjay Dutt Dialogue.mp3' },
        { name: 'Shivaji Maharaj Dialogue', url: '/background_music/Chhatrapati Shivaji Maharaj Ko Sher Kehte Hai Dialogue.mp3' },
        { name: 'Fashion Ka Jalwa', url: '/background_music/Fashion Ka Jalwa Song.mp3' },
        { name: 'Hindi Funny Ringtone', url: '/background_music/Hindi Funny Ringtone Download Mp3.mp3' },
        { name: 'Kya Hasin Hai Sama', url: '/background_music/Kya Hasin Hai Sama - Shaam Bhi Khoob Hai _ Karz The Burden Of Truth _ Hindi.mp3' },
        { name: 'Tu Jitna Bharat Ka Tha', url: '/background_music/Tu Jitna Bharat Ka Tha Utna Hi Hamara Hai - Ram Lala _ Vishal Mishra _ Bhakti.mp3' }
    ]);
    const [playingPreview, setPlayingPreview] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        fetch('/api/music')
            .then(res => res.json())
            .then(data => {
                if (data && data.length > 0) {
                    setMusicFiles(data);
                }
            })
            .catch(console.error);

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    const togglePreview = (url: string) => {
        if (playingPreview === url) {
            audioRef.current?.pause();
            setPlayingPreview(null);
        } else {
            if (audioRef.current) {
                audioRef.current.pause();
            }
            audioRef.current = new Audio(url);
            audioRef.current.play();
            audioRef.current.onended = () => setPlayingPreview(null);
            setPlayingPreview(url);
        }
    };

    if (!project) return null;

    return (
        <div className="p-4 space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-zinc-100 mb-4">Background Music</h3>

                {/* Volume Controls */}
                <div className="space-y-4 mb-6">
                    <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
                        <label className="flex items-center justify-between gap-2 text-sm font-medium text-zinc-400 mb-2">
                            <span className="flex items-center gap-2 italic">
                                <Volume2 className="w-4 h-4" />
                                Narration Volume
                            </span>
                            {project.narrationVolume > 1 && (
                                <span className="text-[10px] bg-indigo-500 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-tighter animate-pulse">
                                    Boosted {(project.narrationVolume * 100).toFixed(0)}%
                                </span>
                            )}
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="3"
                            step="0.1"
                            value={project.narrationVolume ?? 1.0}
                            onInput={(e) => {
                                useVideoStore.getState().setNarrationVolume(parseFloat((e.target as HTMLInputElement).value));
                            }}
                            onChange={(e) => {
                                useVideoStore.getState().setNarrationVolume(parseFloat((e.target as HTMLInputElement).value));
                            }}
                            className="w-full h-1.5 bg-zinc-800 rounded-full appearance-none accent-indigo-500 cursor-pointer"
                        />
                    </div>

                    <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
                        <label className="flex items-center gap-2 text-sm font-medium text-zinc-400 mb-2 italic">
                            <Volume2 className="w-4 h-4" />
                            Music Volume
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={project.backgroundMusic?.volume ?? 0.3}
                            onInput={(e) => {
                                if (project.backgroundMusic) {
                                    useVideoStore.getState().setBackgroundMusic({
                                        ...project.backgroundMusic,
                                        volume: parseFloat((e.target as HTMLInputElement).value)
                                    });
                                }
                            }}
                            onChange={(e) => {
                                if (project.backgroundMusic) {
                                    useVideoStore.getState().setBackgroundMusic({
                                        ...project.backgroundMusic,
                                        volume: parseFloat((e.target as HTMLInputElement).value)
                                    });
                                }
                            }}
                            disabled={!project.backgroundMusic}
                            className="w-full h-1.5 bg-zinc-800 rounded-full appearance-none accent-indigo-500 cursor-pointer"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    {musicFiles.map((file) => {
                        const isSelected = project.backgroundMusic?.url === file.url;
                        const isPreviewing = playingPreview === file.url;

                        return (
                            <div
                                key={file.url}
                                className={`flex items-center justify-between p-3 rounded-lg border transition-all ${isSelected
                                    ? 'bg-zinc-800 border-indigo-500 ring-1 ring-indigo-500/20'
                                    : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                                    }`}
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            togglePreview(file.url);
                                        }}
                                        className="p-2 rounded-full bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                                    >
                                        {isPreviewing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                    </button>
                                    <span className="text-sm font-medium text-zinc-200 truncate">{file.name}</span>
                                </div>

                                <button
                                    onClick={() => {
                                        if (audioRef.current) {
                                            audioRef.current.pause();
                                            setPlayingPreview(null);
                                        }
                                        setBackgroundMusic({ name: file.name, url: file.url, volume: 0.1 });
                                        onSelect?.();
                                    }}
                                    className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${isSelected
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
                                        }`}
                                >
                                    {isSelected ? 'Selected' : 'Select'}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
