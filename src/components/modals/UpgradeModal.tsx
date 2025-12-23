import { X, Sparkles, Zap } from 'lucide-react';

interface UpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpgrade: () => void;
}

export function UpgradeModal({ isOpen, onClose, onUpgrade }: UpgradeModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                {/* Header Decoration */}
                <div className="h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-zinc-800 text-zinc-400 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="p-8 pt-10 text-center">
                    <div className="mx-auto w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-6">
                        <Sparkles className="w-8 h-8 text-indigo-400" />
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-3">
                        Upgrade to Download
                    </h2>

                    <p className="text-zinc-400 text-sm leading-relaxed mb-8">
                        Unlock high-quality MP4 downloads and direct sharing to Instagram for your amazing reels.
                    </p>

                    <div className="space-y-3">
                        <button
                            onClick={onUpgrade}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98]"
                        >
                            <Zap className="w-5 h-5 fill-current" />
                            Upgrade Now
                        </button>

                        <button
                            onClick={onClose}
                            className="w-full bg-transparent hover:bg-zinc-800 text-zinc-400 font-semibold py-4 rounded-2xl transition-colors"
                        >
                            Maybe Later
                        </button>
                    </div>
                </div>

                {/* Footer Insight */}
                <div className="bg-zinc-800/50 p-4 text-center">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                        Join 2,000+ creators
                    </p>
                </div>
            </div>
        </div>
    );
}
