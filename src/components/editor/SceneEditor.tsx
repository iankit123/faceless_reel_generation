import type { Scene, MotionType } from '../../types';
import { RefreshCw, Image as ImageIcon, Type, Play, Pause, Edit2, Upload, X, Loader2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { ttsService } from '../../services/tts';
import { imageService } from '../../services/imageService';
import { useVideoStore } from '../../store/useVideoStore';

interface SceneEditorProps {
    scene: Scene;
    index: number;
    onUpdate: (updates: Partial<Scene>) => void;
}

export function SceneEditor({ scene, index, onUpdate }: SceneEditorProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isRegeneratingAudio, setIsRegeneratingAudio] = useState(false);
    const [isRegeneratingImage, setIsRegeneratingImage] = useState(false);
    const [showImageModal, setShowImageModal] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        if (scene.audioUrl) {
            audioRef.current = new Audio(scene.audioUrl);
            audioRef.current.onended = () => setIsPlaying(false);
        }
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, [scene.audioUrl]);

    const toggleAudio = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleRegenerateAudio = async () => {
        if (!scene.text || !project) return;
        setIsRegeneratingAudio(true);
        try {
            const voice = project.language === 'english' ? 'en-GB-SoniaNeural' : 'hi-IN-SwaraNeural';
            const { audioUrl } = await ttsService.generateAudio(scene.text, voice);

            // Auto-update duration
            console.log('Audio generated, loading metadata for duration...');
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

            onUpdate({ audioUrl, duration });
        } catch (error) {
            console.error(error);
            alert('Failed to generate audio');
        } finally {
            setIsRegeneratingAudio(false);
        }
    };

    const project = useVideoStore(state => state.project);

    const handleRegenerateImage = async () => {
        setIsRegeneratingImage(true);
        try {
            // Start async generation
            const fullPrompt = project?.theme ? `${project.theme}. ${scene.imagePrompt || scene.text}` : (scene.imagePrompt || scene.text);
            const imageUrl = await imageService.generateImage(fullPrompt, scene.imageSettings);

            onUpdate({ imageUrl });
            setIsRegeneratingImage(false);
        } catch (error) {
            console.error(error);
            setIsRegeneratingImage(false);
            alert('Failed to start image generation');
        }
    };

    return (
        <div className="flex-1 p-4 lg:p-6 overflow-y-auto bg-zinc-950 relative h-full">
            <div className="max-w-2xl mx-auto space-y-8">
                {/* Script Section */}
                <div className="space-y-4">
                    <div className="flex flex-col">
                        <span className="text-[30px] font-bold text-indigo-400 uppercase tracking-widest font-mono leading-none">
                            Scene #{index + 1}
                        </span>
                        {/* 
                            TIP: The 'mt-6' below controls the gap between "Scene #x" and "Script & Audio". 
                            Change this value (e.g., mt-4, mt-8) to adjust the spacing.
                        */}
                        <div className="mt-6">
                            <h3 className="text-lg font-medium text-zinc-100 flex items-center gap-2">
                                <Type className="w-4 h-4 text-indigo-400" />
                                Script & Audio
                            </h3>
                        </div>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all">
                        <textarea
                            value={scene.text}
                            onChange={(e) => onUpdate({ text: e.target.value })}
                            className="w-full h-32 bg-transparent p-4 text-zinc-100 focus:outline-none resize-none"
                            placeholder="Enter scene script here..."
                        />
                        <div className="border-t border-zinc-800/50 p-3 flex items-center gap-4 bg-zinc-900/50">
                            {scene.audioUrl && (
                                <button
                                    onClick={toggleAudio}
                                    className="p-2.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-100 transition-colors shadow-lg"
                                    title={isPlaying ? "Pause" : "Play"}
                                >
                                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                </button>
                            )}
                            <button
                                onClick={handleRegenerateAudio}
                                disabled={isRegeneratingAudio}
                                className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-2 transition-colors disabled:opacity-50 font-medium"
                            >
                                <RefreshCw className={`w-4 h-4 ${isRegeneratingAudio ? 'animate-spin' : ''}`} />
                                {isRegeneratingAudio ? 'Generating...' : 'Regenerate Audio'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Image & Motion Section - 2 Column Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left Column: Controls */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium text-zinc-100 flex items-center gap-2">
                                <ImageIcon className="w-4 h-4 text-pink-400" />
                                Image & Motion
                            </h3>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-zinc-500 mb-2">Motion Type</label>
                                <select
                                    value={scene.motionType}
                                    onChange={(e) => onUpdate({ motionType: e.target.value as MotionType })}
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-200 focus:ring-2 focus:ring-pink-500/50 focus:outline-none"
                                >
                                    <option value="none">No Motion</option>
                                    <option value="zoom_in">Zoom In</option>
                                    <option value="pan_left">Pan Left</option>
                                    <option value="pan_right">Pan Right</option>
                                    <option value="pan_up">Pan Up</option>
                                    <option value="pan_down">Pan Down</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-zinc-500 mb-2">Duration (sec)</label>
                                <input
                                    type="number"
                                    value={scene.duration}
                                    onChange={(e) => onUpdate({ duration: Number(e.target.value) })}
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-200 focus:ring-2 focus:ring-pink-500/50 focus:outline-none"
                                />
                            </div>

                            <div className="pt-4 border-t border-zinc-800">
                                <button
                                    onClick={() => setShowImageModal(true)}
                                    className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    <Edit2 className="w-4 h-4" />
                                    Edit / Regenerate Image
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Vertical Preview */}
                    <div className="flex justify-center bg-zinc-900/30 rounded-xl p-4 border border-zinc-800/50">
                        <div className="relative w-[200px] aspect-[9/16] bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden group shadow-lg">
                            {scene.status === 'generating_image' || isRegeneratingImage ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900/80 z-10">
                                    <Loader2 className="w-8 h-8 text-pink-500 animate-spin mb-2" />
                                    <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">Generating...</span>
                                </div>
                            ) : null}

                            {scene.imageUrl ? (
                                <img src={scene.imageUrl} alt="Scene" className="w-full h-full object-cover" />
                            ) : (
                                <div className="flex items-center justify-center h-full text-zinc-700">
                                    No Image
                                </div>
                            )}

                            {/* Edit Overlay */}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <button
                                    onClick={() => setShowImageModal(true)}
                                    className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-full text-white transition-colors shadow-lg"
                                    title="Edit Image"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Image Editor Modal */}
            {showImageModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 space-y-6 shadow-2xl">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-white">Edit Image</h3>
                            <button onClick={() => setShowImageModal(false)} className="text-zinc-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Option 1: Upload */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-zinc-400">Upload Image</label>
                                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-zinc-800 border-dashed rounded-xl cursor-pointer hover:border-zinc-600 hover:bg-zinc-800/50 transition-all">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <Upload className="w-8 h-8 text-zinc-500 mb-2" />
                                        <p className="text-sm text-zinc-500">Click to upload</p>
                                    </div>
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                const url = URL.createObjectURL(file);
                                                onUpdate({ imageUrl: url });
                                                setShowImageModal(false);
                                            }
                                        }}
                                    />
                                </label>
                            </div>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-zinc-800" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-zinc-900 px-2 text-zinc-500">Or generate new</span>
                                </div>
                            </div>

                            {/* Option 2: Generate */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-zinc-400">Image Prompt</label>
                                <textarea
                                    value={scene.imagePrompt || scene.text}
                                    onChange={(e) => onUpdate({ imagePrompt: e.target.value })}
                                    className="w-full h-24 bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-100 focus:ring-2 focus:ring-pink-500/50 focus:outline-none resize-none"
                                    placeholder="Describe the image..."
                                />
                                <button
                                    onClick={() => {
                                        handleRegenerateImage();
                                        setShowImageModal(false);
                                    }}
                                    className="w-full bg-pink-600 hover:bg-pink-500 text-white font-medium py-2 rounded-lg transition-colors"
                                >
                                    Generate
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
