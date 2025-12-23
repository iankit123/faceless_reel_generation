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

export function CreateVideoPage() {
    const navigate = useNavigate();
    const { user, signInWithGoogle, credits, refreshCredits } = useAuth();
    const [language, setLanguage] = useState('hinglish');
    const [script, setScript] = useState('');
    const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);

    const isGenerating = useVideoStore((s) => s.isGenerating);
    const setGenerating = useVideoStore((s) => s.setGenerating);
    const initProject = useVideoStore((s) => s.initProject);
    const addScene = useVideoStore((s) => s.addScene);
    const saveProject = useVideoStore((s) => s.saveProject);

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

            await saveProject(user.id);
            navigate('/scenes');
        } catch (e) {
            console.error(e);
        } finally {
            setGenerating(false);
        }
    };

    useEffect(() => {
        const postLogin = localStorage.getItem('is_generating_post_login') === 'true';
        if (!user || !postLogin) return;

        const s = localStorage.getItem('pending_video_script');
        const l = localStorage.getItem('pending_video_language');

        if (!s || !l) return;

        localStorage.clear();
        setScript(s);
        setLanguage(l);
        handleGenerate();
    }, [user]);

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 relative">
            <Header />
            <PurchaseCreditModal isOpen={isPurchaseModalOpen} onClose={() => setIsPurchaseModalOpen(false)} />

            <div className="absolute inset-0 opacity-10"
                style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, #3f3f46 1px, transparent 0)',
                    backgroundSize: '36px 36px'
                }}
            />

            <div className="relative z-10 max-w-3xl mx-auto px-5 pt-24 pb-20">
                <div className="space-y-8">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-extrabold tracking-tight">
                            Create <span className="text-cyan-400">viral</span> insta reels
                        </h1>
                        <p className="text-sm text-zinc-400">
                            Turn your idea into a ready to post reel in under 60 seconds
                        </p>
                    </div>

                    <div className="space-y-5">
                        <div>
                            <label className="block text-xs font-semibold text-zinc-400 mb-2 uppercase">
                                Language
                            </label>
                            <select
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                            >
                                <option value="hinglish">Hinglish</option>
                                <option value="hindi">Hindi</option>
                                <option value="english">English</option>
                            </select>
                        </div>

                        <ScriptInput
                            value={script}
                            onChange={setScript}
                            disabled={isGenerating}
                            label="Video Idea"
                            placeholder={
                                language === 'english'
                                    ? 'A dark village with a hidden secret...'
                                    : language === 'hinglish'
                                        ? 'Raja Harishchand ki kahani...'
                                        : 'एक राजा की सच्चाई की कहानी...'
                            }
                            language={language}
                        />

                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating || !script.trim()}
                            className="w-full bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-zinc-950 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition"
                        >
                            {isGenerating ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-zinc-900/30 border-t-zinc-900 rounded-full animate-spin" />
                                    Generating
                                </>
                            ) : (
                                <>
                                    <Wand2 className="w-4 h-4" />
                                    Generate Video
                                </>
                            )}
                        </button>

                        <p className="text-xs text-zinc-500">
                            Write a simple idea. We handle script, scenes and narration.
                        </p>

                        {credits === 0 && user && (
                            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                                <AlertCircle className="w-4 h-4 text-amber-400" />
                                <p className="text-xs text-amber-200">
                                    No credits left.
                                    <button
                                        onClick={() => setIsPurchaseModalOpen(true)}
                                        className="ml-1 underline font-semibold"
                                    >
                                        Buy more
                                    </button>
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
