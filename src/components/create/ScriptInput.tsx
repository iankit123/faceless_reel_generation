interface ScriptInputProps {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
}

export function ScriptInput({ value, onChange, disabled }: ScriptInputProps) {
    return (
        <div className="space-y-4">
            <label className="block text-sm font-medium text-zinc-400">
                Video Idea (Hindi)
            </label>
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                placeholder="भूतिया महल की कहानी..."
                className="w-full h-40 bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-lg text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none transition-all"
            />
            <p className="text-xs text-zinc-500">
                Describe your video idea in Hindi. The AI will generate a script, scenes, and narration.
            </p>
        </div>
    );
}
