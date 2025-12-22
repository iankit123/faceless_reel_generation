import { Mic, MicOff, Trash2 } from 'lucide-react';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { useRef, useEffect } from 'react';

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
        <div className="space-y-4">
            <label className="block text-sm font-bold text-zinc-500 uppercase tracking-wider">
                {label}
            </label>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-cyan-500/50 transition-all backdrop-blur-sm">
                <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled}
                    placeholder={placeholder}
                    className="w-full min-h-[160px] bg-transparent p-6 text-lg text-zinc-100 placeholder:text-zinc-600 focus:outline-none resize-none overflow-hidden"
                />

                <div className="border-t border-zinc-800/50 p-4 bg-zinc-900/20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={toggleListening}
                            disabled={disabled}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all border ${isListening
                                ? 'bg-red-500/20 border-red-500/50 text-red-500 animate-pulse'
                                : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:text-cyan-400 hover:border-cyan-500/30 hover:bg-zinc-800'
                                }`}
                        >
                            {isListening ? (
                                <>
                                    <MicOff className="w-4 h-4" />
                                    <span className="text-[11px] font-bold uppercase tracking-wider">Stop Listening</span>
                                </>
                            ) : (
                                <>
                                    <Mic className="w-4 h-4" />
                                    <span className="text-[11px] font-bold uppercase tracking-wider">Speak and write</span>
                                </>
                            )}
                        </button>

                        {isListening && (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-full">
                                <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
                                <span className="text-[9px] font-bold text-cyan-400 uppercase tracking-widest">Recording...</span>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => onChange('')}
                        disabled={disabled || !value}
                        className="flex items-center gap-2 px-4 py-2 rounded-full transition-all border border-zinc-700/50 text-zinc-400 hover:text-red-400 hover:border-red-500/30 hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Clear all text"
                    >
                        <Trash2 className="w-4 h-4" />
                        <span className="text-[11px] font-bold uppercase tracking-wider">Clear All</span>
                    </button>
                </div>
            </div>

            <p className="text-xs text-zinc-500">
                Describe your video idea. The AI will generate a script, scenes, and narration.
            </p>
        </div>
    );
}
