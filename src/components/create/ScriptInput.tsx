import { Mic, MicOff, Trash2, Lightbulb, Camera, Newspaper } from 'lucide-react';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { useRef, useEffect, useState } from 'react';
import { SuggestIdeasModal } from '../modals/SuggestIdeasModal';
import { NewsToReelModal } from '../modals/NewsToReelModal';
import { useVideoStore } from '../../store/useVideoStore';
import { translations } from '../../utils/translations';

interface ScriptInputProps {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    label?: string;
    placeholder?: string;
    language?: string;
    onSelectNews?: (news: {
        title: string;
        description: string;
        imageUrl: string | null;
        isHoroscope?: boolean;
        fullContent?: string;
    }) => void;
}

export function ScriptInput({
    value,
    onChange,
    disabled,
    label = "Video Idea",
    placeholder = "Describe your idea...",
    language = "english",
    onSelectNews
}: ScriptInputProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isIdeasModalOpen, setIsIdeasModalOpen] = useState(false);
    const [isNewsModalOpen, setIsNewsModalOpen] = useState(false);
    const [isOCRProcessing, setIsOCRProcessing] = useState(false);
    const uiLanguage = useVideoStore(s => s.uiLanguage);
    const t = translations[uiLanguage];

    const { isListening, toggleListening } = useSpeechRecognition({
        onTranscript: (t) => onChange(value + (value ? ' ' : '') + t),
        language
    });

    useEffect(() => {
        if (!textareaRef.current) return;
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }, [value]);

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const base64 = (reader.result as string).split(',')[1];
                resolve(base64);
            };
            reader.onerror = error => reject(error);
        });
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsOCRProcessing(true);
        try {
            const base64 = await fileToBase64(file);

            // Use relative path for deployment
            const response = await fetch('/api/ocr', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: base64 }),
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                console.error('OCR Server Error:', errData);
                throw new Error(errData.details || 'OCR failed');
            }

            const data = await response.json();
            if (data.text) {
                onChange(value + (value ? ' ' : '') + data.text);
            }
        } catch (error) {
            console.error('OCR Error:', error);
            alert('Failed to extract text from image. Please try again.');
        } finally {
            setIsOCRProcessing(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="space-y-2">
            <SuggestIdeasModal
                isOpen={isIdeasModalOpen}
                onClose={() => setIsIdeasModalOpen(false)}
                onSelect={onChange}
                selectedLanguage={language}
            />

            <NewsToReelModal
                isOpen={isNewsModalOpen}
                language={language}
                onClose={() => setIsNewsModalOpen(false)}
                onSelect={(news) => {
                    onSelectNews?.(news);
                    setIsNewsModalOpen(false);
                }}
            />

            <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-400 uppercase">
                    {label}
                </label>

                <div className="flex items-center gap-3 relative">
                    {/* Visual Prompt Arrow */}
                    <div className="absolute -left-16 top-1/2 -translate-y-1/2 hidden sm:flex flex-col items-center animate-bounce-x">
                        <span className="text-[9px] font-black text-white/40 uppercase tracking-tighter mb-1 rotate-[-12deg]">
                            {uiLanguage === 'hi' ? 'इसे आज़माएं!' : 'Try this!'}
                        </span>
                        <svg width="46" height="24" viewBox="0 0 46 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white/60 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
                            <path d="M2 18C10 6 25 4 42 12M42 12L34 6M42 12L36 20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>

                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsIdeasModalOpen(true);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg
                 bg-zinc-100 text-zinc-950 border border-zinc-200
                 shadow-lg shadow-white/5
                 hover:bg-white hover:scale-105
                 active:scale-95 transition-all group"
                    >
                        <Lightbulb className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500/20 group-hover:fill-yellow-500/40 transition-all" />
                        {t.suggestIdeas}
                    </button>
                </div>

            </div>

            <div className="relative group/input">
                <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled}
                    placeholder={placeholder}
                    className="w-full min-h-[96px] bg-zinc-900 border border-zinc-800 rounded-lg px-4 pt-3 pb-10 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 resize-none overflow-hidden transition-all"
                />

                {value && !disabled && (
                    <button
                        onClick={() => onChange('')}
                        className="absolute bottom-3 left-2 flex items-center gap-1.5 px-2 py-1 rounded-md
                     text-zinc-500 hover:text-red-400 hover:bg-red-500/10
                     transition-all text-[12px] font-bold uppercase tracking-wider group/clear"
                        title={t.clearText}
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{t.clearText}</span>
                    </button>
                )}
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={toggleListening}
                    disabled={disabled || isOCRProcessing}
                    className={`flex items-center gap-1 px-1 py-2 rounded-lg text-sm border transition ${isListening
                        ? 'border-red-500/40 text-red-400 bg-red-500/10'
                        : 'border-zinc-800 bg-zinc-900 hover:bg-zinc-800'
                        }`}
                >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    {isListening ? 'Stop' : 'Speak'}
                </button>

                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    className="hidden"
                />

                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled || isOCRProcessing}
                    className="flex items-center gap-1 px-1 py-2 rounded-lg text-sm border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 transition disabled:opacity-40"
                >
                    {isOCRProcessing ? (
                        <div className="w-4 h-4 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
                    ) : (
                        <Camera className="w-4 h-4" />
                    )}
                    {isOCRProcessing ? 'Processing...' : 'Screenshot to story'}
                </button>

                <button
                    onClick={() => setIsNewsModalOpen(true)}
                    disabled={disabled}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border border-pink-500/20 bg-pink-500/5 hover:bg-pink-500/10 hover:border-pink-500/40 text-pink-400 transition"
                >
                    <Newspaper className="w-4 h-4" />
                    News to Reel
                </button>

                {isListening && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/5 border border-red-500/10 rounded-lg animate-pulse">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                        <span className="text-[10px] font-bold text-red-400 uppercase tracking-tight">Auto-stop active</span>
                    </div>
                )}
            </div>
        </div>
    );
}
