export interface Scene {
    id: number | string;
    text: string;
    duration: number;
    audioUrl?: string;
    wordTimings?: WordTiming[];
    imageUrl?: string;
    imagePrompt?: string;
    imageSettings: ImageSettings;
    motionType: MotionType;
    captionsEnabled: boolean;
    status: 'pending' | 'generating_audio' | 'generating_image' | 'ready' | 'error';
}

export interface WordTiming {
    word: string;
    start: number;
    end: number;
}

export interface ImageSettings {
    width: number;
    height: number;
    steps: number;
    guidance: number;
    seed?: string;
}

export type MotionType = 'zoom_in' | 'pan_up' | 'pan_down' | 'pan_left' | 'pan_right' | 'none';

export interface StoryRequest {
    prompt: string;
    language: string;
}

export interface StoryResponse {
    language: string;
    theme: string;
    scenes: {
        text: string;
        imagePrompt: string;
        motionType?: MotionType;
        duration?: number;
    }[];
}

export interface CaptionSettings {
    style: 'default' | 'beast' | 'umi' | 'tiktok' | 'ariel' | 'devin' | 'tracy' | 'marissa' | 'mark' | 'story' | 'classic' | 'active' | 'bubble' | 'glass' | 'comic' | 'glow' | 'pastel' | 'neon' | 'vapor' | 'retrotv' | 'red' | 'elegant' | 'marker' | 'slow' | 'coral' | 'modern' | 'blue' | 'vivid' | 'clay';
    fontFamily?: string;
    fontSize?: number;
    color?: string;
    backgroundColor?: string;
}

export interface BackgroundMusic {
    name: string;
    url: string;
    volume: number; // 0 to 1
}

export interface VideoProject {
    id: string;
    title: string;
    theme?: string;
    prompt?: string;
    scenes: Scene[];
    captionSettings: CaptionSettings;
    backgroundMusic?: BackgroundMusic;
    narrationVolume: number; // 0 to 1
    language: string;
    createdAt: Date;
}
