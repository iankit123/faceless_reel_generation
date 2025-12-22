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

    // Update the ref whenever onTranscript changes
    useEffect(() => {
        callbackRef.current = onTranscript;
    }, [onTranscript]);

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

            recognition.onresult = (event: any) => {
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
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognitionRef.current = recognition;
        }

        return () => {
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.stop();
                } catch (e) {
                    console.error("Error stopping recognition:", e);
                }
            }
        };
    }, [language]); // Removed onTranscript from dependencies

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
