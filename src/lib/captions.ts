export interface CaptionSegment {
    text: string;
    start: number;
    end: number;
}

/**
 * Splits a text into smaller timed segments proportional to their character length.
 * @param text The full text to split.
 * @param totalDuration The total duration of the scene in seconds.
 * @returns An array of timed caption segments.
 */
export function getTimedCaptions(text: string, totalDuration: number): CaptionSegment[] {
    if (!text || totalDuration <= 0) return [];

    // Split by punctuation: . ! ? , ;
    // We use a regex that matches the space after punctuation to keep the punctuation with the preceding segment.
    // If lookbehind is not supported in all environments, we can use a different approach, 
    // but for modern browsers/Node it should be fine.
    const rawSegments = text.split(/(?<=[.!?,;])\s+/);

    const segments: string[] = [];

    // Further split long segments by word count or max length to ensure they fit on screen
    const MAX_LENGTH = 45;
    rawSegments.forEach(seg => {
        if (seg.length <= MAX_LENGTH) {
            segments.push(seg);
        } else {
            // Split by words
            const words = seg.split(/\s+/);
            let current = '';
            words.forEach(word => {
                if ((current + (current ? ' ' : '') + word).length <= MAX_LENGTH) {
                    current += (current ? ' ' : '') + word;
                } else {
                    if (current) segments.push(current);
                    current = word;
                }
            });
            if (current) segments.push(current);
        }
    });

    const totalChars = segments.reduce((acc, s) => acc + s.length, 0);
    let currentTime = 0;

    return segments.map(s => {
        // Calculate duration proportional to character count
        const duration = (s.length / totalChars) * totalDuration;
        const segment = {
            text: s.trim(),
            start: currentTime,
            end: currentTime + duration
        };
        currentTime += duration;
        return segment;
    });
}
