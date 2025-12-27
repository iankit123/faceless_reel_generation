import { useVideoStore } from '../store/useVideoStore';
import { SceneList } from '../components/editor/SceneList';
import { SceneEditor } from '../components/editor/SceneEditor';
import { VideoPreview } from '../components/editor/VideoPreview';
import { CaptionsTab } from '../components/editor/CaptionsTab';
import { AudioTab } from '../components/editor/AudioTab';
import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Layers, Type, Music, ArrowLeft, Play, PlusIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import { ConfirmModal } from '../components/ui/ConfirmModal';

type EditorTab = 'frames' | 'captions' | 'audio';

export function VideoEditorPage() {
    const navigate = useNavigate();
    const project = useVideoStore((state) => state.project);
    const currentSceneId = useVideoStore((state) => state.currentSceneId);
    const setCurrentSceneId = useVideoStore((state) => state.setCurrentSceneId);
    const updateScene = useVideoStore((state) => state.updateScene);
    const resetProject = useVideoStore((state) => state.resetProject);
    const [activeTab, setActiveTab] = useState<EditorTab>('frames');
    const [searchParams, setSearchParams] = useSearchParams();
    const mobileTab = (searchParams.get('tab') === 'preview' ? 'preview' : 'scenes') as 'scenes' | 'preview';
    const [isSceneEditorOpen, setIsSceneEditorOpen] = useState(false);
    const [forceAutoPlay, setForceAutoPlay] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const processingRef = useRef(false);

    // Confirmation Modal State
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { }
    });

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

                if (scene.imageUrl) {
                    // Skip image generation if we already have a fixed image
                    console.log('AUTO_GEN: Scene has pre-set image, skipping generation');
                    updateScene(scene.id, {
                        audioUrl,
                        duration,
                        status: 'ready'
                    });
                } else if (project.isNews || project.isHoroscope) {
                    // For News and Horoscope, do NOT generate AI images if missing
                    console.log('AUTO_GEN: News/Horoscope missing image, skipping generation to avoid irrelevant visuals');
                    updateScene(scene.id, {
                        audioUrl,
                        duration,
                        status: 'ready'
                    });
                } else {
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
                }

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

    const handleViewVideo = () => {
        if (!project || project.scenes.length === 0) return;
        setCurrentSceneId(project.scenes[0].id);
        setForceAutoPlay(true);
        setActiveTab('frames'); // For desktop, ensure we see the side
        setSearchParams({ tab: 'preview' }); // URL navigation
    };

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
                {!project?.isPhotoReel && (
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
                )}
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
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (confirmModal.isOpen) return; // Guard
                            console.log('DEBUG: [VideoEditorPage] Desktop Back/Change Prompt clicked');
                            setConfirmModal({
                                isOpen: true,
                                title: 'Change Prompt',
                                message: 'Are you sure you want to change the prompt? This will clear your current project.',
                                onConfirm: () => {
                                    console.log('DEBUG: [VideoEditorPage] Desktop Confirm OK, resetting and navigating');
                                    resetProject();
                                    navigate('/videoprompt');
                                }
                            });
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
                        onSelectScene={(id) => {
                            setCurrentSceneId(id);
                            setForceAutoPlay(true);
                        }}
                        onViewVideo={handleViewVideo}
                    />
                )}
                {activeTab === 'captions' && !project?.isPhotoReel && <CaptionsTab />}
                {activeTab === 'audio' && <AudioTab onSelect={() => setActiveTab('frames')} />}
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
                <div className="h-14 border-b border-zinc-800 bg-zinc-950 flex items-center shrink-0 sticky top-0 z-50">
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (confirmModal.isOpen) return; // Guard
                            console.log('DEBUG: [VideoEditorPage] New Video button clicked');
                            setConfirmModal({
                                isOpen: true,
                                title: 'Start New Video',
                                message: 'Start a new video? This will clear your current project.',
                                onConfirm: () => {
                                    console.log('DEBUG: [VideoEditorPage] Confirm OK, resetting project and navigating to /videoprompt');
                                    resetProject();
                                    navigate('/videoprompt');
                                }
                            });
                        }}
                        className="flex-1 h-full flex flex-col items-center justify-center gap-1 transition-all relative text-zinc-500 hover:text-zinc-400"
                    >
                        <PlusIcon className="w-5 h-5 rotate-90" /> {/* Or a Plus icon */}
                        <span className="text-[10px] font-bold uppercase tracking-wider">New Video</span>
                    </button>
                    <button
                        onClick={() => setSearchParams({})}
                        className={cn(
                            "flex-1 h-full flex flex-col items-center justify-center gap-1 transition-all relative",
                            mobileTab === 'scenes'
                                ? "text-indigo-400 bg-indigo-500/5"
                                : "text-zinc-500 hover:text-zinc-400"
                        )}
                    >
                        <Layers className="w-5 h-5" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Scenes</span>
                        {mobileTab === 'scenes' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />
                        )}
                    </button>
                    <button
                        onClick={() => setSearchParams({ tab: 'preview' })}
                        className={cn(
                            "flex-1 h-full flex flex-col items-center justify-center gap-1 transition-all relative",
                            mobileTab === 'preview'
                                ? "text-indigo-400 bg-indigo-500/5"
                                : "text-zinc-500 hover:text-zinc-400"
                        )}
                    >
                        <Play className="w-5 h-5" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Preview</span>
                        {mobileTab === 'preview' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />
                        )}
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
                                        setSearchParams({ tab: 'preview' });
                                        setForceAutoPlay(true);
                                    }}
                                    onPlayAll={() => {
                                        if (project.scenes.length > 0) {
                                            setCurrentSceneId(project.scenes[0].id);
                                            setSearchParams({ tab: 'preview' });
                                            setForceAutoPlay(true);
                                        }
                                    }}
                                    onViewVideo={handleViewVideo}
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
                                onBackToScenes={() => setSearchParams({})}
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

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                onConfirm={() => {
                    confirmModal.onConfirm();
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                }}
                onCancel={() => {
                    console.log('DEBUG: [VideoEditorPage] Confirm Modal Cancelled');
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                }}
            />
        </div>
    );
}
