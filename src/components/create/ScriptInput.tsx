import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';

interface ScriptInputProps {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    label?: string;
    placeholder?: string;
    language?: string;
}

declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

export function ScriptInput({ value, onChange, disabled, label = "Video Idea", placeholder = "Describe your idea...", language = "english" }: ScriptInputProps) {
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;

            // Set language based on prop
            if (language === 'hindi' || language === 'hinglish') {
                recognition.lang = 'hi-IN';
            } else {
                recognition.lang = 'en-US';
            }

            recognition.onresult = (event: any) => {
                let transcript = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    transcript += event.results[i][0].transcript;
                }
                if (event.results[event.results.length - 1].isFinal) {
                    onChange(value + (value ? ' ' : '') + transcript);
                }
            };

            recognition.onerror = (event: any) => {
                console.error("Speech recognition error:", event.error);
                setIsListening(false);
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognitionRef.current = recognition;
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, [onChange, value, language]); // Added language to dependencies

    const toggleListening = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
        } else {
            if (!recognitionRef.current) {
                alert("Your browser does not support the Web Speech API.");
                return;
            }
            recognitionRef.current.start();
            setIsListening(true);
        }
    };

    return (
        <div className="space-y-4">
            <label className="block text-sm font-bold text-zinc-500 uppercase tracking-wider">
                {label}
            </label>

            <div className="relative group">
                <textarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled}
                    placeholder={placeholder}
                    className="w-full h-48 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 pb-16 text-lg text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none transition-all backdrop-blur-sm"
                />

                {/* Voice Dictation Button - Bottom Left */}
                <div className="absolute bottom-4 left-4 flex items-center gap-3">
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

                {/* Character Count or other info could go here */}
            </div>

            <p className="text-xs text-zinc-500">
                Describe your video idea. The AI will generate a script, scenes, and narration.
            </p>
        </div>
    );
}
