import type { Scene } from '../../types';
import { cn } from '../../lib/utils';
import { Clock, Image as ImageIcon, Loader2, Mic, Plus, Trash2, Play } from 'lucide-react';
import { useVideoStore } from '../../store/useVideoStore';

interface SceneListProps {
    scenes: Scene[];
    currentSceneId: number | string | null;
    onSelectScene: (id: number | string) => void;
    onPlayScene?: (id: number | string) => void;
    onPlayAll?: () => void;
    isMobile?: boolean;
}

import { useState } from 'react';
import { ConfirmModal } from '../ui/ConfirmModal';

export function SceneList({ scenes, currentSceneId, onSelectScene, onPlayScene, onPlayAll, isMobile }: SceneListProps) {
    const addSceneAt = useVideoStore(state => state.addSceneAt);
    const removeScene = useVideoStore(state => state.removeScene);
    const [sceneToDelete, setSceneToDelete] = useState<number | string | null>(null);
    const [loadedImages, setLoadedImages] = useState<Record<string | number, boolean>>({});

    const handleImageLoad = (sceneId: string | number) => {
        setLoadedImages(prev => ({ ...prev, [sceneId]: true }));
    };

    const handleAddScene = (index: number) => {
        const newScene: Scene = {
            id: crypto.randomUUID(),
            text: '',
            duration: 5,
            imageSettings: { width: 576, height: 1024, steps: 20, guidance: 7 },
            motionType: 'zoom_in',
            captionsEnabled: true,
            status: 'ready'
        };
        addSceneAt(index, newScene);
        onSelectScene(newScene.id);
    };

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                <div>
                    <h2 className="font-semibold text-zinc-100">Scenes</h2>
                    <p className="text-xs text-zinc-500">{scenes.length} scenes • {scenes.reduce((acc, s) => acc + s.duration, 0).toFixed(1)}s total</p>
                </div>
                {onPlayAll && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onPlayAll();
                        }}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all active:scale-95"
                    >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Play All</span>
                    </button>
                )}
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {scenes.map((scene, index) => (
                    <div key={scene.id} className="relative group/item">
                        {/* Insert Button Before (only for first item, or handled by previous item's after) */}
                        {index === 0 && (
                            <div className="h-2 flex items-center justify-center mb-2">
                                <button
                                    onClick={() => handleAddScene(0)}
                                    className="w-full h-6 rounded border border-dashed border-zinc-700 hover:border-zinc-500 flex items-center justify-center text-zinc-500 hover:text-zinc-300 bg-zinc-900/50"
                                >
                                    <Plus className="w-3 h-3" />
                                </button>
                            </div>
                        )}

                        <div className="relative">
                            <div
                                role="button"
                                tabIndex={0}
                                onClick={() => onSelectScene(scene.id)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        onSelectScene(scene.id);
                                    }
                                }}
                                className={cn(
                                    "w-full text-left p-3 rounded-lg border transition-all hover:bg-zinc-800/50 group relative pr-8 cursor-pointer",
                                    currentSceneId === scene.id
                                        ? "bg-zinc-800 border-indigo-500/50 ring-1 ring-indigo-500/20"
                                        : "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
                                )}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="flex flex-col items-center justify-center pt-1">
                                        <span className="text-[10px] font-bold text-zinc-600 font-mono">#{index + 1}</span>
                                    </div>
                                    <div className="w-16 h-16 bg-zinc-950 rounded-md flex items-center justify-center text-zinc-700 border border-zinc-800 shrink-0 overflow-hidden relative">
                                        {(scene.status === 'generating_image' || (scene.imageUrl && !loadedImages[scene.id])) ? (
                                            <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/80 z-10">
                                                <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                                            </div>
                                        ) : null}

                                        {scene.imageUrl ? (
                                            <img
                                                src={scene.imageUrl}
                                                alt=""
                                                className={cn(
                                                    "w-full h-full object-cover transition-opacity duration-300",
                                                    loadedImages[scene.id] ? "opacity-100" : "opacity-0"
                                                )}
                                                onLoad={() => handleImageLoad(scene.id)}
                                            />
                                        ) : (
                                            <ImageIcon className="w-5 h-5 opacity-20" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-zinc-300 line-clamp-2 mb-2 leading-snug">
                                            {scene.text || <span className="italic text-zinc-600">Empty scene</span>}
                                        </p>
                                        <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                                            <span className="flex items-center gap-1 bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800">
                                                <Clock className="w-3 h-3" /> {scene.duration}s
                                            </span>
                                            {scene.audioUrl && <Mic className="w-3 h-3 text-green-500" />}
                                            {scene.imageUrl && <ImageIcon className="w-3 h-3 text-blue-500" />}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Delete Button - Sibling to the clickable area */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSceneToDelete(scene.id);
                                }}
                                className={cn(
                                    "absolute right-2 p-2 rounded-full transition-all z-20",
                                    isMobile
                                        ? "top-2 bg-red-500/20 text-red-500 opacity-100"
                                        : "top-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white opacity-0 group-hover/item:opacity-100"
                                )}
                                title="Delete Scene"
                            >
                                <Trash2 className={cn("w-4 h-4", isMobile && "w-3.5 h-3.5")} />
                            </button>

                            {/* Play Button - Mobile Only */}
                            {isMobile && onPlayScene && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onPlayScene(scene.id);
                                    }}
                                    className="absolute bottom-2 right-2 p-2 rounded-full bg-indigo-600 text-white shadow-lg active:scale-95 transition-transform z-20"
                                    title="Play from here"
                                >
                                    <Play className="w-3.5 h-3.5 fill-current" />
                                </button>
                            )}
                        </div>

                        {/* Insert Button After */}
                        <div className="h-4 flex items-center justify-center -mb-2 z-10 relative">
                            <button
                                onClick={() => handleAddScene(index + 1)}
                                className="w-6 h-6 rounded-full border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-zinc-200 shadow-sm"
                                title="Add scene"
                            >
                                <Plus className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                ))}

                {
                    scenes.length === 0 && (
                        <button
                            onClick={() => handleAddScene(0)}
                            className="w-full p-4 rounded-lg border border-dashed border-zinc-800 hover:border-zinc-700 text-zinc-500 hover:text-zinc-400 flex flex-col items-center justify-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            <span>Add First Scene</span>
                        </button>
                    )
                }
            </div>

            <ConfirmModal
                isOpen={sceneToDelete !== null}
                title="Delete Scene"
                message="Are you sure you want to delete this scene? This action cannot be undone."
                confirmLabel="Delete"
                onConfirm={() => {
                    if (sceneToDelete) {
                        removeScene(sceneToDelete);
                        setSceneToDelete(null);
                    }
                }}
                onCancel={() => setSceneToDelete(null)}
            />
        </div>
    );
}
