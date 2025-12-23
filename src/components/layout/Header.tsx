import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut, Coins, User as UserIcon, CreditCard } from 'lucide-react';
import logoImg from '../../assets/logo.png';

export function Header() {
    const { user, credits, signOut } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!user) return null;

    return (
        <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md px-6 flex items-center justify-between">
            <div className="flex items-center">
                <img src={logoImg} alt="Reel Shorts" className="h-20 w-auto" />
            </div>

            <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-full">
                    <Coins className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-bold text-zinc-100">{credits} Credits</span>
                </div>

                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="w-10 h-10 rounded-full border-2 border-zinc-800 hover:border-cyan-500/50 transition-all overflow-hidden"
                    >
                        {user.user_metadata?.avatar_url ? (
                            <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                                <UserIcon className="w-5 h-5 text-zinc-400" />
                            </div>
                        )}
                    </button>

                    {isMenuOpen && (
                        <div className="absolute top-full right-0 mt-2 w-64 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-2 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="px-4 py-3 border-b border-zinc-800 mb-2">
                                <p className="text-xs text-zinc-500 uppercase font-black tracking-widest mb-1">Signed in as</p>
                                <p className="text-sm font-bold text-zinc-100 truncate">{user.email}</p>
                            </div>

                            <div className="sm:hidden px-4 py-2 border-b border-zinc-800 mb-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-zinc-400">Credits:</span>
                                    <div className="flex items-center gap-1">
                                        <Coins className="w-4 h-4 text-amber-400" />
                                        <span className="text-sm font-bold text-zinc-100">{credits}</span>
                                    </div>
                                </div>
                            </div>

                            <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-zinc-100 hover:bg-zinc-800 rounded-xl transition-all group">
                                <CreditCard className="w-4 h-4 text-zinc-400 group-hover:text-cyan-400" />
                                <span>Buy Credits</span>
                            </button>

                            <button
                                onClick={() => signOut()}
                                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                            >
                                <LogOut className="w-4 h-4" />
                                <span>Sign Out</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
