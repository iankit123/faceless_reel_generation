import { X, Coins, Sparkles, CreditCard, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabaseService } from '../../services/supabase';

interface PurchaseCreditModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function PurchaseCreditModal({ isOpen, onClose }: PurchaseCreditModalProps) {
    const { user } = useAuth();
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleBuy = async (amount: number, credits: number) => {
        if (!user || isProcessing) return;

        setIsProcessing(true);
        setError(null);

        try {
            // Log attempt to database
            await supabaseService.logPaymentAttempt(user.id, amount, credits, 'attempted');

            // Artificial delay
            await new Promise(r => setTimeout(r, 1500));

            // Show failure message as requested
            setError('Payment system is currently facing some issues. Please try again after some time.');

            // Log final failure status
            await supabaseService.logPaymentAttempt(user.id, amount, credits, 'failed_gateway');

        } catch (err) {
            console.error('Failed to log payment attempt:', err);
            setError('An unexpected error occurred. Please try again later.');
        } finally {
            setIsProcessing(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-[24px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                {/* Header Decor */}
                <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-cyan-500/10 to-transparent pointer-events-none" />

                <div className="relative p-6 sm:p-8 overflow-y-auto">
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 text-zinc-500 hover:text-white transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    <div className="flex flex-col items-center text-center mb-6">
                        <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-amber-500/20 rotate-3">
                            <Coins className="w-8 h-8 text-zinc-950" />
                        </div>
                        <h2 className="text-2xl font-black text-white mb-1 leading-tight">Get More Credits</h2>
                        <p className="text-zinc-400 text-sm">Add credits to your account to keep generating.</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                            <p className="text-xs text-red-200 font-medium leading-relaxed">{error}</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Basic Tier */}
                        <div className="relative group">
                            <div className="absolute inset-0 bg-zinc-800/50 rounded-2xl group-hover:bg-zinc-800 transition-colors" />
                            <div className="relative p-5 flex flex-col items-center">
                                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">Starter Pack</span>
                                <div className="flex items-center gap-2 mb-1">
                                    <Coins className="w-5 h-5 text-amber-400" />
                                    <span className="text-3xl font-black text-white">25</span>
                                </div>
                                <span className="text-zinc-500 text-[11px] font-medium mb-4">Credits for 25 videos</span>
                                <div className="text-xl font-black text-white mb-4">Rs.99</div>
                                <button
                                    disabled={isProcessing}
                                    onClick={() => handleBuy(99, 25)}
                                    className="w-full py-3 bg-zinc-800 border border-zinc-700 hover:border-cyan-500/50 hover:bg-zinc-700 text-white text-sm font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {isProcessing ? 'Processing...' : 'Buy Now'}
                                </button>
                            </div>
                        </div>

                        {/* Pro Tier */}
                        <div className="relative group">
                            <div className="absolute inset-0 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl group-hover:bg-indigo-500/20 transition-colors" />
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-indigo-500 rounded-full flex items-center gap-1.5 shadow-lg">
                                <Sparkles className="w-3 h-3 text-white fill-current" />
                                <span className="text-[9px] font-black text-white uppercase tracking-wider">Best Value</span>
                            </div>
                            <div className="relative p-5 flex flex-col items-center">
                                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">Pro Pack</span>
                                <div className="flex items-center gap-2 mb-1">
                                    <Coins className="w-5 h-5 text-amber-400" />
                                    <span className="text-3xl font-black text-white">100</span>
                                </div>
                                <span className="text-zinc-500 text-[11px] font-medium mb-4">Credits for 100 videos</span>
                                <div className="text-xl font-black text-white mb-4">Rs.300</div>
                                <button
                                    disabled={isProcessing}
                                    onClick={() => handleBuy(300, 100)}
                                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/20 active:scale-95 disabled:opacity-50"
                                >
                                    {isProcessing ? 'Processing...' : 'Buy Now'}
                                </button>
                            </div>
                        </div>
                    </div>

                    <p className="mt-8 text-center text-[10px] text-zinc-500 flex items-center justify-center gap-2 pb-2">
                        <CreditCard className="w-3 h-3" />
                        Secure payments processed via Razorpay
                    </p>
                </div>
            </div>
        </div>
    );
}
