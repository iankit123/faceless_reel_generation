import type { Scene } from '../types';
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
import { translations } from '../utils/translations';
import { VideoCarousel } from '../components/VideoCarousel';
import { getDeviceId } from '../utils/device';
import { Footer } from '../components/layout/Footer';
import { GenerationProgressModal } from '../components/modals/GenerationProgressModal';
import { SignInModal } from '../components/modals/SignInModal';

export function CreateVideoPage() {
    console.log('DEBUG: [CreateVideoPage] Component Mounting');
    const navigate = useNavigate();
    const { user, credits, refreshCredits } = useAuth();
    const uiLanguage = useVideoStore((s) => s.uiLanguage);
    const t = translations[uiLanguage];

    const [language, setLanguage] = useState(() => {
        // 1. Check for explicit path override (set by App.tsx redirect)
        const saved = localStorage.getItem('preferred_language');
        if (saved) {
            localStorage.removeItem('preferred_language'); // Only use it once
            return saved;
        }

        // 2. Fallback to current UI language preference
        if (uiLanguage === 'hi') return 'hindi';
        if (uiLanguage === 'en') return 'english';

        return 'hinglish';
    });
    const [script, setScript] = useState('');
    const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
    const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);

    const isGenerating = useVideoStore((s) => s.isGenerating);
    const setGenerating = useVideoStore((s) => s.setGenerating);
    const initProject = useVideoStore((s) => s.initProject);
    const saveProject = useVideoStore((s) => s.saveProject);
    const setUILanguage = useVideoStore((s) => s.setUILanguage);

    const handleGenerate = async (overrideScript?: string, overrideLanguage?: string, fixedImageUrl?: string, isNews?: boolean, isHoroscope?: boolean) => {
        const finalScript = overrideScript || script;
        const finalLanguage = overrideLanguage || language;

        if (!finalScript.trim() || isGenerating) return;

        setGenerating(true);
        // Scroll to top so user sees any feedback/alerts and focus on creation
        window.scrollTo({ top: 0, behavior: 'smooth' });

        try {
            // Tier 1 & 2: Guest Logic
            if (!user) {
                const guestCount = parseInt(localStorage.getItem('guest_video_count') || '0', 10);

                if (guestCount === 0) {
                    // 1st Video: Allow Guest Generation
                    console.log('FUNNEL: Allowing 1st guest generation');
                    // Optimistically set count to 1 to block repeat clicks immediately
                    localStorage.setItem('guest_video_count', '1');

                    // Track prompt now that we are sure we are proceeding
                    await supabaseService.logGuestPrompt(finalScript, finalLanguage);

                    // Proceed with generation
                    await startGenerationFlow(finalScript, finalLanguage, fixedImageUrl, isNews, isHoroscope);
                    return;
                } else {
                    // 2nd Video: Require Login
                    console.log('FUNNEL: Guest count reached, requiring login for 2nd video');
                    localStorage.setItem('pending_video_script', finalScript);
                    localStorage.setItem('pending_video_language', finalLanguage);
                    localStorage.setItem('pending_video_language', finalLanguage);
                    localStorage.setItem('is_generating_post_login', 'true');
                    setIsSignInModalOpen(true);
                    setGenerating(false);
                    return;
                }
            }

            // Tier 3: Authenticated User Credit Check
            if (credits !== null && credits <= 0) {
                console.log('FUNNEL: User logged in but 0 credits, showing purchase modal');
                setIsPurchaseModalOpen(true);
                setGenerating(false);
                return;
            }

            // Deduct credits and proceed
            await supabaseService.decrementCredits(user.id);
            await refreshCredits();
            await startGenerationFlow(finalScript, finalLanguage, fixedImageUrl, isNews, isHoroscope);
        } catch (e: any) {
            console.error('Generation Error:', e);
            // User-facing feedback to prevent "silent hangs"
            alert(`Oops! ${e.message || 'Generation failed'}. Please try again in a moment.`);
        } finally {
            setGenerating(false);
        }
    };

    const startGenerationFlow = async (finalScript: string, finalLanguage: string, fixedImageUrl?: string, isNews?: boolean, isHoroscope?: boolean) => {
        const story = await storyService.generateStory({
            prompt: finalScript,
            language: finalLanguage,
            isNews,
            isHoroscope
        });
        initProject(story.theme, finalLanguage, finalScript, fixedImageUrl);

        // Mark as news/horoscope in store if needed
        if (isHoroscope || isNews) {
            useVideoStore.getState().setProject({
                ...useVideoStore.getState().project!,
                isHoroscope: !!isHoroscope,
                isNews: !!isNews
            } as any);
        }

        // Use the passed fixedImageUrl or fall back to store
        const activeFixedImageUrl = fixedImageUrl || useVideoStore.getState().project?.fixedImageUrl;
        console.log("DEBUG: [CreateVideoPage] Image Check:", { fixedImageUrl, activeFixedImageUrl });

        const scenesWithIds: Scene[] = story.scenes.map((s) => ({
            id: crypto.randomUUID(),
            text: s.text,
            duration: s.duration || 5,
            imagePrompt: s.imagePrompt,
            imageSettings: { width: 576, height: 1024, steps: 20, guidance: 7 },
            imageUrl: activeFixedImageUrl || undefined,
            motionType: s.motionType || 'zoom_in',
            captionsEnabled: true,
            isThumbnail: s.isThumbnail,
            status: 'pending'
        }));

        console.log("DEBUG_SCENES_COUNT:", scenesWithIds.length);


        useVideoStore.getState().setScenes(scenesWithIds);


        const persistenceId = user?.id || getDeviceId();
        await saveProject(persistenceId);

        navigate('/scenes');
    };

    useEffect(() => {
        console.log('DEBUG: [CreateVideoPage] useEffect [user] triggered', { user: user?.id, postLogin: localStorage.getItem('is_generating_post_login') });
        const postLogin = localStorage.getItem('is_generating_post_login') === 'true';
        if (!user || !postLogin) return;

        const s = localStorage.getItem('pending_video_script');
        const l = localStorage.getItem('pending_video_language');

        if (!s || !l) return;

        console.log('DEBUG: [CreateVideoPage] Post-login generation detected, starting handleGenerate');
        // Clear BEFORE starting so we don't loop on failure
        localStorage.removeItem('is_generating_post_login');
        localStorage.removeItem('pending_video_script');
        localStorage.removeItem('pending_video_language');

        setScript(s);
        setLanguage(l);
        handleGenerate(s, l);
    }, [user]);

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 relative">
            <Header />
            <PurchaseCreditModal isOpen={isPurchaseModalOpen} onClose={() => setIsPurchaseModalOpen(false)} />
            <SignInModal
                isOpen={isSignInModalOpen}
                onClose={() => setIsSignInModalOpen(false)}
                title="Sign in to create free reels"
                message="Sign in with Google to continue creating high-quality reels for free."
            />
            <GenerationProgressModal isOpen={isGenerating} />

            <div className="absolute inset-0 opacity-10 pointer-events-none"
                style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, #3f3f46 1px, transparent 0)',
                    backgroundSize: '36px 36px'
                }}
            />

            <div className="relative z-10 max-w-3xl mx-auto px-5 pt-24 pb-20">
                <div className="space-y-8">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-extrabold tracking-tight">
                            {t.createHeader}
                        </h1>
                        <p className="text-sm text-zinc-400">
                            {t.createSubheader}
                        </p>
                    </div>

                    <div className="space-y-5">
                        <div>
                            <label className="block text-xs font-semibold text-zinc-400 mb-2 uppercase">
                                {t.languageLabel}
                            </label>
                            <select
                                value={language}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setLanguage(val);
                                    // Synchronize UI language
                                    if (val === 'hindi') {
                                        setUILanguage('hi');
                                    } else {
                                        setUILanguage('en');
                                    }
                                }}
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
                            label={t.videoIdeaLabel}
                            placeholder={
                                language === 'english'
                                    ? 'Enter video script... if need suggestions take from right side'
                                    : language === 'hinglish'
                                        ? 'Video के लिए स्टोरी लिखिए... सुझाव चाइए तो दाएँ से ले'
                                        : 'Video के लिए स्टोरी लिखिए... सुझाव चाइए तो दाएँ से ले'
                            }
                            language={language}
                            onSelectPhotos={async (images) => {
                                useVideoStore.getState().initPhotoToReelProject(images);
                                // Record activity
                                if (!user) {
                                    await supabaseService.logGuestPrompt('photo to reel', language);
                                }
                                // Save project so it shows in history
                                const persistenceId = user?.id || getDeviceId();
                                await useVideoStore.getState().saveProject(persistenceId);

                                navigate('/scenes');
                            }}
                            onSelectNews={async (news) => {
                                const prompt = news.isHoroscope ? news.fullContent || news.description : news.title + ": " + news.description;
                                handleGenerate(prompt, language, news.imageUrl || undefined, !news.isHoroscope, news.isHoroscope);
                            }}
                        />

                        <button
                            onClick={() => handleGenerate()}
                            disabled={isGenerating || !script.trim()}
                            className="w-full bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-zinc-950 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition"
                        >
                            <Wand2 className="w-4 h-4" />
                            {t.generateButton}
                        </button>

                        {credits !== null && credits === 0 && user && (
                            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                                <AlertCircle className="w-4 h-4 text-amber-400" />
                                <p className="text-xs text-amber-200">
                                    {t.creditsLeft}
                                    <button
                                        onClick={() => setIsPurchaseModalOpen(true)}
                                        className="ml-1 underline font-semibold"
                                    >
                                        {t.buyMore}
                                    </button>
                                </p>
                            </div>
                        )}
                    </div>
                </div>
                <h2 className="pt-4 text-xl font-bold bg-gradient-to-r from-pink-400 to-violet-400 bg-clip-text text-transparent">Reels generated by our users</h2>
                <VideoCarousel />
            </div>
            <Footer />
        </div>
    );
}
