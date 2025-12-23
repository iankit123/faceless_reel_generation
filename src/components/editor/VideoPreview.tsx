import type { Scene } from '../../types';
import { Play, Pause, Download, Loader2, Type, Music, ArrowLeft, Layers } from 'lucide-react';
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useVideoStore } from '../../store/useVideoStore';
import { CaptionsTab } from './CaptionsTab';
import { AudioTab } from './AudioTab';
import { cn } from '../../lib/utils';
import { X } from 'lucide-react';
import { getTimedCaptions } from '../../lib/captions';

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
    const scene = scenes.find(s => s.id === currentSceneId) || scenes[0];
    const [isPlaying, setIsPlaying] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [activeSubTab, setActiveSubTab] = useState<'preview' | 'captions' | 'audio'>('preview');
    const [exportTimer, setExportTimer] = useState(150);

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

    // Audio setup effect - removed 'scenes' dependency to prevent resets
    useEffect(() => {
        // Reset audio when scene changes
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
            if (!autoPlayRef.current) {
                setIsPlaying(false);
            }
        }

        // Initialize AudioContext and GainNode for boosting
        if (!audioCtxRef.current) {
            try {
                audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
                gainNodeRef.current = audioCtxRef.current.createGain();
                gainNodeRef.current.connect(audioCtxRef.current.destination);
            } catch (err) {
                console.error("Failed to initialize AudioContext:", err);
            }
        }

        // Reset time to start of scene
        setCurrentTime(currentSceneStartTime);

        if (scene?.audioUrl) {
            const audio = new Audio(scene.audioUrl);
            audio.crossOrigin = "anonymous";
            audioRef.current = audio;

            // Apply boosted volume via GainNode
            const volume = project?.narrationVolume ?? 1.0;
            if (audioCtxRef.current && gainNodeRef.current) {
                try {
                    const source = audioCtxRef.current.createMediaElementSource(audio);
                    source.connect(gainNodeRef.current);
                    gainNodeRef.current.gain.value = volume;
                } catch (e) {
                    // Source might already be connected if re-using, fallback to standard volume
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

            // Auto-play if flag is set
            if (autoPlayRef.current) {
                if (audioCtxRef.current?.state === 'suspended') {
                    audioCtxRef.current.resume();
                }
                const playPromise = audio.play();
                if (playPromise !== undefined) {
                    playPromise
                        .then(() => setIsPlaying(true))
                        .catch(error => {
                            console.error("Auto-play failed:", error);
                            setIsPlaying(false);
                        });
                }
                autoPlayRef.current = false;
            }
        }

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, [scene?.audioUrl, scene?.id, currentSceneStartTime, scene?.duration]);

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

    const togglePlayback = () => {
        if (!audioRef.current) return;

        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
            autoPlayRef.current = false;
        }
        setIsPlaying(!isPlaying);
    };

    const handleExport = async () => {
        if (isExporting) return;
        setIsExporting(true);
        setIsPlaying(false);

        try {
            const canvas = document.createElement('canvas');
            canvas.width = 720; // 720x1280 is a good balance for mobile
            canvas.height = 1280;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('Could not get canvas context');

            const stream = canvas.captureStream(30);
            const audioCtx = new AudioContext();
            const dest = audioCtx.createMediaStreamDestination();

            // Mix background music if exists
            let bgSource: MediaElementAudioSourceNode | null = null;
            if (bgMusicRef.current) {
                bgMusicRef.current.currentTime = 0;
                bgSource = audioCtx.createMediaElementSource(bgMusicRef.current);
                const bgGain = audioCtx.createGain();
                bgGain.gain.value = project?.backgroundMusic?.volume || 0.3;
                bgSource.connect(bgGain);
                bgGain.connect(dest);
            }

            const mimeTypes = [
                'video/mp4;codecs=h264,aac',
                'video/mp4;codecs=h264,opus',
                'video/mp4',
                'video/webm;codecs=vp9,opus',
                'video/webm'
            ];

            const supportedMineType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type)) || 'video/webm';
            console.log('Using mime type for export:', supportedMineType);

            const recorder = new MediaRecorder(new MediaStream([
                ...stream.getVideoTracks(),
                ...dest.stream.getAudioTracks()
            ]), { mimeType: supportedMineType });

            const chunks: Blob[] = [];
            recorder.ondataavailable = (e) => chunks.push(e.data);
            recorder.onstop = () => {
                const extension = supportedMineType.includes('mp4') ? 'mp4' : 'webm';
                const blob = new Blob(chunks, { type: supportedMineType });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                const fileName = project?.title && !project.title.includes('-') ? project.title : 'my-reel';
                a.download = `${fileName}.${extension}`;
                a.click();
                URL.revokeObjectURL(url);
            };

            // Start timer
            setExportTimer(150);
            const timerInterval = setInterval(() => {
                setExportTimer((prev) => Math.max(0, prev - 1));
            }, 1000);

            recorder.start();
            if (bgMusicRef.current) {
                bgMusicRef.current.currentTime = 0;
                await bgMusicRef.current.play();
            }

            // Ensure AudioContext is running
            if (audioCtx.state === 'suspended') {
                await audioCtx.resume();
            }

            // Render scenes
            for (let i = 0; i < scenes.length; i++) {
                const s = scenes[i];
                onSelectScene(s.id);

                // Load image
                const img = new Image();
                img.crossOrigin = "anonymous";
                if (s.imageUrl) {
                    img.src = s.imageUrl;
                    await new Promise((resolve) => { img.onload = resolve; img.onerror = resolve; });
                }

                // Prepare and wait for scene audio
                const sceneAudio = new Audio(s.audioUrl);
                sceneAudio.crossOrigin = "anonymous";
                sceneAudio.preload = "auto";

                await new Promise((resolve) => {
                    sceneAudio.oncanplaythrough = resolve;
                    sceneAudio.onerror = resolve; // Continue on error to avoid hang
                    sceneAudio.load();
                });

                const sceneSource = audioCtx.createMediaElementSource(sceneAudio);
                const sceneGain = audioCtx.createGain();
                sceneGain.gain.value = project?.narrationVolume ?? 1.0;
                sceneSource.connect(sceneGain);
                sceneGain.connect(dest);

                await sceneAudio.play();
                const startTime = performance.now();

                // Animation loop for this scene
                await new Promise<void>((resolve) => {
                    const renderFrame = () => {
                        const elapsed = (performance.now() - startTime) / 1000;
                        if (elapsed >= s.duration) {
                            resolve();
                            return;
                        }

                        // Draw image with motion
                        ctx.fillStyle = '#000';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);

                        if (img.complete && img.naturalWidth > 0) {
                            const scale = 1.2; // Base scale for motion
                            let tx = 0, ty = 0, s_val = 1;

                            const progress = elapsed / s.duration;
                            if (s.motionType === 'zoom_in') s_val = 1 + (0.2 * progress);
                            else if (s.motionType === 'pan_left') tx = -10 * progress;
                            else if (s.motionType === 'pan_right') tx = 10 * progress;

                            const iw = img.naturalWidth;
                            const ih = img.naturalHeight;
                            const aspect = iw / ih;
                            const targetAspect = canvas.width / canvas.height;

                            let dw, dh;
                            if (aspect > targetAspect) {
                                dh = canvas.height;
                                dw = dh * aspect;
                            } else {
                                dw = canvas.width;
                                dh = dw / aspect;
                            }

                            ctx.save();
                            ctx.translate(canvas.width / 2, canvas.height / 2);
                            ctx.scale(s_val * scale, s_val * scale);
                            ctx.translate(tx, ty);
                            ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
                            ctx.restore();
                        }

                        // Draw Captions
                        if (s.captionsEnabled) {
                            const sceneCaptions = getTimedCaptions(s.text, s.duration);
                            const activeSeg = sceneCaptions.find(seg => elapsed >= seg.start && elapsed < seg.end);
                            const text = activeSeg ? activeSeg.text : '';

                            if (text) {
                                ctx.font = 'bold 32px sans-serif';
                                // Simple text wrapping
                                const words = text.split(' ');
                                let line = '';
                                const lines = [];
                                for (const word of words) {
                                    if (ctx.measureText(line + word).width < canvas.width - 80) {
                                        line += word + ' ';
                                    } else {
                                        lines.push(line);
                                        line = word + ' ';
                                    }
                                }
                                lines.push(line);

                                const lineHeight = 40;
                                const totalHeight = lines.length * lineHeight;

                                ctx.fillStyle = 'rgba(0,0,0,0.6)';
                                ctx.fillRect(20, canvas.height - 150 - totalHeight, canvas.width - 40, totalHeight + 20);

                                ctx.fillStyle = '#facc15'; // Yellow-400
                                ctx.textAlign = 'center';
                                lines.forEach((l, idx) => {
                                    ctx.fillText(l.trim(), canvas.width / 2, canvas.height - 130 - totalHeight + (idx * lineHeight) + 30);
                                });
                            }
                        }

                        requestAnimationFrame(renderFrame);
                    };
                    renderFrame();
                });
                sceneAudio.pause();
                sceneSource.disconnect();
            }

            if (bgMusicRef.current) bgMusicRef.current.pause();
            recorder.stop();
            clearInterval(timerInterval);
            await audioCtx.close();

        } catch (error) {
            console.error('Export failed:', error);
            alert('Export failed. See console for details.');
        } finally {
            setIsExporting(false);
        }
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
            }
            return;
        }

        const musicUrl = project.backgroundMusic.url;
        // Check if source is actually different (handling relative vs absolute URLs)
        const currentSrc = bgMusicRef.current?.getAttribute('src');

        if (!bgMusicRef.current || currentSrc !== musicUrl) {
            if (bgMusicRef.current) bgMusicRef.current.pause();
            bgMusicRef.current = new Audio(musicUrl);
            bgMusicRef.current.loop = true;
        }

        bgMusicRef.current.volume = project.backgroundMusic.volume;

        if (isPlaying) {
            bgMusicRef.current.play().catch(console.error);
        } else {
            bgMusicRef.current.pause();
        }
    }, [project?.backgroundMusic?.url, project?.backgroundMusic?.volume, isPlaying]);

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
                    {/* Image Layer */}
                    {scene.imageUrl ? (
                        <img
                            src={scene.imageUrl}
                            className="absolute inset-0 w-full h-full object-cover"
                            style={{
                                transform: isPlaying ? getMotionStyle(scene.motionType) : 'scale(1)',
                                transition: isPlaying ? `transform ${scene.duration}s ease-out` : 'none'
                            }}
                            alt="Scene Preview"
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-zinc-700 bg-zinc-900">
                            <p className="text-sm">No Image Generated</p>
                        </div>
                    )}

                    {/* Captions Layer */}
                    {scene.captionsEnabled && (
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

                    {/* Play & Download Buttons */}
                    <div className="flex justify-center items-center gap-4">
                        <button
                            onClick={togglePlayback}
                            disabled={!scene.audioUrl || isExporting}
                            className="p-4 rounded-full bg-zinc-100 text-zinc-900 hover:bg-white transition-colors shadow-lg shadow-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isPlaying ? (
                                <Pause className="w-6 h-6 fill-current" />
                            ) : (
                                <Play className="w-6 h-6 fill-current ml-1" />
                            )}
                        </button>

                        <button
                            onClick={handleExport}
                            disabled={isExporting || scenes.some(s => s.status !== 'ready')}
                            className="p-4 rounded-full bg-indigo-600 text-white hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed group relative"
                            title="Download Video"
                        >
                            {isExporting ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                <Download className="w-6 h-6" />
                            )}

                            {/* Tooltip for pending scenes */}
                            {!isExporting && scenes.some(s => s.status !== 'ready') && (
                                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 p-2 bg-zinc-800 text-[10px] rounded shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                                    Wait for all scenes to generate before downloading
                                </div>
                            )}
                        </button>
                    </div>

                    {/* Exporting Overlay */}
                    {isExporting && (
                        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
                            <div className="w-24 h-24 mb-8 relative">
                                <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full" />
                                <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Download className="w-8 h-8 text-indigo-400" />
                                </div>
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Exporting Your Reel</h2>
                            <div className="flex flex-col items-center gap-2 mb-6">
                                <span className={`text-4xl font-mono font-bold ${exportTimer > 0 ? 'text-red-500' : 'text-amber-400'}`}>
                                    {exportTimer}s
                                </span>
                                {exportTimer === 0 && (
                                    <p className="text-amber-400 text-sm font-medium animate-pulse">
                                        It is taking more time than expected, please wait...
                                    </p>
                                )}
                            </div>
                            <p className="text-zinc-400 max-w-md">
                                We're rendering your scenes, captions, and music into a high-quality video.
                                Please keep this tab open.
                            </p>
                            <div className="mt-8 px-4 py-2 bg-zinc-800 rounded-full text-xs font-mono text-zinc-500">
                                Rendering in Portrait (720x1280)
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
