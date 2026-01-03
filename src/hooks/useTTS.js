import { useState, useEffect, useCallback, useRef, useContext } from 'react';
import { AppContext } from '../store/app-context.jsx';

const useTTS = () => {
    const [speaking, setSpeaking] = useState(false);
    const [paused, setPaused] = useState(false);
    const [supported, setSupported] = useState(false);
    const [voices, setVoices] = useState([]);
    const synthRef = useRef(window.speechSynthesis);
    const utteranceRef = useRef(null);

    const { ttsSettings, getLanguage } = useContext(AppContext);

    useEffect(() => {
        if ('speechSynthesis' in window) {
            setSupported(true);

            const loadVoices = () => {
                const availableVoices = window.speechSynthesis.getVoices();
                if (availableVoices.length > 0) {
                    setVoices(availableVoices);
                }
            };

            loadVoices();

            if (window.speechSynthesis.onvoiceschanged !== undefined) {
                window.speechSynthesis.onvoiceschanged = loadVoices;
            }
        }
    }, []);

    const cancel = useCallback(() => {
        if (!supported) return;
        synthRef.current.cancel();
        setSpeaking(false);
        setPaused(false);
    }, [supported]);

    const speak = useCallback((text) => {
        if (!supported) return;

        // Cancel any ongoing speech
        cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utteranceRef.current = utterance;

        // Set language based on settings
        const appLang = getLanguage(); // 'en' or 'tr' usually
        let langToUse = 'en-US'; // Default fallback

        // Determine effective language
        const selectedLang = ttsSettings?.language || 'app';
        let effectiveLang = selectedLang;

        if (selectedLang === 'app') {
            effectiveLang = appLang;
        }

        // Map short codes to full locale codes if needed
        // Assuming 'en' -> 'en-US', 'tr' -> 'tr-TR'
        if (effectiveLang.startsWith('en')) langToUse = 'en-US';
        else if (effectiveLang.startsWith('tr')) langToUse = 'tr-TR';

        utterance.lang = langToUse;

        // Select the best offline voice
        if (voices.length > 0) {
            let selectedVoice = null;
            const targetVoiceURI = ttsSettings?.voiceURI;

            // If a specific voice is selected, try to find it
            if (targetVoiceURI && targetVoiceURI !== 'auto') {
                selectedVoice = voices.find(v => v.voiceURI === targetVoiceURI);
            }

            // If specific voice found, use it
            if (selectedVoice) {
                utterance.voice = selectedVoice;
            } else {
                // Auto mode or fallback: Use smart selection logic

                // Filter by language
                const langVoices = voices.filter(v => v.lang.startsWith(effectiveLang));

                // Filter for offline voices (localService)
                let candidates = langVoices.filter(v => v.localService);

                // If no offline voices for this language, fallback to all voices for this language
                if (candidates.length === 0) {
                    candidates = langVoices;
                }

                // Prioritize Siri voices first
                selectedVoice = candidates.find(v => v.name.toLowerCase().includes('siri'));

                // If no Siri, try Premium/Enhanced
                if (!selectedVoice) {
                    selectedVoice = candidates.find(v => {
                        const name = v.name.toLowerCase();
                        return name.includes('premium') || name.includes('enhanced');
                    });
                }

                if (selectedVoice) {
                    utterance.voice = selectedVoice;
                } else if (candidates.length > 0) {
                    utterance.voice = candidates[0];
                }
            }
        }

        utterance.onstart = () => {
            setSpeaking(true);
            setPaused(false);
        };

        utterance.onend = () => {
            setSpeaking(false);
            setPaused(false);
        };

        utterance.onpause = () => {
            setPaused(true);
        };

        utterance.onresume = () => {
            setPaused(false);
            setSpeaking(true);
        };

        utterance.onerror = (e) => {
            console.error('TTS Error:', e);
            setSpeaking(false);
            setPaused(false);
        }

        synthRef.current.speak(utterance);
    }, [supported, cancel, ttsSettings, getLanguage, voices]);

    const pause = useCallback(() => {
        if (!supported) return;
        synthRef.current.pause();
    }, [supported]);

    const resume = useCallback(() => {
        if (!supported) return;
        synthRef.current.resume();
    }, [supported]);

    // Cleanup on unmount
    useEffect(() => {
        const synth = synthRef.current;
        return () => {
            if (supported) {
                synth.cancel();
            }
        };
    }, [supported]);

    return { speak, pause, resume, cancel, speaking, paused, supported };
};

export default useTTS;
