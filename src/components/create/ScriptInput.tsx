import { Mic, MicOff, Trash2, Sparkles } from 'lucide-react';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { useRef, useEffect, useState } from 'react';
import { SuggestIdeasModal } from '../modals/SuggestIdeasModal';

interface ScriptInputProps {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    label?: string;
    placeholder?: string;
    language?: string;
}

export function ScriptInput({ value, onChange, disabled, label = "Video Idea", placeholder = "Describe your idea...", language = "english" }: ScriptInputProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [isIdeasModalOpen, setIsIdeasModalOpen] = useState(false);
    const { isListening, toggleListening, isSupported } = useSpeechRecognition({
        onTranscript: (transcript) => {
            onChange(value + (value ? ' ' : '') + transcript);
        },
        language
    });

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [value]);

    if (!isSupported) {
        // Fallback or just hide the mic icon if not supported
    }

    return (
        <div className="space-y-2">
            <SuggestIdeasModal
                isOpen={isIdeasModalOpen}
                onClose={() => setIsIdeasModalOpen(false)}
                onSelect={onChange}
            />

            <div className="flex items-center justify-between">
                <label className="block text-sm font-bold text-zinc-400 uppercase tracking-wider">
                    {label}
                </label>
                <button
                    onClick={() => setIsIdeasModalOpen(true)}
                    className="px-2 py-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-400 hover:to-pink-400 text-white rounded-xl flex items-center gap-1 shadow-lg shadow-purple-500/20 active:scale-95 transition-all group"
                >
                    <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                    <span className="text-sm font-bold tracking-tight">Suggest Ideas</span>
                </button>
            </div>

            <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-zinc-700 to-zinc-700 rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition duration-500" />
                <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled}
                    placeholder={placeholder}
                    className="relative w-full min-h-[200px] bg-zinc-950/40 border border-zinc-700 rounded-2xl p-6 text-xl text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all resize-none overflow-hidden"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <button
                    onClick={toggleListening}
                    disabled={disabled}
                    className={`flex items-center justify-center gap-1 px-1 py-4 rounded-xl transition-all border ${isListening
                        ? 'bg-red-500/10 border-red-500/50 text-red-500 animate-pulse'
                        : 'bg-zinc-900/40 border-zinc-700 text-zinc-100 hover:bg-zinc-800/60 hover:border-zinc-600'
                        }`}
                >
                    {isListening ? (
                        <>
                            <MicOff className="w-5 h-5 font-bold" />
                            <span className=" tracking-tight">Stop Listening</span>
                        </>
                    ) : (
                        <>
                            <Mic className="w-5 h-5" />
                            <span className="tracking-tight text-zinc-100">Speak and Write</span>
                        </>
                    )}
                </button>

                <button
                    onClick={() => onChange('')}
                    disabled={disabled || !value}
                    className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-zinc-900/40 border border-zinc-700 text-zinc-100 hover:bg-zinc-800/60 hover:border-zinc-600 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                >
                    <Trash2 className="w-5 h-5" />
                    <span className="font-bold tracking-tight">Clear All</span>
                </button>
            </div>

            <p className="text-sm text-zinc-400 font-medium">
                Describe your video idea. The AI will generate a script, scenes, and narration.
            </p>
        </div>
    );
}
