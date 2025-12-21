import { useState } from 'react';
import { ScriptInput } from '../components/create/ScriptInput';
import { Wand2 } from 'lucide-react';
import { useVideoStore } from '../store/useVideoStore';
import { storyService } from '../services/story';
// import type { Scene } from '../types';

export function CreateVideoPage() {
    const [language, setLanguage] = useState('hinglish');
    const [script, setScript] = useState('');
    const isGenerating = useVideoStore((state) => state.isGenerating);
    const setGenerating = useVideoStore((state) => state.setGenerating);
    const initProject = useVideoStore((state) => state.initProject);
    const addScene = useVideoStore((state) => state.addScene);

    const handleGenerate = async () => {
        if (!script.trim()) return;
        setGenerating(true);

        try {
            const story = await storyService.generateStory({ prompt: script, language });

            initProject(story.theme, language);

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

        } catch (error) {
            console.error(error);
        } finally {
            setGenerating(false);
        }
    };

    const prompts = {
        english: [
            "Story of how a lion and dear became friends in jungle",
            "Video showing why new born baby cry a lot",
            "Ancient true story of Pyramids"
        ],
        hindi: [
            "Bhagwan krishna ki kahani jisme wo gaanv waalo ko pahad uthanke baarish se bachate hai",
            "Delhi ka itihaas ki sacchi kahani",
            "Panipat ki ladai ka video"
        ],
        hinglish: [
            "Bhagwan krishna ki kahani jisme wo gaanv waalo ko pahad uthanke baarish se bachate hai",
            "Delhi ka itihaas ki sacchi kahani",
            "Panipat ki ladai ka video"
        ]
    };

    const currentPrompts = prompts[language as keyof typeof prompts] || prompts.hinglish;

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8 flex items-center">
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 w-full">
                {/* Left Column */}
                <div className="flex flex-col justify-center">
                    <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                        Create New Video
                    </h1>
                    <p className="text-zinc-400 mb-8">
                        Turn your ideas into viral videos in seconds.
                    </p>

                    <div className="flex gap-4 mb-6">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-zinc-400 mb-2">Language</label>
                            <select
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
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
                    />

                    {/* Example Prompts */}
                    <div className="mt-4 flex flex-col gap-2">
                        {currentPrompts.map((p, i) => (
                            <button
                                key={i}
                                onClick={() => setScript(p)}
                                className="text-[11px] bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 px-4 py-2.5 rounded-xl transition-all text-left w-full"
                            >
                                {p}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating || !script.trim()}
                        className="mt-8 w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/20"
                    >
                        {isGenerating ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Generating Magic...</span>
                            </>
                        ) : (
                            <>
                                <Wand2 className="w-5 h-5" />
                                <span>Generate Video</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Right Column - Preview Mock */}
                <div className="hidden lg:flex items-center justify-center bg-zinc-900/50 rounded-3xl border border-zinc-800 p-8 backdrop-blur-sm">
                    <div className="relative w-[320px] aspect-[9/16] bg-zinc-950 rounded-2xl border border-zinc-800 overflow-hidden shadow-2xl ring-1 ring-zinc-800">
                        {/* Mock Content */}
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80 z-10" />
                        <img
                            src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1000&auto=format&fit=crop"
                            alt="Preview"
                            className="absolute inset-0 w-full h-full object-cover opacity-50"
                        />
                        <div className="absolute bottom-12 left-0 right-0 px-6 text-center z-20">
                            <p className="text-yellow-400 font-bold text-xl leading-tight drop-shadow-lg">
                                प्राचीन भारत में एक छोटा सा गाँव था...
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
