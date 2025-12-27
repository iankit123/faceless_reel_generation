import { Mic, MicOff, Trash2, Lightbulb, Camera, Newspaper } from 'lucide-react';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { useRef, useEffect, useState } from 'react';
import { SuggestIdeasModal } from '../modals/SuggestIdeasModal';
import { NewsToReelModal } from '../modals/NewsToReelModal';
import { useVideoStore } from '../../store/useVideoStore';
import { translations } from '../../utils/translations';
import { supabaseService } from '../../services/supabase';

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
                const img = new Image();
                img.src = reader.result as string;
                img.onload = () => {
                    // Maximum dimension for OCR (1600px is more than enough for clear text)
                    const MAX_DIM = 1600;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_DIM) {
                            height *= MAX_DIM / width;
                            width = MAX_DIM;
                        }
                    } else {
                        if (height > MAX_DIM) {
                            width *= MAX_DIM / height;
                            height = MAX_DIM;
                        }
                    }

                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        resolve((reader.result as string).split(',')[1]);
                        return;
                    }

                    ctx.drawImage(img, 0, 0, width, height);
                    // Use jpeg with 0.8 quality to further reduce size
                    const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
                    const base64 = resizedDataUrl.split(',')[1];
                    resolve(base64);
                };
                img.onerror = reject;
            };
            reader.onerror = error => reject(error);
        });
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsOCRProcessing(true);
        try {
            // Upload to Supabase Storage first as requested
            try {
                await supabaseService.uploadScreenshot(file);
            } catch (err) {
                console.warn('Screenshot upload failed, but proceeding with OCR:', err);
            }

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
        <div className="space-y-4">
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
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    {label}
                </label>
            </div>

            <div className="flex bg-zinc-900 border border-white/20 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-cyan-500/30 focus-within:border-cyan-500/50 transition-all">
                {/* Left: Text Area */}
                <div className="flex-1 relative">
                    <textarea
                        ref={textareaRef}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        disabled={disabled}
                        placeholder={placeholder}
                        className="w-full min-h-[140px] bg-transparent border-none px-4 pt-4 pb-12 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none resize-none overflow-hidden transition-all"
                    />

                    {/* Bottom Left Action: Clear */}
                    {value && !disabled && (
                        <div className="absolute bottom-3 left-3">
                            <button
                                onClick={() => onChange('')}
                                className="flex items-center gap-1 px-2 py-1 rounded-md
                                         text-zinc-500 hover:text-red-400 hover:bg-red-500/10
                                         transition-all text-[10px] font-bold uppercase tracking-wider"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                {t.clearText}
                            </button>
                        </div>
                    )}
                </div>

                {/* Partition Line */}
                <div className="w-px bg-white/20 self-stretch" />

                {/* Right: Actions Column */}
                <div className="w-40 p-3 flex flex-col gap-3 shrink-0 bg-zinc-900/40 backdrop-blur-sm self-stretch justify-center">
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            setIsIdeasModalOpen(true);
                        }}
                        className="flex-1 flex flex-col items-center justify-center gap-2 p-2 rounded-lg 
                                 bg-zinc-800/50 border border-zinc-700/50 text-zinc-300
                                 hover:bg-zinc-700/50 hover:border-cyan-500/30 hover:text-white
                                 hover:scale-[1.02] active:scale-95 transition-all group"
                    >
                        <div className="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center group-hover:bg-yellow-500/20 transition-colors">
                            <Lightbulb className="w-4 h-4 text-yellow-500" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-center leading-tight">
                            {t.aiIdeasInside}
                        </span>
                    </button>

                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            setIsNewsModalOpen(true);
                        }}
                        className="flex-1 flex flex-col items-center justify-center gap-2 p-2 rounded-lg 
                                 bg-zinc-800/50 border border-zinc-700/50 text-zinc-300
                                 hover:bg-zinc-700/50 hover:border-pink-500/30 hover:text-white
                                 hover:scale-[1.02] active:scale-95 transition-all group"
                    >
                        <div className="w-8 h-8 rounded-full bg-pink-500/10 flex items-center justify-center group-hover:bg-pink-500/20 transition-colors">
                            <Newspaper className="w-4 h-4 text-pink-400" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-center leading-tight">
                            {t.newsReelInside}
                        </span>
                    </button>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <button
                    onClick={toggleListening}
                    disabled={disabled || isOCRProcessing}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold border transition-all ${isListening
                        ? 'border-red-500/40 text-red-400 bg-red-500/10 animate-pulse'
                        : 'border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300'
                        }`}
                >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    {isListening ? 'Stop' : 'Speak and Write'}
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
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 transition-all disabled:opacity-40"
                >
                    {isOCRProcessing ? (
                        <div className="w-4 h-4 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
                    ) : (
                        <Camera className="w-4 h-4" />
                    )}
                    {isOCRProcessing ? 'Processing' : 'Screenshot to story'}
                </button>
            </div>

            {isListening && (
                <div className="flex items-center justify-center gap-2 py-1">
                    <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-ping" />
                    <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Recording live...</span>
                </div>
            )}
        </div>
    );
}
