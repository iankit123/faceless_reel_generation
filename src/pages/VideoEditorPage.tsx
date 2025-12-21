import { useVideoStore } from '../store/useVideoStore';
import { SceneList } from '../components/editor/SceneList';
import { SceneEditor } from '../components/editor/SceneEditor';
import { VideoPreview } from '../components/editor/VideoPreview';
import { CaptionsTab } from '../components/editor/CaptionsTab';
import { AudioTab } from '../components/editor/AudioTab';
import { useEffect, useState, useRef } from 'react';
import { Layers, Type, Music, ArrowLeft, Play } from 'lucide-react';
import { cn } from '../lib/utils';

type EditorTab = 'frames' | 'captions' | 'audio';

export function VideoEditorPage() {
    const project = useVideoStore((state) => state.project);
    const currentSceneId = useVideoStore((state) => state.currentSceneId);
    const setCurrentSceneId = useVideoStore((state) => state.setCurrentSceneId);
    const updateScene = useVideoStore((state) => state.updateScene);
    const resetProject = useVideoStore((state) => state.resetProject);
    const [activeTab, setActiveTab] = useState<EditorTab>('frames');
    const [mobileTab, setMobileTab] = useState<'scenes' | 'preview'>('scenes');
    const [isSceneEditorOpen, setIsSceneEditorOpen] = useState(false);
    const [forceAutoPlay, setForceAutoPlay] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const processingRef = useRef(false);

    useEffect(() => {
        if (project?.scenes.length && !currentSceneId) {
            setCurrentSceneId(project.scenes[0].id);
        }
    }, [project, currentSceneId, setCurrentSceneId]);

    // Auto-generate assets for pending scenes (Strictly Sequential)
    useEffect(() => {
        if (!project || isProcessing || processingRef.current) return;

        // Find the first pending scene
        const pendingScene = project.scenes.find(s => s.status === 'pending');
        if (!pendingScene) return;

        // Check if any scene is currently generating
        const isAnyGenerating = project.scenes.some(s =>
            s.status === 'generating_audio' || s.status === 'generating_image'
        );

        if (isAnyGenerating) return;

        const processScene = async () => {
            if (processingRef.current) return;
            processingRef.current = true;
            setIsProcessing(true);

            const scene = pendingScene;
            console.log('--- STARTING AUTO-GENERATION FOR SCENE:', scene.id, '---');

            // Update status to prevent double trigger
            updateScene(scene.id, { status: 'generating_audio' });

            try {
                // 1. Generate Audio
                const { ttsService } = await import('../services/tts');
                const voice = project.language === 'english' ? 'en-GB-SoniaNeural' : 'hi-IN-SwaraNeural';
                const { audioUrl } = await ttsService.generateAudio(scene.text, voice);

                // Get audio duration
                console.log('Audio generated, loading metadata...');
                const audio = new Audio(audioUrl);
                await Promise.race([
                    new Promise((resolve) => {
                        audio.onloadedmetadata = () => {
                            console.log('Audio metadata loaded, duration:', audio.duration);
                            resolve(true);
                        };
                    }),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Audio metadata timeout')), 10000))
                ]);
                const duration = Math.max(parseFloat(audio.duration.toFixed(1)), 0.5);

                updateScene(scene.id, {
                    audioUrl,
                    duration,
                    status: 'generating_image'
                });

                // Small delay between audio and image to be safe
                await new Promise(r => setTimeout(r, 1000));

                // 2. Generate Image
                const { imageService } = await import('../services/imageService');
                const fullPrompt = project.theme ? `${project.theme}. ${scene.imagePrompt || scene.text}` : (scene.imagePrompt || scene.text);
                const imageUrl = await imageService.generateImage(fullPrompt, scene.imageSettings);

                updateScene(scene.id, { imageUrl, status: 'ready' });

                // Cooldown before next scene starts
                console.log('Scene processed:', scene.id, '. Cooling down...');
                await new Promise(r => setTimeout(r, 2000));

            } catch (error) {
                console.error('Auto-generation failed for scene', scene.id, error);
                // Fallback to sample images
                const sampleImages = ['/samples/1.png', '/samples/2.png', '/samples/3.png', '/samples/4.png'];
                const randomImage = sampleImages[Math.floor(Math.random() * sampleImages.length)];
                updateScene(scene.id, {
                    imageUrl: randomImage,
                    status: 'ready'
                });
            } finally {
                setIsProcessing(false);
                processingRef.current = false;
            }
        };

        processScene();
    }, [project, updateScene, isProcessing]);

    if (!project) return null;

    const currentScene = project.scenes.find(s => s.id === currentSceneId) || project.scenes[0];

    return (
        <div className="h-screen flex flex-col lg:flex-row bg-zinc-950 text-zinc-100 overflow-hidden relative">
            {/* Desktop Sidebar Navigation */}
            <div className="hidden lg:flex w-20 border-r border-zinc-800 bg-zinc-950 flex-col items-center py-6 gap-4 shrink-0">
                <button
                    onClick={() => setActiveTab('frames')}
                    className={cn(
                        "p-3 rounded-xl transition-all flex flex-col items-center gap-1 text-[10px] font-medium w-16",
                        activeTab === 'frames'
                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                            : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"
                    )}
                >
                    <Layers className="w-6 h-6" />
                    Frames
                </button>
                <button
                    onClick={() => setActiveTab('captions')}
                    className={cn(
                        "p-3 rounded-xl transition-all flex flex-col items-center gap-1 text-[10px] font-medium w-16",
                        activeTab === 'captions'
                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                            : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"
                    )}
                >
                    <Type className="w-6 h-6" />
                    Captions
                </button>
                <button
                    onClick={() => setActiveTab('audio')}
                    className={cn(
                        "p-3 rounded-xl transition-all flex flex-col items-center gap-1 text-[10px] font-medium w-16",
                        activeTab === 'audio'
                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                            : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"
                    )}
                >
                    <Music className="w-6 h-6" />
                    Audio
                </button>

                <div className="mt-auto pb-6">
                    <button
                        onClick={() => {
                            if (window.confirm('Are you sure you want to change the prompt? This will clear your current project.')) {
                                resetProject();
                            }
                        }}
                        className="p-3 rounded-xl transition-all flex flex-col items-center gap-1 text-[10px] font-medium w-16 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"
                        title="Change Complete Prompt"
                    >
                        <ArrowLeft className="w-6 h-6" />
                        Back
                    </button>
                </div>
            </div>

            {/* Desktop Sidebar Content */}
            <div className="hidden lg:flex w-80 border-r border-zinc-800 bg-zinc-900/50 flex-col h-full shrink-0">
                {activeTab === 'frames' && (
                    <SceneList
                        scenes={project.scenes}
                        currentSceneId={currentSceneId}
                        onSelectScene={setCurrentSceneId}
                    />
                )}
                {activeTab === 'captions' && <CaptionsTab />}
                {activeTab === 'audio' && <AudioTab />}
            </div>

            {/* Desktop Main Editor Area */}
            <div className="hidden lg:flex flex-1 overflow-hidden">
                {currentScene && (
                    <>
                        <SceneEditor
                            scene={currentScene}
                            index={project.scenes.findIndex(s => s.id === currentSceneId)}
                            onUpdate={(updates) => updateScene(currentScene.id, updates)}
                        />
                        <VideoPreview
                            scenes={project.scenes}
                            currentSceneId={currentSceneId || project.scenes[0].id}
                            onSelectScene={setCurrentSceneId}
                        />
                    </>
                )}
            </div>

            {/* Mobile Layout */}
            <div className="flex lg:hidden flex-col h-full w-full overflow-hidden">
                {/* Mobile Top Navigation */}
                <div className="h-14 border-b border-zinc-800 bg-zinc-950 flex items-center shrink-0">
                    <button
                        onClick={() => setMobileTab('scenes')}
                        className={cn(
                            "flex-1 h-full flex flex-col items-center justify-center gap-1 transition-all",
                            mobileTab === 'scenes' ? "text-indigo-400" : "text-zinc-500"
                        )}
                    >
                        <Layers className="w-5 h-5" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Scenes</span>
                    </button>
                    <button
                        onClick={() => {
                            setMobileTab('preview');
                            setForceAutoPlay(false);
                        }}
                        className={cn(
                            "flex-1 h-full flex flex-col items-center justify-center gap-1 transition-all",
                            mobileTab === 'preview' ? "text-indigo-400" : "text-zinc-500"
                        )}
                    >
                        <Play className="w-5 h-5" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Preview</span>
                    </button>
                </div>

                {/* Mobile Content Area */}
                <div className="flex-1 overflow-hidden relative">
                    {mobileTab === 'scenes' ? (
                        <div className="h-full flex flex-col">
                            <div className="flex-1 overflow-y-auto">
                                <SceneList
                                    scenes={project.scenes}
                                    currentSceneId={currentSceneId}
                                    onSelectScene={(id) => {
                                        setCurrentSceneId(id);
                                        setIsSceneEditorOpen(true);
                                    }}
                                    onPlayScene={(id) => {
                                        setCurrentSceneId(id);
                                        setMobileTab('preview');
                                        setForceAutoPlay(true);
                                    }}
                                    isMobile={true}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col">
                            <VideoPreview
                                scenes={project.scenes}
                                currentSceneId={currentSceneId || project.scenes[0].id}
                                onSelectScene={setCurrentSceneId}
                                isMobile={true}
                                forceAutoPlay={forceAutoPlay}
                            />
                        </div>
                    )}

                    {/* Mobile Scene Editor Modal */}
                    {isSceneEditorOpen && currentScene && (
                        <div className="fixed inset-0 z-[60] bg-zinc-950 flex flex-col">
                            <div className="h-14 border-b border-zinc-800 flex items-center px-4 justify-between shrink-0">
                                <button
                                    onClick={() => setIsSceneEditorOpen(false)}
                                    className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                    <span className="text-sm font-medium">Back to Scenes</span>
                                </button>
                                <span className="text-sm font-bold text-indigo-400 font-mono">
                                    SCENE #{project.scenes.findIndex(s => s.id === currentSceneId) + 1}
                                </span>
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                <SceneEditor
                                    scene={currentScene}
                                    index={project.scenes.findIndex(s => s.id === currentSceneId)}
                                    onUpdate={(updates) => updateScene(currentScene.id, updates)}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
