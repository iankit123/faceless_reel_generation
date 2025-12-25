import { Mic, MicOff, Trash2, Sparkles, Camera } from 'lucide-react';
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

export function ScriptInput({
    value,
    onChange,
    disabled,
    label = "Video Idea",
    placeholder = "Describe your idea...",
    language = "english"
}: ScriptInputProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isIdeasModalOpen, setIsIdeasModalOpen] = useState(false);
    const [isOCRProcessing, setIsOCRProcessing] = useState(false);

    const { isListening, toggleListening } = useSpeechRecognition({
        onTranscript: (t) => onChange(value + (value ? ' ' : '') + t),
        language
    });

    useEffect(() => {
        if (!textareaRef.current) return;
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }, [value]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsOCRProcessing(true);
        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await fetch('http://localhost:3000/api/ocr', {
                method: 'POST',
                body: formData,
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
            />

            <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-400 uppercase">
                    {label}
                </label>

                <button
                    onClick={() => setIsIdeasModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg
             bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500
             text-white shadow-md shadow-purple-500/25
             hover:from-indigo-400 hover:to-pink-400
             active:scale-95 transition"
                >
                    <Sparkles className="w-3.5 h-3.5" />
                    Suggest ideas
                </button>

            </div>

            <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                placeholder={placeholder}
                className="w-full min-h-[96px] bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 resize-none overflow-hidden"
            />

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

                {isListening && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/5 border border-red-500/10 rounded-lg animate-pulse">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                        <span className="text-[10px] font-bold text-red-400 uppercase tracking-tight">Auto-stop active</span>
                    </div>
                )}

                <div className="flex-1" />

                <button
                    onClick={() => onChange('')}
                    disabled={disabled || !value || isOCRProcessing}
                    className="p-2 text-zinc-500 hover:text-red-400 transition-colors disabled:opacity-0"
                    title="Clear prompt"
                >
                    <Trash2 className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
