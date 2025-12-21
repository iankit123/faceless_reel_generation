import { useVideoStore } from '../store/useVideoStore';
import { SceneList } from '../components/editor/SceneList';
import { SceneEditor } from '../components/editor/SceneEditor';
import { VideoPreview } from '../components/editor/VideoPreview';
import { CaptionsTab } from '../components/editor/CaptionsTab';
import { AudioTab } from '../components/editor/AudioTab';
import { useEffect, useState } from 'react';
import { Layers, Type, Music } from 'lucide-react';
import { cn } from '../lib/utils';

type EditorTab = 'frames' | 'captions' | 'audio';

export function VideoEditorPage() {
    const project = useVideoStore((state) => state.project);
    const currentSceneId = useVideoStore((state) => state.currentSceneId);
    const setCurrentSceneId = useVideoStore((state) => state.setCurrentSceneId);
    const updateScene = useVideoStore((state) => state.updateScene);
    const [activeTab, setActiveTab] = useState<EditorTab>('frames');
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (project?.scenes.length && !currentSceneId) {
            setCurrentSceneId(project.scenes[0].id);
        }
    }, [project, currentSceneId, setCurrentSceneId]);

    // Auto-generate assets for pending scenes (Strictly Sequential)
    useEffect(() => {
        if (!project || isProcessing) return;

        // Find the first pending scene
        const pendingScene = project.scenes.find(s => s.status === 'pending');
        if (!pendingScene) return;

        // Check if any scene is currently generating
        const isAnyGenerating = project.scenes.some(s =>
            s.status === 'generating_audio' || s.status === 'generating_image'
        );

        if (isAnyGenerating) return;

        const processScene = async () => {
            if (isProcessing) return;
            setIsProcessing(true);
            const scene = pendingScene;

            // Update status to prevent double trigger
            updateScene(scene.id, { status: 'generating_audio' });

            try {
                // 1. Generate Audio
                const { ttsService } = await import('../services/tts');
                const { audioUrl } = await ttsService.generateAudio(scene.text);

                // Get audio duration
                const audio = new Audio(audioUrl);
                await new Promise((resolve) => {
                    audio.onloadedmetadata = () => resolve(true);
                });
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
                console.log('Scene processed. Cooling down...');
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
            }
        };

        processScene();
    }, [project, updateScene, isProcessing]);

    if (!project) return null;

    const currentScene = project.scenes.find(s => s.id === currentSceneId) || project.scenes[0];

    return (
        <div className="h-screen flex bg-zinc-950 text-zinc-100 overflow-hidden">
            {/* Sidebar Navigation */}
            <div className="w-20 border-r border-zinc-800 bg-zinc-950 flex flex-col items-center py-6 gap-4">
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
            </div>

            {/* Sidebar Content */}
            <div className="w-80 border-r border-zinc-800 bg-zinc-900/50 flex flex-col h-full">
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

            {/* Main Editor Area */}
            {currentScene && (
                <>
                    <SceneEditor
                        scene={currentScene}
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
    );
}
