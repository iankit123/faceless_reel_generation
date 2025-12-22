import { ArrowRight, Star, Zap } from 'lucide-react';

interface LandingPageProps {
    onGetStarted: () => void;
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 overflow-hidden relative selection:bg-cyan-500/30">
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
                <div className="flex-1 text-center lg:text-left space-y-8 max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-medium text-zinc-400">
                        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                        <span className="flex items-center gap-1">
                            Powered by <span className="text-cyan-400 font-bold">GPT-5</span>
                        </span>
                    </div>

                    <h1 className="text-5xl lg:text-7xl font-black tracking-tight leading-[1.1]">
                        Create <span className="text-cyan-400 italic">viral</span> <br />
                        faceless videos <br />
                        on <span className="relative inline-block">
                            Auto-Pilot.
                            <div className="absolute -bottom-2 left-0 w-full h-1 bg-cyan-400/30 blur-sm" />
                        </span>
                    </h1>

                    <p className="text-lg lg:text-xl text-zinc-400 font-medium leading-relaxed">
                        Create AI Videos in minutes. Our AI creation tool <br className="hidden lg:block" />
                        creates viral AI videos for you.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
                        <button
                            onClick={onGetStarted}
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
                <div className="flex-1 relative w-full h-[400px] lg:h-[600px] mt-12 lg:mt-0 flex items-center justify-center">
                    <div className="relative w-full max-w-[320px] lg:max-w-[480px] h-full flex items-center justify-center">
                        {/* Card 1 */}
                        <div className="absolute w-48 lg:w-64 aspect-[9/16] bg-zinc-900 rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden -rotate-12 -translate-x-24 lg:-translate-x-32 z-10 transition-transform hover:scale-105 hover:z-30 duration-500">
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
                                <div className="inline-block px-2 py-1 bg-cyan-500 text-zinc-950 text-[10px] font-black uppercase mb-3 rounded-sm">Strategist</div>
                                <p className="text-sm font-bold leading-tight">How to build a galactic empire in 3 steps</p>
                            </div>
                        </div>

                        {/* Card 3 */}
                        <div className="absolute w-48 lg:w-64 aspect-[9/16] bg-zinc-900 rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden rotate-12 translate-x-24 lg:translate-x-32 z-10 transition-transform hover:scale-105 hover:z-30 duration-500">
                            <img
                                src="https://plus.unsplash.com/premium_vector-1721077382049-f4deff3c4cf7?auto=format&fit=crop&q=80&w=800"
                                className="w-full h-full object-cover opacity-60"
                                alt="Sample 3"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
                            <div className="absolute bottom-4 left-4 right-4">
                                <div className="h-1 w-12 bg-indigo-500 rounded-full mb-2" />
                                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">1969 History</p>
                            </div>
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
