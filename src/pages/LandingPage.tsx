import { useNavigate } from 'react-router-dom';
import { ArrowRight, Star, Zap } from 'lucide-react';

import logoImg from '../assets/logo.png';

export function LandingPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 overflow-hidden relative selection:bg-cyan-500/30">
            {/* Logo in top left */}
            <div className="absolute top-0 left-0 z-50 flex items-center">
                <img src={logoImg} alt="Reel Shortss" className="h-20 w-auto" />
            </div>
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 z-0 opacity-20"
                style={{
                    backgroundImage: `radial-gradient(circle at 2px 2px, #3f3f46 1px, transparent 0)`,
                    backgroundSize: '40px 40px'
                }}
            />

            {/* Subtle Glow Effects */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full z-0" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full z-0" />

            <main className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32 lg:pt-32 flex flex-col lg:flex-row items-center gap-16">
                {/* Left Content */}
                <div className="flex-1 text-center lg:text-left max-w-2xl">
                    {/* <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-medium text-zinc-400">
                        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                        <span className="flex items-center gap-1">
                            Powered by <span className="text-cyan-400 font-bold">GPT-5</span>
                        </span>
                    </div> */}

                    <h1 className="text-5xl lg:text-7xl font-black tracking-tight leading-[1.1] mb-0">

                        Create <span className="text-cyan-400 italic">viral</span> <br />
                        <span className="bg-gradient-to-r from-[#F58529] via-[#DD2A7B] to-[#8134AF] bg-clip-text text-transparent">
                            Insta
                        </span>{" "}
                        reels in just 1 minute <br />
                        <span className="relative inline-block">
                            <div className="absolute -bottom-2 left-0 w-full h-1 bg-cyan-400/30 blur-sm" />
                        </span>
                    </h1>

                    <p className="text-lg lg:text-xl text-zinc-400 font-medium leading-relaxed">
                        Post reels on Insta and Youtube to become influencer and earn money
                    </p>

                    <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
                        <button
                            onClick={() => navigate('/videoprompt')}
                            className="group relative px-8 py-4 bg-cyan-500 text-zinc-950 font-bold rounded-full hover:bg-cyan-400 transition-all active:scale-95 flex items-center gap-2 shadow-[0_0_20px_rgba(34,211,238,0.3)]"
                        >
                            Get Started
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>

                        <div className="flex items-center gap-4 px-6 py-4">
                            <div className="flex -space-x-3">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="w-10 h-10 rounded-full border-2 border-zinc-950 bg-zinc-800 overflow-hidden">
                                        <img
                                            src={`https://i.pravatar.cc/100?u=${i}`}
                                            alt="User"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                ))}
                            </div>
                            <div className="text-left">
                                <div className="flex gap-0.5 text-cyan-500">
                                    {[1, 2, 3, 4, 5].map((i) => <Star key={i} className="w-3.5 h-3.5 fill-current" />)}
                                </div>
                                <p className="text-xs text-zinc-500 font-medium mt-1">
                                    Trusted by 27,000+ creators
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Content - Tilted Cards */}
                <div className="flex-1 relative w-full max-w-md lg:max-w-none h-[400px] lg:h-[600px] mt-12 lg:mt-0 flex items-center justify-center">
                    {/* Card 1 */}
                    <div className="absolute w-48 lg:w-64 aspect-[9/16] bg-zinc-900 rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden transform -rotate-12 -translate-x-32 lg:-translate-x-48 z-10 transition-transform hover:scale-105 hover:z-30 duration-500">
                        <img
                            src="https://images.unsplash.com/photo-1582125169590-59f4985fb32a?auto=format&fit=crop&q=80&w=800"
                            className="w-full h-full object-cover opacity-60"
                            alt="Sample 1"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
                        <div className="absolute bottom-4 left-4 right-4">
                            <div className="h-1 w-12 bg-cyan-500 rounded-full mb-2" />
                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">The Cleopatra Effect</p>
                        </div>
                    </div>

                    {/* Card 2 (Center) */}
                    <div className="absolute w-56 lg:w-72 aspect-[9/16] bg-zinc-900 rounded-2xl border border-zinc-700 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden z-20 transition-transform hover:scale-105 duration-500">
                        <img
                            src="https://images.unsplash.com/photo-1541873676-a18131494184?auto=format&fit=crop&q=80&w=800"
                            className="w-full h-full object-cover"
                            alt="Sample 2"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
                        <div className="absolute bottom-6 left-6 right-6">
                            <div className="inline-block px-2 py-1 bg-cyan-500 text-zinc-950 text-[10px] font-black uppercase mb-3 rounded-sm">History</div>
                            <p className="text-sm font-bold leading-tight">Story of 1st Man on Moon</p>
                        </div>
                    </div>

                    {/* Card 3 */}
                    <div className="absolute w-48 lg:w-64 aspect-[9/16] bg-zinc-900 rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden transform rotate-12 translate-x-32 lg:translate-x-48 z-10 transition-transform hover:scale-105 hover:z-30 duration-500">
                        <img
                            src="https://plus.unsplash.com/premium_vector-1721077382049-f4deff3c4cf7?auto=format&fit=crop&q=80&w=800"
                            className="w-full h-full object-cover opacity-60"
                            alt="Sample 3"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
                        <div className="absolute bottom-4 left-4 right-4">
                            <div className="h-1 w-12 bg-indigo-500 rounded-full mb-2" />
                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Young boy and his dog friend</p>
                        </div>
                    </div>
                </div>
            </main>

            {/* Features Section (Subtle) */}
            <section className="relative z-10 max-w-7xl mx-auto px-6 py-20 border-t border-zinc-900">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                    {[
                        { title: 'AI Scripting', desc: 'Generate engaging scripts in seconds with our advanced AI.', icon: Zap },
                        { title: 'Voiceovers', desc: 'Choose from hundreds of realistic AI voices in any language.', icon: Zap },
                        { title: 'Auto-Visuals', desc: 'AI automatically finds or generates the perfect visuals for your story.', icon: Zap },
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
        </div>
    );
}
