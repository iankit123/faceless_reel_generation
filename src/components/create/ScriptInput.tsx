import { Mic, MicOff, Trash2, Lightbulb, Camera, Newspaper, Sparkles } from 'lucide-react';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { useRef, useEffect, useState } from 'react';
import { SuggestIdeasModal } from '../modals/SuggestIdeasModal';
import { NewsToReelModal } from '../modals/NewsToReelModal';
import { AITopicModal } from '../modals/AITopicModal';
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
    onSelectPhotos?: (images: string[]) => void;
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
    language = 'hinglish',
    onSelectPhotos,
    onSelectNews,
}: ScriptInputProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const photoInputRef = useRef<HTMLInputElement>(null);
    const [isIdeasModalOpen, setIsIdeasModalOpen] = useState(false);
    const [isNewsModalOpen, setIsNewsModalOpen] = useState(false);
    const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
    const [isOCRProcessing, setIsOCRProcessing] = useState(false);
    const uiLanguage = useVideoStore(s => s.uiLanguage);
    const t = translations[uiLanguage];

    const { isListening, toggleListening } = useSpeechRecognition({
        onTranscript: (t) => onChange(value + (value ? ' ' : '') + t),
        language
    });

    // Auto-resize textarea
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

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        setIsOCRProcessing(true); // Reuse this state to show loading if needed
        try {
            // 1. Create local blob URLs immediately for instant UI feedback
            const blobUrls = files.map(file => URL.createObjectURL(file));

            // 2. Trigger background uploads to Supabase for persistence
            // We don't wait for these to complete before calling onSelectPhotos
            files.forEach(async (file) => {
                try {
                    await supabaseService.uploadScreenshot(file);
                } catch (err) {
                    console.warn('Background photo upload failed:', err);
                }
            });

            if (onSelectPhotos) {
                onSelectPhotos(blobUrls);
            }
        } catch (error) {
            console.error('Photo Upload Error:', error);
            alert('Failed to process photos. Please try again.');
        } finally {
            setIsOCRProcessing(false);
            if (photoInputRef.current) photoInputRef.current.value = '';
        }
    };

    const handleAIExpand = async (topic?: string) => {
        const targetTopic = topic || value;
        if (!targetTopic.trim()) {
            setIsTopicModalOpen(true);
            return;
        }

        setIsOCRProcessing(true); // Use as loading state
        try {
            const response = await fetch('/api/expand', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: targetTopic, language })
            });
            if (!response.ok) throw new Error('Failed to expand story');
            const data = await response.json();
            if (data.narration) {
                onChange(data.narration);
            }
        } catch (err) {
            console.error('AI Expansion failed:', err);
            alert('AI failed to write script. Please try again.');
        } finally {
            setIsOCRProcessing(false);
        }
    };

    return (
        <div className="space-y-4">
            <AITopicModal
                isOpen={isTopicModalOpen}
                onClose={() => setIsTopicModalOpen(false)}
                onSubmit={(topic) => handleAIExpand(topic)}
            />

            <SuggestIdeasModal
                isOpen={isIdeasModalOpen}
                onClose={() => setIsIdeasModalOpen(false)}
                onSelect={onChange}
                onScreenshotClick={() => fileInputRef.current?.click()}
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
                        className="w-full min-h-[160px] bg-transparent border-none px-4 pt-4 pb-12 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none resize-none overflow-hidden transition-all"
                    />

                    {/* Bottom Embedded Actions: Speak | Clear */}
                    <div className="absolute bottom-1.5 left-2 flex items-center gap-1">
                        <button
                            onClick={toggleListening}
                            disabled={disabled || isOCRProcessing}
                            className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md transition-all text-xs font-bold tracking-wider
                                     ${isListening
                                    ? 'text-red-400 bg-red-500/10 animate-pulse'
                                    : 'text-zinc-500 hover:text-white hover:bg-zinc-800'
                                }`}
                        >
                            {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                            {t.speak}
                        </button>

                        {value && !disabled && (
                            <>
                                <div className="w-px h-3 bg-zinc-800" />
                                <button
                                    onClick={() => onChange('')}
                                    className="flex items-center gap-1 px-1.5 py-0.5 rounded-md
                                             text-zinc-500 hover:text-red-400 hover:bg-red-500/10
                                             transition-all text-xs font-bold"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    {t.clearText}
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Partition Line */}
                <div className="w-px bg-white/20 self-stretch" />

                <div className="w-px bg-white/20 self-stretch" />

                {/* Right: Actions Column (Redesigned as horizontal rows) */}
                <div className="w-42 p-3 flex flex-col gap-2 shrink-0 bg-zinc-900/40 backdrop-blur-sm self-stretch justify-center">
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            setIsIdeasModalOpen(true);
                        }}
                        className="flex items-center gap-3 p-3 rounded-lg 
                                 bg-zinc-800/50 border border-zinc-700/50 text-zinc-300
                                 hover:bg-zinc-700/50 hover:border-cyan-500/30 hover:text-white
                                 hover:scale-[1.02] active:scale-95 transition-all group"
                    >
                        <div className="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center shrink-0 group-hover:bg-yellow-500/20 transition-colors">
                            <Lightbulb className="w-4 h-4 text-yellow-500" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider leading-tight">
                            {t.readymadeStories}
                        </span>
                    </button>

                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            handleAIExpand();
                        }}
                        className="flex items-center gap-3 p-3 rounded-lg 
                                 bg-zinc-800/50 border border-zinc-700/50 text-zinc-300
                                 hover:bg-zinc-700/50 hover:border-cyan-500/30 hover:text-white
                                 hover:scale-[1.02] active:scale-95 transition-all group"
                    >
                        <div className="w-8 h-8 rounded-full bg-cyan-500/10 flex items-center justify-center shrink-0 group-hover:bg-cyan-500/20 transition-colors">
                            <Sparkles className="w-4 h-4 text-cyan-400" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider leading-tight">
                            {t.aiScriptWriter}
                        </span>
                    </button>

                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            setIsNewsModalOpen(true);
                        }}
                        className="flex items-center gap-3 p-3 rounded-lg 
                                 bg-zinc-800/50 border border-zinc-700/50 text-zinc-300
                                 hover:bg-zinc-700/50 hover:border-pink-500/30 hover:text-white
                                 hover:scale-[1.02] active:scale-95 transition-all group"
                    >
                        <div className="w-8 h-8 rounded-full bg-pink-500/10 flex items-center justify-center shrink-0 group-hover:bg-pink-500/20 transition-colors">
                            <Newspaper className="w-4 h-4 text-pink-400" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider leading-tight">
                            {t.newsReelInside}
                        </span>
                    </button>

                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            photoInputRef.current?.click();
                        }}
                        className="flex items-center gap-3 p-3 rounded-lg 
                                 bg-zinc-800/50 border border-zinc-700/50 text-zinc-300
                                 hover:bg-zinc-700/50 hover:border-teal-500/30 hover:text-white
                                 hover:scale-[1.02] active:scale-95 transition-all group"
                    >
                        <div className="w-8 h-8 rounded-full bg-teal-500/10 flex items-center justify-center shrink-0 group-hover:bg-teal-500/20 transition-colors">
                            <Camera className="w-4 h-4 text-teal-400" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider leading-tight">
                            {t.photoToReel}
                        </span>
                    </button>
                </div>
            </div>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
            />

            <input
                type="file"
                ref={photoInputRef}
                onChange={handlePhotoUpload}
                accept="image/*"
                multiple
                className="hidden"
            />

            {isListening && (
                <div className="flex items-center justify-center gap-2 py-1">
                    <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-ping" />
                    <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Recording live...</span>
                </div>
            )}
        </div>
    );
}
