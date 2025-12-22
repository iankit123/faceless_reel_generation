import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScriptInput } from '../components/create/ScriptInput';
import { Wand2, AlertCircle } from 'lucide-react';
import { useVideoStore } from '../store/useVideoStore';
import { useAuth } from '../contexts/AuthContext';
import { storyService } from '../services/story';
import { Header } from '../components/layout/Header';
import { PurchaseCreditModal } from '../components/modals/PurchaseCreditModal';
import { supabaseService } from '../services/supabase';
// import type { Scene } from '../types';

export function CreateVideoPage() {
    const navigate = useNavigate();
    const { user, signInWithGoogle, credits, refreshCredits } = useAuth();
    const [language, setLanguage] = useState('hinglish');
    const [script, setScript] = useState('');
    const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
    const isGenerating = useVideoStore((state) => state.isGenerating);
    const setGenerating = useVideoStore((state) => state.setGenerating);
    const initProject = useVideoStore((state) => state.initProject);
    const addScene = useVideoStore((state) => state.addScene);
    const saveProject = useVideoStore((state) => state.saveProject);

    const handleGenerate = async () => {
        if (!script.trim()) return;

        if (!user) {
            localStorage.setItem('pending_video_script', script);
            localStorage.setItem('pending_video_language', language);
            localStorage.setItem('is_generating_post_login', 'true');
            await signInWithGoogle();
            return;
        }

        if (credits <= 0) {
            setIsPurchaseModalOpen(true);
            return;
        }

        setGenerating(true);
        try {
            // Decrement credit immediately to prevent double usage
            await supabaseService.decrementCredits(user.id);
            await refreshCredits();

            const story = await storyService.generateStory({ prompt: script, language });
            initProject(story.theme, language, script);

            story.scenes.forEach((s) => {
                addScene({
                    id: crypto.randomUUID(),
                    text: s.text,
                    duration: s.duration || 5,
                    imagePrompt: s.imagePrompt,
                    imageSettings: { width: 576, height: 1024, steps: 20, guidance: 7 },
                    motionType: s.motionType || 'zoom_in',
                    captionsEnabled: true,
                    status: 'pending'
                });
            });

            try {
                await saveProject(user.id);
            } catch (saveError) {
                console.warn('Failed to save project to Supabase, but continuing to editor:', saveError);
            }
            navigate('/scenes');
        } catch (error) {
            console.error(error);
        } finally {
            setGenerating(false);
        }
    };

    const triggerGenerate = async (finalScript: string, finalLanguage: string) => {
        if (!user) return;

        // Wait for credits to be refreshed first as this runs right after login
        await refreshCredits();

        // Use a timeout or small delay if needed or check context credits
        // But context credits might be 0 initially. Let's fetch directly to be safe.
        const profile = await supabaseService.getProfile(user.id);
        if (profile.credits <= 0) {
            setIsPurchaseModalOpen(true);
            return;
        }

        setGenerating(true);
        try {
            await supabaseService.decrementCredits(user.id);
            await refreshCredits();

            const story = await storyService.generateStory({ prompt: finalScript, language: finalLanguage });
            initProject(story.theme, finalLanguage, finalScript);
            story.scenes.forEach((s) => {
                addScene({
                    id: crypto.randomUUID(),
                    text: s.text,
                    duration: s.duration || 5,
                    imagePrompt: s.imagePrompt,
                    imageSettings: { width: 576, height: 1024, steps: 20, guidance: 7 },
                    motionType: s.motionType || 'zoom_in',
                    captionsEnabled: true,
                    status: 'pending'
                });
            });
            try {
                if (user) await saveProject(user.id);
            } catch (saveError) {
                console.warn('Failed to auto-save project after login:', saveError);
            }
            navigate('/scenes');
        } catch (error) {
            console.error(error);
        } finally {
            setGenerating(false);
        }
    };

    useEffect(() => {
        const isPostLogin = localStorage.getItem('is_generating_post_login') === 'true';
        if (user && isPostLogin) {
            const savedScript = localStorage.getItem('pending_video_script');
            const savedLanguage = localStorage.getItem('pending_video_language');

            if (savedScript && savedLanguage) {
                setScript(savedScript);
                setLanguage(savedLanguage);

                localStorage.removeItem('is_generating_post_login');
                localStorage.removeItem('pending_video_script');
                localStorage.removeItem('pending_video_language');

                triggerGenerate(savedScript, savedLanguage);
            }
        }
    }, [user]);

    const prompts = {
        english: [
            "Story of how a lion and dear became friends in jungle",
            "Video showing why new born baby cry a lot",
            "Ancient true story of Pyramids"
        ],
        hindi: [
            "Bhagwan krishna ki kahani jisme wo gaanv waalo ko pahad uthanke baarish se bachate hai",
            "Khargosh aur tortoise ki kahani",
            "A short story",
            "Panipat ki ladai"
        ],
        hinglish: [
            "Bhagwan krishna ki kahani jisme wo gaanv waalo ko pahad uthanke baarish se bachate hai",
            "Khargosh aur tortoise ki kahani",
            "A short story",
            "Panipat ki ladai"
        ]
    };

    const currentPrompts = prompts[language as keyof typeof prompts] || prompts.hinglish;

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 overflow-hidden relative selection:bg-cyan-500/30">
            <Header />
            <PurchaseCreditModal
                isOpen={isPurchaseModalOpen}
                onClose={() => setIsPurchaseModalOpen(false)}
            />

            {/* Background Grid Pattern */}
            <div className="absolute inset-0 z-0 opacity-20"
                style={{
                    backgroundImage: `radial-gradient(circle at 2px 2px, #3f3f46 1px, transparent 0)`,
                    backgroundSize: '40px 40px'
                }}
            />

            {/* Subtle Glow Effects */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/5 blur-[120px] rounded-full z-0" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-500/5 blur-[120px] rounded-full z-0" />

            <div className="relative z-10 max-w-7xl mx-auto px-6 pt-28 pb-12 lg:pt-36 lg:pb-20 min-h-screen flex items-center">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 w-full items-center">
                    {/* Left Column */}
                    <div className="lg:col-span-7 flex flex-col justify-center space-y-8">
                        <div>
                            <h1 className="text-4xl lg:text-5xl font-black mb-4 tracking-tight">
                                Create <span className="text-cyan-400 italic">viral</span> <br />
                                faceless videos
                            </h1>
                            <p className="text-zinc-400 text-lg font-medium">
                                Turn your ideas into viral videos in seconds.
                            </p>
                        </div>

                        <div className="space-y-6">
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-bold text-zinc-500 mb-2 uppercase tracking-wider">Language</label>
                                    <select
                                        value={language}
                                        onChange={(e) => setLanguage(e.target.value)}
                                        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all backdrop-blur-sm"
                                    >
                                        <option value="hinglish">Hinglish (Default)</option>
                                        <option value="hindi">Hindi</option>
                                        <option value="english">English</option>
                                    </select>
                                </div>
                            </div>

                            <ScriptInput
                                value={script}
                                onChange={setScript}
                                disabled={isGenerating}
                                label={`Video Idea (${language.charAt(0).toUpperCase() + language.slice(1)})`}
                                placeholder={
                                    language === 'english' ? "Story of a horror house..." :
                                        language === 'hinglish' ? "Raja Harishchand ki kahani..." :
                                            "भूतिया महल की कहानी..."
                                }
                                language={language}
                            />

                            <button
                                onClick={handleGenerate}
                                disabled={isGenerating || !script.trim()}
                                className="group relative w-full bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-950 font-black py-5 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-[0_0_30px_rgba(34,211,238,0.2)] active:scale-[0.98]"
                            >
                                {isGenerating ? (
                                    <>
                                        <div className="w-6 h-6 border-3 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" />
                                        <span className="text-lg">Generating Magic...</span>
                                    </>
                                ) : (
                                    <>
                                        <Wand2 className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                                        <span className="text-lg uppercase tracking-tight">Generate Video</span>
                                    </>
                                )}
                            </button>

                            {credits === 0 && user && (
                                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-1">
                                    <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                                    <p className="text-xs text-amber-200 font-medium">You have 0 credits. <button onClick={() => setIsPurchaseModalOpen(true)} className="text-amber-400 underline hover:text-amber-300">Buy more credits</button> to generate.</p>
                                </div>
                            )}

                            {/* Example Prompts */}
                            <div className="space-y-3">
                                <label className="block text-sm font-bold text-zinc-500 uppercase tracking-wider">Try these ideas</label>
                                <div className="flex flex-wrap gap-2">
                                    {currentPrompts.map((p, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setScript(p)}
                                            className="text-[11px] bg-zinc-900/50 hover:bg-zinc-800/80 border border-zinc-800 hover:border-cyan-500/30 text-zinc-400 hover:text-zinc-100 px-4 py-2 rounded-xl transition-all text-left backdrop-blur-sm group"
                                        >
                                            <span>{p}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Preview Mock */}
                    <div className="lg:col-span-5 hidden lg:flex items-center justify-center">
                        <div className="relative p-10 bg-zinc-900/30 rounded-[40px] border border-zinc-800/50 backdrop-blur-md">
                            <div className="relative w-[300px] aspect-[9/16] bg-zinc-950 rounded-3xl border border-zinc-800 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] ring-1 ring-zinc-800/50">
                                {/* Mock Content */}
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-zinc-950/90 z-10" />
                                <img
                                    src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1000&auto=format&fit=crop"
                                    alt="Preview"
                                    className="absolute inset-0 w-full h-full object-cover opacity-40"
                                />
                                <div className="absolute bottom-12 left-0 right-0 px-8 text-center z-20">
                                    <div className="h-1 w-12 bg-cyan-500 rounded-full mx-auto mb-4" />
                                    <p className="text-zinc-100 font-black text-xl leading-tight tracking-tight">
                                        प्राचीन भारत में एक छोटा सा गाँव था...
                                    </p>
                                </div>
                            </div>

                            {/* Decorative elements */}
                            <div className="absolute -top-4 -right-4 w-20 h-20 bg-cyan-500/10 blur-3xl rounded-full" />
                            <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-indigo-500/10 blur-3xl rounded-full" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
