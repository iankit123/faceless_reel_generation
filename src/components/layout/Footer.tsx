import { Link } from 'react-router-dom';
import { Mail, Shield, FileText } from 'lucide-react';

export function Footer() {
    return (
        <footer className="bg-zinc-950 border-t border-zinc-900 py-12 px-4 mt-auto relative z-50">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
                {/* Brand Section */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 group">
                        {/* <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Video className="w-5 h-5 text-white" />
                        </div> */}
                        {/* <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-500">
                            ReelAI
                        </span> */}
                    </div>
                    {/* <p className="text-zinc-500 text-sm max-w-xs leading-relaxed">
                        Create viral-ready reels from simple prompts or screenshots using state-of-the-art AI.
                    </p> */}
                </div>

                {/* Quick Links
                <div>
                    <h3 className="text-white font-semibold mb-4 uppercase text-xs tracking-widest">Platform</h3>
                    <ul className="space-y-3">
                        <li>
                            <Link to="/videoprompt" className="text-zinc-500 hover:text-indigo-400 text-sm transition-colors block">
                                Create Video
                            </Link>
                        </li>
                        <li>
                            <Link to="/" className="text-zinc-500 hover:text-indigo-400 text-sm transition-colors block">
                                Showcase
                            </Link>
                        </li>
                    </ul>
                </div> */}

                {/* Legal Section */}
                <div>
                    <h3 className="text-white font-semibold mb-4 uppercase text-xs tracking-widest">Legal</h3>
                    <ul className="space-y-3">
                        <li>
                            <Link to="/privacypolicy" className="text-zinc-500 hover:text-indigo-400 text-sm transition-colors flex items-center gap-2">
                                <Shield className="w-4 h-4" />
                                Privacy Policy
                            </Link>
                        </li>
                        <li>
                            <Link to="/terms" className="text-zinc-500 hover:text-indigo-400 text-sm transition-colors flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                Terms of Service
                            </Link>
                        </li>
                        <li>
                            <a href="mailto:support@reelai.com" className="text-zinc-500 hover:text-indigo-400 text-sm transition-colors flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                Contact Support
                            </a>
                        </li>
                    </ul>
                </div>
            </div>

            <div className="max-w-7xl mx-auto pt-12 mt-12 border-t border-zinc-900 flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-zinc-600 text-xs">
                    © {new Date().getFullYear()} ReelAI. All rights reserved.
                </p>
                <div className="flex items-center gap-6">
                    <span className="text-zinc-700 text-[10px] uppercase font-bold tracking-widest">Powered by Groq & Supabase</span>
                </div>
            </div>
        </footer>
    );
}
