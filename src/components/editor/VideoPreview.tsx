import type { Scene } from '../../types';
import { Play, Pause, Download, Type, Music, ArrowLeft, Layers, Share2, X, Check } from 'lucide-react';
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useVideoStore } from '../../store/useVideoStore';
import { CaptionsTab } from './CaptionsTab';
import { AudioTab } from './AudioTab';
import { cn } from '../../lib/utils';
import { getTimedCaptions } from '../../lib/captions';
import { UpgradeModal } from '../modals/UpgradeModal';
import { PurchaseCreditModal } from '../modals/PurchaseCreditModal';
import { useAuth } from '../../contexts/AuthContext';
import { SignInModal } from '../modals/SignInModal';

interface VideoPreviewProps {
    scenes: Scene[];
    currentSceneId: number | string;
    onSelectScene: (id: number | string) => void;
    isMobile?: boolean;
    forceAutoPlay?: boolean;
    onBackToScenes?: () => void;
}

export function VideoPreview({ scenes, currentSceneId, onSelectScene, isMobile, forceAutoPlay, onBackToScenes }: VideoPreviewProps) {
    const project = useVideoStore(state => state.project);
    const { user, credits } = useAuth();
    const scene = scenes.find(s => s.id === currentSceneId) || scenes[0];
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [activeSubTab, setActiveSubTab] = useState<'preview' | 'captions' | 'audio'>('preview');
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
    const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
    const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
    const [exportState, setExportState] = useState<'idle' | 'exporting' | 'success' | 'error'>('idle');
    const [exportError, setExportError] = useState<string | null>(null);
    const [hasAudioError, setHasAudioError] = useState(false);

    const regenerateAllAudio = useVideoStore(state => state.regenerateAllAudio);

    const handleExport = useCallback(async () => {
        setIsPlaying(false);

        // 1. Guest Check
        if (!user) {
            localStorage.setItem('pending_download', 'true');
            setIsSignInModalOpen(true);
            return;
        }

        // 2. Credit Check (> 0 instead of > 2)
        if (credits !== null && credits > 0) {
            console.log('EXPORT: Initiation export request...');
            setExportState('exporting');
            setExportError(null);

            try {
                const response = await fetch('/api/video/export', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        scenes: scenes,
                        backgroundMusic: project?.backgroundMusic,
                        narrationVolume: project?.narrationVolume || 1.0,
                        language: project?.language || 'hindi',
                        captionSettings: project?.captionSettings,
                        fixedImageUrl: project?.fixedImageUrl,
                        isHoroscope: project?.isHoroscope
                    })
                });

                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.details || 'Export failed');
                }

                console.log('EXPORT: Success! Downloading blob...');
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `my-reel-${Date.now()}.mp4`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                console.log('EXPORT: Download triggered successfully');
                setExportState('success');
            } catch (error) {
                console.error('EXPORT: Error during export:', error);
                setExportState('error');
                setExportError(error instanceof Error ? error.message : String(error));
            }
        } else {
            setIsUpgradeModalOpen(true);
        }
    }, [user, credits, scenes, project]);

    // Handle Auto-download after sign-in
    useEffect(() => {
        const isReady = scenes.every(s => s.status === 'ready');
        if (user && credits !== null && isReady && localStorage.getItem('pending_download') === 'true') {
            localStorage.removeItem('pending_download');
            handleExport();
        }
    }, [user, credits, handleExport, scenes]);

    const handleShare = () => {
        setIsPlaying(false);
        if (!user) {
            setIsSignInModalOpen(true);
            return;
        }
        if (credits !== null && credits > 0) {
            alert("Preparing for Instagram... Your video will be ready shortly.");
        } else {
            setIsUpgradeModalOpen(true);
        }
    };

    // Dynamic Captions
    const captionSegments = useMemo(() => {
        if (!scene?.text || !scene?.duration) return [];
        return getTimedCaptions(scene.text, scene.duration);
    }, [scene?.text, scene?.duration]);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const autoPlayRef = useRef(false);
    // Ref for silence start
    const silenceStartRef = useRef<number | null>(null);
    // Ref for animation loop to avoid dependency cycles
    const requestRef = useRef<number | null>(null);

    // Reset silence ref when scene changes
    useEffect(() => {
        silenceStartRef.current = null;
        setHasAudioError(false);
    }, [scene.id]);

    // Handle forceAutoPlay
    useEffect(() => {
        if (forceAutoPlay) {
            autoPlayRef.current = true;
        }
    }, [forceAutoPlay, scene.id]);

    const totalDuration = useMemo(() => scenes.reduce((acc, s) => acc + s.duration, 0), [scenes]);
    const currentSceneStartTime = useMemo(() => {
        const index = scenes.findIndex(s => s.id === currentSceneId);
        if (index === -1) return 0;
        return scenes.slice(0, index).reduce((acc, s) => acc + s.duration, 0);
    }, [scenes, currentSceneId]);

    const activeCaption = useMemo(() => {
        if (!scene) return '';
        const localTime = Math.max(0, currentTime - currentSceneStartTime);
        const segment = captionSegments.find(s => localTime >= s.start && localTime < s.end);
        if (segment) return segment.text;
        // Fallback to first segment if at start, or last if at end, or full text if no segments
        if (localTime <= 0 && captionSegments.length > 0) return captionSegments[0].text;
        if (localTime >= scene.duration && captionSegments.length > 0) return captionSegments[captionSegments.length - 1].text;
        return scene.text;
    }, [currentTime, currentSceneStartTime, captionSegments, scene]);

    const triggerNextScene = useCallback(() => {
        const currentIndex = scenes.findIndex(s => s.id === scene.id);
        if (currentIndex < scenes.length - 1) {
            autoPlayRef.current = true;
            onSelectScene(scenes[currentIndex + 1].id);
        } else {
            // End of video
            setIsPlaying(false);
        }
    }, [scenes, scene.id, onSelectScene]);

    const audioCtxRef = useRef<AudioContext | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);
    const bgGainNodeRef = useRef<GainNode | null>(null);
    const bgSourceRef = useRef<MediaElementAudioSourceNode | null>(null);

    // Audio setup effect
    useEffect(() => {
        // Reset audio when scene changes
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
            if (!autoPlayRef.current) {
                setIsPlaying(false);
            }
        }

        // Initialize AudioContext and GainNodes
        if (!audioCtxRef.current) {
            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                audioCtxRef.current = new (window.AudioContext || (window as any).AudioContext)();

                // Narration Gain
                gainNodeRef.current = audioCtxRef.current.createGain();
                gainNodeRef.current.connect(audioCtxRef.current.destination);

                // Background Music Gain
                bgGainNodeRef.current = audioCtxRef.current.createGain();
                bgGainNodeRef.current.connect(audioCtxRef.current.destination);
            } catch (err) {
                console.error("Failed to initialize AudioContext:", err);
            }
        }

        // Reset time to start of scene
        setCurrentTime(currentSceneStartTime);

        if (scene?.audioUrl) {
            const currentAudioUrl = scene.audioUrl;
            const audio = new Audio(currentAudioUrl);
            audio.crossOrigin = "anonymous";
            audioRef.current = audio;

            // Apply boosted volume via GainNode
            const volume = project?.narrationVolume ?? 1.0;
            if (audioCtxRef.current && gainNodeRef.current) {
                try {
                    const source = audioCtxRef.current.createMediaElementSource(audio);
                    source.connect(gainNodeRef.current);
                    gainNodeRef.current.gain.value = volume;
                } catch {
                    audio.volume = Math.min(volume, 1.0);
                }
            } else {
                audio.volume = Math.min(volume, 1.0);
            }

            // Handle audio ending
            audio.onended = () => {
                if (silenceStartRef.current === null) {
                    silenceStartRef.current = performance.now();
                }
            };

            // Diagnostic for dead blobs
            audio.onerror = () => {
                const err = audio.error;
                if (err && (err.code === 4 || currentAudioUrl.startsWith('blob:'))) {
                    console.warn(`Audio source failed for scene ${scene.id}. This often happens with stale session blobs.`);
                    setHasAudioError(true);
                }
            };

            // Auto-play ONLY if flag is set (e.g. from scene transition or manual play intent)
            if (autoPlayRef.current) {
                const playPromise = audio.play();
                if (playPromise !== undefined) {
                    playPromise
                        .then(() => setIsPlaying(true))
                        .catch(error => {
                            if (error.name === 'AbortError') return; // Silence unmount interruptions
                            console.error("Auto-play failed:", error);
                            setIsPlaying(false);
                        });
                }
                autoPlayRef.current = false;
            } else if (!isPlaying) {
                // If not playing and no autoplay intent, ensure audio is paused
                audio.pause();
            }
        }

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, [scene?.audioUrl, scene?.id, currentSceneStartTime, scene?.duration, project?.narrationVolume]);

    // Live Narration Volume Update
    useEffect(() => {
        const volume = project?.narrationVolume ?? 1.0;
        if (gainNodeRef.current) {
            gainNodeRef.current.gain.value = volume;
        } else if (audioRef.current) {
            audioRef.current.volume = Math.min(volume, 1.0);
        }
    }, [project?.narrationVolume]);

    // Pending seek logic
    const pendingSeekRef = useRef<number | null>(null);

    // Intercept seek when changing scenes
    const onSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const seekTime = parseFloat(e.target.value);
        setCurrentTime(seekTime); // Immediate UI update

        let accumulatedTime = 0;
        let targetScene = scenes[0];
        let sceneStartTime = 0;

        for (const s of scenes) {
            if (seekTime >= accumulatedTime && seekTime < accumulatedTime + s.duration) {
                targetScene = s;
                sceneStartTime = accumulatedTime;
                break;
            }
            accumulatedTime += s.duration;
        }

        if (seekTime >= totalDuration) {
            targetScene = scenes[scenes.length - 1];
            sceneStartTime = totalDuration - targetScene.duration;
        }

        const timeInScene = seekTime - sceneStartTime;

        if (targetScene.id !== scene.id) {
            pendingSeekRef.current = timeInScene;
            onSelectScene(targetScene.id);
        } else {
            // Apply immediately
            if (audioRef.current) {
                if (timeInScene < audioRef.current.duration) {
                    audioRef.current.currentTime = timeInScene;
                    silenceStartRef.current = null;
                } else {
                    audioRef.current.currentTime = audioRef.current.duration;
                    const silenceDuration = timeInScene - audioRef.current.duration;
                    silenceStartRef.current = performance.now() - (silenceDuration * 1000);
                }
            }
        }
    };

    // Apply pending seek when audio is ready
    useEffect(() => {
        if (pendingSeekRef.current !== null && audioRef.current) {
            const time = pendingSeekRef.current;
            pendingSeekRef.current = null;

            // Wait for metadata to ensure duration is available
            const applySeek = () => {
                if (!audioRef.current) return;
                if (time < audioRef.current.duration) {
                    audioRef.current.currentTime = time;
                    silenceStartRef.current = null;
                } else {
                    audioRef.current.currentTime = audioRef.current.duration;
                    const silenceDuration = time - audioRef.current.duration;
                    silenceStartRef.current = performance.now() - (silenceDuration * 1000);
                }
            };

            if (audioRef.current.readyState >= 1) {
                applySeek();
            } else {
                audioRef.current.onloadedmetadata = applySeek;
            }
        }
    }, [scene.audioUrl]); // Run when audio source changes

    // Animation loop
    const animate = useCallback(() => {
        if (!isPlaying) return;

        if (audioRef.current) {
            let localTime = 0;

            if (!audioRef.current.ended) {
                localTime = audioRef.current.currentTime;
                silenceStartRef.current = null;
            } else {
                // Silence phase
                if (silenceStartRef.current === null) {
                    silenceStartRef.current = performance.now();
                }
                const silenceDuration = (performance.now() - silenceStartRef.current) / 1000;
                localTime = (audioRef.current.duration || 0) + silenceDuration;
            }

            // Update UI
            setCurrentTime(currentSceneStartTime + localTime);

            // Check completion
            if (localTime >= scene.duration) {
                triggerNextScene();
                return; // Stop loop
            }
        }
        requestRef.current = requestAnimationFrame(animate);
    }, [isPlaying, currentSceneStartTime, scene.duration, triggerNextScene]);

    useEffect(() => {
        if (isPlaying) {
            requestRef.current = requestAnimationFrame(animate);
        }
        return () => {
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
            }
        };
    }, [isPlaying, animate]);

    const togglePlayback = async () => {
        if (!audioRef.current) return;

        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            try {
                if (audioCtxRef.current?.state === 'suspended') {
                    await audioCtxRef.current.resume();
                }
                await audioRef.current.play();
                setIsPlaying(true);
                autoPlayRef.current = false;
            } catch (error: any) {
                if (error.name === 'AbortError') return;
                console.error("Playback failed:", error);

                // Detect source errors without blocking alerts
                const isSourceError = audioRef.current.error || error.name === 'NotSupportedError';
                if (isSourceError && scene?.audioUrl?.startsWith('blob:')) {
                    setHasAudioError(true);
                }

                setIsPlaying(false);
            }
        }
    };

    const handleUpgradeNow = () => {
        setIsUpgradeModalOpen(false);
        setIsPurchaseModalOpen(true);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getMotionStyle = (type: string) => {
        switch (type) {
            case 'zoom_in': return 'scale(1.2)';
            case 'pan_left': return 'scale(1.2) translate(-10%, 0)';
            case 'pan_right': return 'scale(1.2) translate(10%, 0)';
            case 'pan_up': return 'scale(1.2) translate(0, -10%)';
            case 'pan_down': return 'scale(1.2) translate(0, 10%)';
            default: return 'scale(1)';
        }
    };

    // Background Music Ref
    const bgMusicRef = useRef<HTMLAudioElement | null>(null);

    // Background Music Effect
    useEffect(() => {
        if (!project?.backgroundMusic) {
            if (bgMusicRef.current) {
                bgMusicRef.current.pause();
                bgMusicRef.current = null;
                bgSourceRef.current = null;
            }
            return;
        }

        const musicUrl = project.backgroundMusic.url;
        const currentSrc = bgMusicRef.current?.getAttribute('src');

        if (!bgMusicRef.current || currentSrc !== musicUrl) {
            if (bgMusicRef.current) {
                bgMusicRef.current.pause();
                try {
                    bgSourceRef.current?.disconnect();
                } catch {
                    // Ignore disconnect errors if not connected
                }
                bgSourceRef.current = null;
            }
            const audio = new Audio(musicUrl);
            audio.crossOrigin = "anonymous";
            audio.loop = true;
            bgMusicRef.current = audio;
        }

        // Apply volume via GainNode for mobile consistency
        const volume = project.backgroundMusic.volume;
        if (audioCtxRef.current && bgGainNodeRef.current) {
            if (!bgSourceRef.current && bgMusicRef.current) {
                try {
                    bgSourceRef.current = audioCtxRef.current.createMediaElementSource(bgMusicRef.current);
                    bgSourceRef.current.connect(bgGainNodeRef.current);
                } catch {
                    // Already connected or failed
                }
            }
            // Use setTargetAtTime for smoother transitions
            bgGainNodeRef.current.gain.setTargetAtTime(volume, audioCtxRef.current.currentTime, 0.05);

            // Ensure context is resumed if we're trying to play or change volume
            if (isPlaying && audioCtxRef.current.state === 'suspended') {
                audioCtxRef.current.resume();
            }
        } else if (bgMusicRef.current) {
            bgMusicRef.current.volume = Math.min(volume, 1.0);
        }

        if (isPlaying && bgMusicRef.current) {
            bgMusicRef.current.play().catch(console.error);
        } else if (bgMusicRef.current) {
            bgMusicRef.current.pause();
        }
    }, [project?.backgroundMusic?.url, project?.backgroundMusic?.volume, isPlaying, project?.backgroundMusic]);

    // Separate cleanup for unmount
    useEffect(() => {
        return () => {
            if (bgMusicRef.current) {
                bgMusicRef.current.pause();
                bgMusicRef.current = null;
            }
        };
    }, []);

    // Caption Style Helper
    const getCaptionStyle = (styleId: string) => {
        const baseStyle = "absolute bottom-12 left-0 right-0 px-6 text-center z-20 transition-all duration-300";
        const textBase = "text-xl leading-tight inline-block max-w-[90%]";

        switch (styleId) {
            case 'beast':
                return { container: baseStyle, text: `${textBase} text-yellow-400 font-black uppercase italic drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]` };
            case 'tiktok':
                return { container: baseStyle, text: `${textBase} text-white font-bold bg-black/50 px-2 py-1 rounded` };
            case 'comic':
                return { container: baseStyle, text: `${textBase} text-yellow-300 font-comic font-bold border-2 border-black text-stroke-black bg-white/10 backdrop-blur-sm p-2 rounded-xl` };
            case 'neon':
                return { container: baseStyle, text: `${textBase} text-green-400 font-mono font-bold drop-shadow-[0_0_10px_rgba(74,222,128,0.8)] bg-black/80 p-2 border border-green-500/50 rounded` };
            case 'elegant':
                return { container: baseStyle, text: `${textBase} text-white font-serif italic tracking-wider drop-shadow-lg` };
            default:
                return { container: baseStyle, text: `${textBase} text-yellow-400 font-bold drop-shadow-lg bg-black/50 p-2 rounded box-decoration-clone` };
        }
    };

    const captionStyle = getCaptionStyle(project?.captionSettings.style || 'default');

    if (!scene) return null;

    return (
        <div className={cn(
            "border-zinc-800 bg-zinc-900/50 flex flex-col items-center h-full",
            isMobile ? "w-full p-4" : "w-96 border-l p-6 justify-center"
        )}>


            <div className="flex-1 w-full flex flex-col items-center justify-center overflow-hidden relative">
                <button
                    onClick={() => onBackToScenes ? onBackToScenes() : onSelectScene(scene.id)}
                    className="flex items-center gap-2 text-zinc-400 hover:text-white mb-4 self-start transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span className="text-sm font-bold uppercase tracking-wider">Go Back</span>
                </button>

                {isMobile && activeSubTab !== 'preview' && (
                    <div className="absolute inset-0 z-50 bg-zinc-950/95 backdrop-blur-sm overflow-y-auto p-4">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-white uppercase tracking-widest">
                                {activeSubTab === 'captions' ? 'Caption Settings' : 'Audio Settings'}
                            </h3>
                            <button
                                onClick={() => setActiveSubTab('preview')}
                                className="p-2 text-zinc-400 hover:text-white"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        {activeSubTab === 'captions' ? <CaptionsTab /> : <AudioTab />}
                    </div>
                )}

                <div className={cn(
                    "relative aspect-[9/16] bg-zinc-950 rounded-2xl border border-zinc-800 overflow-hidden shadow-2xl ring-1 ring-zinc-800",
                    isMobile ? "h-[60vh]" : "w-full"
                )}>
                    {/* Blurred Background Layer (Only for News/Fixed Image Reels) */}
                    {scene.imageUrl && project?.fixedImageUrl && (
                        <div className="absolute inset-0 z-0">
                            <img
                                src={scene.imageUrl}
                                className="w-full h-full object-cover blur-2xl scale-110 opacity-60"
                                alt=""
                            />
                        </div>
                    )}

                    {/* Image Layer */}
                    {scene.imageUrl ? (
                        <img
                            src={scene.imageUrl}
                            className={cn(
                                "absolute inset-0 w-full h-full z-10",
                                project?.fixedImageUrl ? "object-contain" : "object-cover"
                            )}
                            style={{
                                transform: isPlaying && !project?.fixedImageUrl ? getMotionStyle(scene.motionType) : 'scale(1)',
                                transition: isPlaying && !project?.fixedImageUrl ? `transform ${scene.duration}s ease-out` : 'none'
                            }}
                            alt="Scene Preview"
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-zinc-700 bg-zinc-900 z-10">
                            <p className="text-sm">No Image Generated</p>
                        </div>
                    )}

                    {/* Stale Audio Warning Banner */}
                    {hasAudioError && (
                        <div className="absolute top-0 left-0 right-0 z-40 bg-red-600/90 backdrop-blur-md p-3 flex flex-col items-center gap-2 animate-in slide-in-from-top duration-300">
                            <div className="flex items-center gap-2 text-white">
                                <Music className="w-4 h-4" />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Audio Session Expired</span>
                            </div>
                            <button
                                onClick={() => {
                                    regenerateAllAudio();
                                    setHasAudioError(false);
                                }}
                                className="w-full bg-white text-red-600 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-zinc-100 transition-colors shadow-lg"
                            >
                                Re-generate All Audio
                            </button>
                        </div>
                    )}

                    {/* Breaking News / Horoscope Banner (Only for News or Horoscope Reels, only on Thumbnail) */}
                    {scene.isThumbnail && (project?.isNews || project?.isHoroscope) && (
                        <div className="absolute top-1/15 left-0 right-0 z-10 flex flex-col items-center pointer-events-none">
                            <div className={`${project.isHoroscope ? 'bg-indigo-600/90' : 'bg-red-600/90'} px-1 py-1 transform -skew-x-12 shadow-xl border-2 border-white/20`}>
                                <span className="text-white text-xl font-black italic tracking-tighter uppercase leading-none drop-shadow-md">
                                    {project.isHoroscope
                                        ? (project.language === 'english' ? "TODAY'S" : "आज का")
                                        : 'BREAKING'}
                                </span>
                            </div>
                            <div className={`${project.isHoroscope ? 'bg-zinc-800' : 'bg-zinc-800'} px-1 py-1 -mt-1 transform -skew-x-12 shadow-xl border-b-4 ${project.isHoroscope ? 'border-amber-500' : 'border-indigo-500'}`}>
                                <span className="text-white text-xl font-black italic tracking-widest uppercase leading-none">
                                    {project.isHoroscope
                                        ? (project.language === 'english' ? 'HOROSCOPE' : 'राशिफल')
                                        : 'NEWS'}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Thumbnail Title Overlay */}
                    {scene.isThumbnail && (
                        <div className="absolute inset-x-0 bottom-1/10 flex items-center justify-center z-30 p-1 pointer-events-none">
                            <div className="bg-black/60 p-2 rounded-2xl border border-white/20 shadow-2xl backdrop-blur-md max-w-[100%]">
                                <h2 className="text-xl font-black text-yellow-400 text-center leading-tight uppercase tracking-tight drop-shadow-lg">
                                    {scene.text}
                                </h2>
                            </div>
                        </div>
                    )}

                    {/* Captions Layer */}
                    {scene.captionsEnabled && !scene.isThumbnail && (
                        <div className={captionStyle.container}>
                            <p className={captionStyle.text}>
                                {activeCaption}
                            </p>
                        </div>
                    )}
                </div>

                {isMobile && (
                    <div className="w-full flex gap-2 mt-8 shrink-0">
                        <button
                            onClick={() => setActiveSubTab(activeSubTab === 'captions' ? 'preview' : 'captions')}
                            className={cn(
                                "flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all flex items-center justify-center gap-2",
                                activeSubTab === 'captions'
                                    ? "bg-indigo-600 border-indigo-500 text-white"
                                    : "bg-zinc-900 border-zinc-800 text-zinc-400"
                            )}
                        >
                            <Type className="w-4 h-4" />
                            Captions
                        </button>
                        <button
                            onClick={() => setActiveSubTab(activeSubTab === 'audio' ? 'preview' : 'audio')}
                            className={cn(
                                "flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all flex items-center justify-center gap-2",
                                activeSubTab === 'audio'
                                    ? "bg-indigo-600 border-indigo-500 text-white"
                                    : "bg-zinc-900 border-zinc-800 text-zinc-400"
                            )}
                        >
                            <Music className="w-4 h-4" />
                            Background Music
                        </button>
                    </div>
                )}

                {isMobile && onBackToScenes && (
                    <button
                        onClick={onBackToScenes}
                        className="w-full mt-1.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-[10px] font-bold text-zinc-400 hover:text-white hover:border-zinc-700 transition-all flex items-center justify-center gap-2 uppercase tracking-widest shadow-lg"
                    >
                        <Layers className="w-4 h-4" />
                        Edit Video
                    </button>
                )}

                {/* Controls & Timeline */}
                <div className="w-full mt-2 space-y-4">
                    {/* Timeline */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-[10px] lg:text-xs text-zinc-400 font-medium">
                            <span>{formatTime(currentTime)}</span>
                            <span>{formatTime(totalDuration)}</span>
                        </div>
                        <div className="relative h-1.5 w-full flex items-center">
                            <input
                                type="range"
                                min={0}
                                max={totalDuration || 100}
                                step={0.1}
                                value={currentTime}
                                onChange={onSeekChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                            />
                            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-indigo-500 rounded-full"
                                    style={{ width: `${Math.min((currentTime / (totalDuration || 1)) * 100, 100)}%` }}
                                />
                            </div>
                            {/* Thumb indicator (optional visual) */}
                            <div
                                className="absolute h-3 w-3 bg-white rounded-full shadow-md pointer-events-none z-10"
                                style={{ left: `${Math.min((currentTime / (totalDuration || 1)) * 100, 100)}%`, transform: 'translateX(-50%)' }}
                            />
                        </div>
                    </div>

                    <div className="flex justify-center items-center gap-4">
                        <button
                            onClick={togglePlayback}
                            disabled={!scene.audioUrl}
                            className="p-4 rounded-full bg-zinc-100 text-zinc-900 hover:bg-white transition-colors shadow-lg shadow-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isPlaying ? (
                                <Pause className="w-6 h-6 fill-current" />
                            ) : (
                                <Play className="w-6 h-6 fill-current ml-1" />
                            )}
                        </button>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleExport}
                                disabled={scenes.some(s => s.status !== 'ready')}
                                className="p-4 rounded-full bg-zinc-800 text-white hover:bg-zinc-700 transition-colors shadow-lg shadow-black/20 disabled:opacity-50 disabled:cursor-not-allowed group relative"
                                title="Download Video"
                            >
                                <Download className="w-6 h-6" />

                                {/* Tooltip for pending scenes */}
                                {scenes.some(s => s.status !== 'ready') && (
                                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 p-2 bg-zinc-800 text-[10px] rounded shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                                        Wait for all scenes to generate before downloading
                                    </div>
                                )}
                            </button>

                            <button
                                onClick={handleShare}
                                disabled={scenes.some(s => s.status !== 'ready')}
                                className="p-4 rounded-full bg-indigo-600 text-white hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed group relative"
                                title="Share to Instagram"
                            >
                                <Share2 className="w-6 h-6" />

                                {/* Tooltip for pending scenes */}
                                {scenes.some(s => s.status !== 'ready') && (
                                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 p-2 bg-zinc-800 text-[10px] rounded shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                                        Wait for all scenes to generate before sharing
                                    </div>
                                )}
                            </button>
                        </div>
                    </div>

                </div>
            </div>

            <UpgradeModal
                isOpen={isUpgradeModalOpen}
                onClose={() => setIsUpgradeModalOpen(false)}
                onUpgrade={handleUpgradeNow}
            />

            <PurchaseCreditModal
                isOpen={isPurchaseModalOpen}
                onClose={() => setIsPurchaseModalOpen(false)}
            />

            <SignInModal
                isOpen={isSignInModalOpen}
                onClose={() => setIsSignInModalOpen(false)}
                redirectTo="/scenes"
            />

            {/* Export Progress Modal */}
            {exportState !== 'idle' && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => exportState !== 'exporting' && setExportState('idle')} />
                    <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl text-center space-y-6 overflow-hidden">
                        {/* Background subtle glow */}
                        <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/10 blur-[100px] rounded-full" />
                        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/10 blur-[100px] rounded-full" />

                        <div className="relative space-y-4">
                            {exportState === 'exporting' && (
                                <>
                                    <div className="w-16 h-16 border-4 border-zinc-800 border-t-indigo-500 rounded-full animate-spin mx-auto mb-6" />
                                    <h3 className="text-xl font-bold text-white">Your reel is getting downloaded</h3>
                                    <p className="text-zinc-400 text-sm">We are stitching together your scenes, audio, and captions. This may take a minute.</p>
                                </>
                            )}

                            {exportState === 'success' && (
                                <>
                                    <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 scale-in">
                                        <Check className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white">Download Successful!</h3>
                                    <p className="text-zinc-400 text-sm">Your high-quality reel has been prepared and downloaded to your device.</p>
                                    <button
                                        onClick={() => setExportState('idle')}
                                        className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-all uppercase tracking-widest text-xs mt-4"
                                    >
                                        Close
                                    </button>
                                </>
                            )}

                            {exportState === 'error' && (
                                <>
                                    <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <X className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white">Download Failed</h3>
                                    <p className="text-red-400 text-sm">{exportError || 'An unexpected error occurred.'}</p>
                                    <button
                                        onClick={() => setExportState('idle')}
                                        className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-all uppercase tracking-widest text-xs mt-4"
                                    >
                                        Try Again
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
