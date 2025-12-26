import { Loader2, Wand2 } from 'lucide-react';
import { translations } from '../../utils/translations';
import { useVideoStore } from '../../store/useVideoStore';

interface GenerationProgressModalProps {
    isOpen: boolean;
}

export function GenerationProgressModal({ isOpen }: GenerationProgressModalProps) {
    const uiLanguage = useVideoStore((s) => s.uiLanguage);
    const t = translations[uiLanguage];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-zinc-950/90 backdrop-blur-md animate-in fade-in duration-500" />

            {/* Modal Content */}
            <div className="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center space-y-6 animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
                <div className="relative">
                    <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center">
                        <Wand2 className="w-10 h-10 text-indigo-400 animate-pulse" />
                    </div>
                    <div className="absolute -inset-2">
                        <Loader2 className="w-24 h-24 text-indigo-500/40 animate-spin-slow" />
                    </div>
                </div>

                <div className="space-y-2">
                    <h3 className="text-xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                        {t.generationStarting}
                    </h3>
                    <p className="text-sm text-zinc-500 leading-relaxed font-medium">
                        {t.pleaseWait}
                    </p>
                </div>

                {/* Progress Visualizer */}
                <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 animate-progress-indeterminate" />
                </div>

                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500/50">
                    AI Engines Warming Up
                </p>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 3s linear infinite;
                }
                @keyframes progress-indeterminate {
                    0% { transform: translateX(-100%) scaleX(0.2); }
                    50% { transform: translateX(0%) scaleX(0.5); }
                    100% { transform: translateX(100%) scaleX(0.2); }
                }
                .animate-progress-indeterminate {
                    animation: progress-indeterminate 2s cubic-bezier(0.65, 0.815, 0.735, 0.395) infinite;
                    transform-origin: left;
                }
            `}} />
        </div>
    );
}
