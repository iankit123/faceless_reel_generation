import { X, Sparkles, Send } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { translations } from '../../utils/translations';
import { useVideoStore } from '../../store/useVideoStore';

interface AITopicModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (topic: string) => void;
}

export function AITopicModal({ isOpen, onClose, onSubmit }: AITopicModalProps) {
    const [topic, setTopic] = useState('');
    const uiLanguage = useVideoStore((s) => s.uiLanguage);
    const t = translations[uiLanguage];
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setTopic('');
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (topic.trim()) {
            onSubmit(topic);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center">
                                <Sparkles className="w-6 h-6 text-cyan-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-white">{t.topicPopupTitle || "AI Script Writer"}</h2>
                                <p className="text-xs text-zinc-400">What story should AI write for you today?</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-zinc-500 hover:text-white transition-colors rounded-full hover:bg-zinc-800"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="relative group">
                            <input
                                ref={inputRef}
                                type="text"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder={t.topicPlaceholder || "e.g. A brave lion and a tiny mouse..."}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/50 transition-all text-lg"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-6 py-4 rounded-2xl bg-zinc-800 text-zinc-300 font-bold hover:bg-zinc-700 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={!topic.trim()}
                                className="flex-[2] px-6 py-4 rounded-2xl bg-gradient-to-r from-cyan-600 to-teal-600 text-zinc-950 font-black flex items-center justify-center gap-2 hover:from-cyan-500 hover:to-teal-500 transition-all disabled:opacity-40 disabled:grayscale"
                            >
                                <Send className="w-5 h-5" />
                                WRITE SCRIPT
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
