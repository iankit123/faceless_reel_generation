import { useState, useEffect } from 'react';
import { X, Newspaper, ChevronRight, Loader2, AlertCircle } from 'lucide-react';

interface NewsItem {
    title: string;
    description: string;
    imageUrl: string | null;
    isHoroscope?: boolean;
    fullContent?: string;
}

interface NewsToReelModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (news: NewsItem) => void;
}

export function NewsToReelModal({ isOpen, onClose, onSelect }: NewsToReelModalProps) {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchNews();
        }
    }, [isOpen]);

    const fetchNews = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/news');
            if (!response.ok) throw new Error('Failed to fetch news');
            const data = await response.json();
            setNews(data);
        } catch (err) {
            setError('Could not load news. Please try again later.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />

            <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-pink-500/10 rounded-lg">
                            <Newspaper className="w-5 h-5 text-pink-500" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-zinc-100">News to Reel</h3>
                            <p className="text-xs text-zinc-500">Pick a trending story to viralize</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-500 hover:text-zinc-100"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
                            <p className="text-sm text-zinc-500">Fetching latest stories from TOI...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                            <div className="p-3 bg-red-500/10 rounded-full">
                                <AlertCircle className="w-6 h-6 text-red-500" />
                            </div>
                            <p className="text-sm text-red-400">{error}</p>
                            <button
                                onClick={fetchNews}
                                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-semibold rounded-lg transition-all"
                            >
                                Try Again
                            </button>
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {news.map((item, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => onSelect(item)}
                                    className="flex gap-4 p-3 bg-zinc-950/50 hover:bg-zinc-800/80 border border-zinc-800/50 hover:border-pink-500/30 rounded-xl transition-all group text-left"
                                >
                                    {item.imageUrl && (
                                        <div className="w-24 h-24 shrink-0 rounded-lg overflow-hidden border border-zinc-800">
                                            <img
                                                src={item.imageUrl}
                                                alt=""
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0 py-1 flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="text-sm font-bold text-zinc-100 leading-tight group-hover:text-pink-400 transition-colors">
                                                    {item.title}
                                                </h4>
                                                {item.isHoroscope && (
                                                    <span className="shrink-0 px-1.5 py-0.5 bg-yellow-500/10 text-yellow-500 text-[10px] font-black uppercase rounded-md border border-yellow-500/20 shadow-sm animate-pulse">
                                                        STARS CHOICE
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-zinc-500 mt-1.5 line-clamp-2 leading-relaxed">
                                                {item.description}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1 text-[10px] font-bold text-pink-500/70 uppercase tracking-widest mt-2 group-hover:text-pink-500 transition-colors">
                                            Create Reel <ChevronRight className="w-3 h-3" />
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
