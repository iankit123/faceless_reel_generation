import { useVideoStore } from '../../store/useVideoStore';
import { cn } from '../../lib/utils';
import type { CaptionSettings } from '../../types';

const CAPTION_STYLES: { id: CaptionSettings['style']; label: string; previewClass: string }[] = [
    { id: 'default', label: 'Default', previewClass: 'text-white font-bold drop-shadow-md' },
    { id: 'beast', label: 'BEAST', previewClass: 'text-yellow-400 font-black uppercase italic drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]' },
    { id: 'tiktok', label: 'Tiktok', previewClass: 'text-white font-bold bg-black/50 px-2 rounded' },
    { id: 'comic', label: 'Comic', previewClass: 'text-yellow-300 font-comic font-bold border-2 border-black text-stroke-black' },
    { id: 'neon', label: 'Neon', previewClass: 'text-green-400 font-mono font-bold drop-shadow-[0_0_10px_rgba(74,222,128,0.8)]' },
    { id: 'elegant', label: 'Elegant', previewClass: 'text-white font-serif italic tracking-wider' },
];

export function CaptionsTab() {
    const project = useVideoStore((state) => state.project);
    const updateCaptionSettings = useVideoStore((state) => state.updateCaptionSettings);

    if (!project) return null;

    return (
        <div className="p-4 space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-zinc-100 mb-4">Caption Style</h3>
                <div className="grid grid-cols-2 gap-3">
                    {CAPTION_STYLES.map((style) => (
                        <button
                            key={style.id}
                            onClick={() => updateCaptionSettings({ style: style.id })}
                            className={cn(
                                "h-16 rounded-lg border flex items-center justify-center transition-all",
                                project.captionSettings.style === style.id
                                    ? "bg-zinc-800 border-indigo-500 ring-1 ring-indigo-500/50"
                                    : "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
                            )}
                        >
                            <span className={cn("text-lg", style.previewClass)}>
                                {style.label}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
