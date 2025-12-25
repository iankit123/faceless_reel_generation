import { X, LogIn, Chrome } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SignInModalProps {
    isOpen: boolean;
    onClose: () => void;
    redirectTo?: string;
}

export function SignInModal({ isOpen, onClose, redirectTo }: SignInModalProps) {
    const { signInWithGoogle } = useAuth();

    if (!isOpen) return null;

    const handleSignIn = async () => {
        try {
            await signInWithGoogle(redirectTo);
            onClose();
        } catch (error) {
            console.error('Sign in failed:', error);
        }
    };

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
                <div className="h-2 bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500" />

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-zinc-800 text-zinc-400 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="p-8 pt-10 text-center">
                    <div className="mx-auto w-16 h-16 bg-cyan-500/10 rounded-2xl flex items-center justify-center mb-6">
                        <LogIn className="w-8 h-8 text-cyan-400" />
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-3">
                        Sign in to Download
                    </h2>

                    <p className="text-zinc-400 text-sm leading-relaxed mb-8">
                        Sign in with Google to save your video and download it in high quality.
                    </p>

                    <div className="space-y-3">
                        <button
                            onClick={handleSignIn}
                            className="w-full bg-white hover:bg-zinc-100 text-zinc-900 font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-white/10 active:scale-[0.98]"
                        >
                            <Chrome className="w-5 h-5" />
                            Sign in with Google
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
                        Join our community of creators
                    </p>
                </div>
            </div>
        </div>
    );
}
