import { cn } from "../../lib/utils";
import { Video, Sparkles } from "lucide-react";

interface VideoTypeSelectorProps {
    selectedType: string;
    onSelect: (type: string) => void;
}

export function VideoTypeSelector({ selectedType, onSelect }: VideoTypeSelectorProps) {
    return (
        <div className="flex gap-4 mb-8">
            <button
                onClick={() => onSelect('faceless')}
                className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full border transition-all",
                    selectedType === 'faceless'
                        ? "bg-zinc-100 text-zinc-900 border-zinc-100"
                        : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700"
                )}
            >
                <Video className="w-4 h-4" />
                <span className="font-medium">Faceless Video</span>
            </button>
            <button
                onClick={() => onSelect('story')}
                className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full border transition-all",
                    selectedType === 'story'
                        ? "bg-zinc-100 text-zinc-900 border-zinc-100"
                        : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700"
                )}
            >
                <Sparkles className="w-4 h-4" />
                <span className="font-medium">AI Story</span>
            </button>
        </div>
    );
}
