import { useNavigate } from 'react-router-dom';
import { ArrowRight, Star, Zap } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { supabaseService } from '../services/supabase';
import { useVideoStore } from '../store/useVideoStore';
import { translations } from '../utils/translations';
import { VideoCarousel } from '../components/VideoCarousel';
import { Footer } from '../components/layout/Footer';

export function LandingPage() {
    const navigate = useNavigate();
    const uiLanguage = useVideoStore((s) => s.uiLanguage);
    const t = translations[uiLanguage];

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 overflow-hidden relative selection:bg-cyan-500/30">
            <Header hideUserMenu={true} isFixed={false} />
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none"
                style={{
                    backgroundImage: `radial-gradient(circle at 2px 2px, #3f3f46 1px, transparent 0)`,
                    backgroundSize: '40px 40px'
                }}
            />

            {/* Subtle Glow Effects */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full z-0 pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full z-0 pointer-events-none" />

            <main className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-4 flex flex-col items-center">
                {/* Hero Headers */}
                <div className="text-center max-w-3xl mb-4">
                    <h1 className="text-5xl lg:text-7xl font-black tracking-tight leading-[1.1] mb-4">
                        {uiLanguage === 'hi' ? (
                            <>
                                अब <span className="text-cyan-400 italic">1 मिनट</span> <br />
                                में <span className="bg-gradient-to-r from-[#F58529] via-[#DD2A7B] to-[#8134AF] bg-clip-text text-transparent">वायरल रील्स</span> बनाएं
                            </>
                        ) : (
                            <>
                                {t.heroTitle_1} <span className="text-cyan-400 italic">{t.heroTitle_italic}</span> <br />
                                <span className="bg-gradient-to-r from-[#F58529] via-[#DD2A7B] to-[#8134AF] bg-clip-text text-transparent">
                                    Insta
                                </span>{" "}
                                {t.heroTitle_2}
                            </>
                        )}
                    </h1>

                    <p className="text-lg lg:text-xl text-zinc-300 font-medium leading-relaxed mb-6 px-4">
                        {t.heroSubtitle}
                    </p>

                    <div className="flex flex-col items-center gap-6">
                        {/* Main CTA */}
                        <button
                            onClick={() => {
                                supabaseService.logEvent('get_started_click');
                                navigate('/videoprompt');
                            }}
                            className="group relative px-8 py-3.5 bg-cyan-500 text-zinc-950 font-bold rounded-full hover:bg-cyan-400 transition-all active:scale-95 flex items-center gap-3 shadow-[0_0_30px_rgba(34,211,238,0.4)] whitespace-nowrap"
                        >
                            <span className="text-lg tracking-tight">{t.createFirstVideo || "Create your first video"}</span>
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>

                        {/* Social Proof */}
                        <div className="space-y-3">
                            <div className="flex -space-x-3 items-center justify-center">
                                {[1, 2, 3, 4, 5, 6].map((i) => (
                                    <div key={i} className="w-10 h-10 rounded-full border-2 border-zinc-950 bg-zinc-800 overflow-hidden ring-1 ring-zinc-800/50">
                                        <img
                                            src={`https://i.pravatar.cc/100?u=avatar_${i}`}
                                            alt="User"
                                            className="w-full h-full object-cover grayscale-[0.5] hover:grayscale-0 transition-all"
                                        />
                                    </div >
                                ))}
                            </div >
                            <div className="flex flex-col items-center gap-1">
                                <div className="flex gap-0.5 text-amber-400">
                                    {[1, 2, 3, 4, 5].map((i) => <Star key={i} className="w-5 h-5 fill-current" />)}
                                </div>
                                <p className="text-md text-zinc-400 font-bold tracking-tight">
                                    {t.trustedBy}
                                </p>
                            </div>
                        </div>
                    </div >
                </div>
            </main>

            {/* True Full-Width Horizontal Moving Cards */}
            <VideoCarousel />

            {/* Features Section (Subtle) */}
            <section className="relative z-10 max-w-7xl mx-auto px-6 py-12 border-t border-zinc-900 mt-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                    {[
                        { title: t.feature1Title, desc: t.feature1Desc, icon: Zap },
                        { title: t.feature2Title, desc: t.feature2Desc, icon: Zap },
                        { title: t.feature3Title, desc: t.feature3Desc, icon: Zap },
                    ].map((f, i) => (
                        <div key={i} className="space-y-4 group">
                            <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:border-cyan-500/50 transition-colors">
                                <f.icon className="w-5 h-5 text-cyan-400" />
                            </div>
                            <h3 className="text-lg font-bold">{f.title}</h3>
                            <p className="text-sm text-zinc-500 leading-relaxed">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>
            <Footer />
        </div>
    );
}
