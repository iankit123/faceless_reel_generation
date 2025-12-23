import { useState, useRef, useEffect, useCallback } from 'react';

interface UseSpeechRecognitionProps {
    onTranscript: (transcript: string) => void;
    language?: string;
}

declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

export function useSpeechRecognition({ onTranscript, language = 'english' }: UseSpeechRecognitionProps) {
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);
    const callbackRef = useRef(onTranscript);
    const silenceTimerRef = useRef<any>(null);

    // Update the ref whenever onTranscript changes
    useEffect(() => {
        callbackRef.current = onTranscript;
    }, [onTranscript]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch (e) {
                console.error("Error stopping recognition:", e);
            }
        }
        if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
        }
        setIsListening(false);
    }, []);

    const resetSilenceTimer = useCallback(() => {
        if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
        }
        silenceTimerRef.current = setTimeout(() => {
            console.log("Silence detected, stopping...");
            stopListening();
        }, 2500); // 2.5 seconds of silence
    }, [stopListening]);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;

            // Set language based on prop
            if (language === 'hindi' || language === 'hinglish') {
                recognition.lang = 'hi-IN';
            } else {
                recognition.lang = 'en-US';
            }

            recognition.onstart = () => {
                resetSilenceTimer();
            };

            recognition.onresult = (event: any) => {
                resetSilenceTimer();
                let transcript = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    transcript += event.results[i][0].transcript;
                }
                if (event.results[event.results.length - 1].isFinal) {
                    callbackRef.current(transcript);
                }
            };

            recognition.onerror = (event: any) => {
                const error = event.error;
                console.error("Speech recognition error:", error);
                if (error !== 'aborted') {
                    setIsListening(false);
                }
                if (silenceTimerRef.current) {
                    clearTimeout(silenceTimerRef.current);
                }
            };

            recognition.onend = () => {
                setIsListening(false);
                if (silenceTimerRef.current) {
                    clearTimeout(silenceTimerRef.current);
                    silenceTimerRef.current = null;
                }
            };

            recognitionRef.current = recognition;
        }

        return () => {
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.stop();
                } catch (e) {
                    // Silently fail if already stopped
                }
            }
            if (silenceTimerRef.current) {
                clearTimeout(silenceTimerRef.current);
            }
        };
    }, [language, resetSilenceTimer]);

    const toggleListening = useCallback((e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
        } else {
            if (!recognitionRef.current) {
                alert("Your browser does not support the Web Speech API.");
                return;
            }
            recognitionRef.current.start();
            setIsListening(true);
        }
    }, [isListening]);

    return {
        isListening,
        toggleListening,
        isSupported: !!(window.SpeechRecognition || window.webkitSpeechRecognition)
    };
}
