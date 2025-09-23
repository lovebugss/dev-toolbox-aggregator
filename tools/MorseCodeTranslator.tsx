import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useToolState } from '../contexts/ToolStateContext';
import { useToasts } from '../contexts/ToastContext';
import { ToolHeader } from '../components/ui/ToolHeader';
import { LabeledControl } from '../components/ui/LabeledControl';
import { RefreshIcon } from '../components/icons/Icons';

// Morse code dictionary
const MORSE_CODE_DICT: { [key: string]: string } = {
    'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.', 'G': '--.', 'H': '....',
    'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..', 'M': '--', 'N': '-.', 'O': '---', 'P': '.--.',
    'Q': '--.-', 'R': '.-.', 'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
    'Y': '-.--', 'Z': '--..',
    '1': '.----', '2': '..---', '3': '...--', '4': '....-', '5': '.....',
    '6': '-....', '7': '--...', '8': '---..', '9': '----.', '0': '-----',
    ' ': '/',
    '.': '.-.-.-', ',': '--..--', '?': '..--..', "'": '.----.', '!': '-.-.--', '/': '-..-.',
    '(': '-.--.', ')': '-.--.-', '&': '.-...', ':': '---...', ';': '-.-.-.', '=': '-...-',
    '+': '.-.-.', '-': '-....-', '_': '..--.-', '"': '.-..-.', '$': '...-..-', '@': '.--.-.',
};

const MORSE_REVERSE_DICT = Object.fromEntries(Object.entries(MORSE_CODE_DICT).map(([k, v]) => [v, k]));

type Mode = 'toMorse' | 'fromMorse';

interface MorseState {
    text: string;
    morse: string;
    mode: Mode;
    frequency: number;
    dotDuration: number;
}

const MorseCodeTranslator: React.FC = () => {
    const { t } = useTranslation();
    const { state, setState } = useToolState<MorseState>('morse-code-translator', {
        text: 'Hello World',
        morse: '.... . .-.. .-.. --- / .-- --- .-. .-.. -..',
        mode: 'toMorse',
        frequency: 600,
        dotDuration: 80, // Corresponds to ~15 WPM
    });
    const { text, morse, mode, frequency, dotDuration } = state;
    const addToast = useToasts();
    
    const [isPlaying, setIsPlaying] = useState(false);
    const audioContextRef = useRef<AudioContext | null>(null);
    const stopPlaybackRef = useRef<(() => void) | null>(null);
    
    // Translation logic
    useEffect(() => {
        const translate = () => {
            if (mode === 'toMorse') {
                const newMorse = text.toUpperCase().split('').map(char => MORSE_CODE_DICT[char] || '').join(' ');
                setState(s => ({...s, morse: newMorse}));
            } else {
                const newText = morse.split(' ').map(code => MORSE_REVERSE_DICT[code] || '').join('');
                setState(s => ({...s, text: newText}));
            }
        };
        const timeout = setTimeout(translate, 200);
        return () => clearTimeout(timeout);
    }, [text, morse, mode, setState]);

    // Audio playback logic
    const playMorse = useCallback(async () => {
        if (isPlaying) return;
        
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const audioCtx = audioContextRef.current;
        await audioCtx.resume();
        setIsPlaying(true);
        
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.frequency.value = frequency;
        gainNode.gain.value = 0;
        oscillator.start();

        const dashDuration = dotDuration * 3;
        const letterGap = dotDuration * 3;
        const wordGap = dotDuration * 7;
        let currentTime = audioCtx.currentTime;
        let cancelled = false;

        stopPlaybackRef.current = () => {
            cancelled = true;
            if (audioCtx.state === 'running') {
                gainNode.gain.cancelScheduledValues(audioCtx.currentTime);
                gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
                oscillator.stop();
            }
            setIsPlaying(false);
        };

        for (const char of morse) {
            if (cancelled) break;
            switch(char) {
                case '.':
                    gainNode.gain.setValueAtTime(1, currentTime);
                    currentTime += dotDuration / 1000;
                    gainNode.gain.setValueAtTime(0, currentTime);
                    break;
                case '-':
                    gainNode.gain.setValueAtTime(1, currentTime);
                    currentTime += dashDuration / 1000;
                    gainNode.gain.setValueAtTime(0, currentTime);
                    break;
                case ' ':
                    currentTime += letterGap / 1000;
                    break;
                case '/':
                    currentTime += wordGap / 1000;
                    break;
            }
            currentTime += dotDuration / 1000; // Inter-symbol gap
        }
        
        setTimeout(() => {
            if (!cancelled) {
                stopPlaybackRef.current?.();
            }
        }, (currentTime - audioCtx.currentTime) * 1000 + 100);

    }, [isPlaying, morse, frequency, dotDuration]);
    
    const stopMorse = () => {
        stopPlaybackRef.current?.();
    };

    const handleSwap = () => {
        setState(s => ({ ...s, mode: s.mode === 'toMorse' ? 'fromMorse' : 'toMorse' }));
    };

    const handleCopy = (value: string) => {
        navigator.clipboard.writeText(value).then(() => {
            addToast(t('common.toast.copiedSuccess'), 'success');
        }, () => {
            addToast(t('common.toast.copiedFailed'), 'error');
        });
    };

    return (
        <div>
            <ToolHeader
                title={t('tools.morseCodeTranslator.pageTitle')}
                description={t('tools.morseCodeTranslator.pageDescription')}
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[400px]">
                {/* Text Area */}
                <div className="flex flex-col">
                    <div className="flex justify-between items-center mb-2">
                        <label className="font-semibold text-text-secondary dark:text-d-text-secondary">{t('tools.morseCodeTranslator.text')}</label>
                        <button onClick={() => handleCopy(text)} className="px-3 py-1 text-xs font-medium bg-border-color dark:bg-d-border-color rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">{t('common.copy')}</button>
                    </div>
                    <textarea
                        value={text}
                        onChange={e => setState(s => ({...s, text: e.target.value}))}
                        readOnly={mode === 'fromMorse'}
                        className="flex-grow p-4 bg-secondary dark:bg-d-secondary border border-border-color dark:border-d-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-d-accent font-sans"
                    />
                </div>
                {/* Morse Area */}
                <div className="flex flex-col">
                     <div className="flex justify-between items-center mb-2">
                        <label className="font-semibold text-text-secondary dark:text-d-text-secondary">{t('tools.morseCodeTranslator.morse')}</label>
                        <button onClick={() => handleCopy(morse)} className="px-3 py-1 text-xs font-medium bg-border-color dark:bg-d-border-color rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">{t('common.copy')}</button>
                    </div>
                    <textarea
                        value={morse}
                        onChange={e => setState(s => ({...s, morse: e.target.value}))}
                        readOnly={mode === 'toMorse'}
                        className="flex-grow p-4 bg-secondary dark:bg-d-secondary border border-border-color dark:border-d-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-d-accent font-mono"
                    />
                </div>
            </div>

            <div className="flex justify-center my-4">
                <button onClick={handleSwap} className="p-3 bg-secondary dark:bg-d-secondary rounded-full border border-border-color dark:border-d-border-color hover:bg-border-color dark:hover:bg-d-border-color transition-colors">
                    <RefreshIcon className="w-6 h-6 transform rotate-90" />
                </button>
            </div>

            <div className="p-6 bg-secondary dark:bg-d-secondary rounded-lg border border-border-color dark:border-d-border-color">
                <h3 className="font-semibold mb-4">{t('tools.morseCodeTranslator.audioPlayback')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                    <LabeledControl label={t('tools.morseCodeTranslator.frequency')} valueDisplay={`${frequency} Hz`}>
                        <input type="range" min="200" max="1200" value={frequency} onChange={e => setState(s => ({...s, frequency: parseInt(e.target.value, 10)}))} className="w-full accent-accent dark:accent-d-accent" />
                    </LabeledControl>
                    <LabeledControl label={t('tools.morseCodeTranslator.speed')} valueDisplay={`${dotDuration} ms`}>
                        <input type="range" min="40" max="200" value={dotDuration} onChange={e => setState(s => ({...s, dotDuration: parseInt(e.target.value, 10)}))} className="w-full accent-accent dark:accent-d-accent" />
                    </LabeledControl>
                    <button onClick={isPlaying ? stopMorse : playMorse} className={`px-6 py-3 font-semibold rounded-lg text-white transition-colors ${isPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-accent dark:bg-d-accent hover:opacity-90'}`}>
                        {isPlaying ? t('tools.morseCodeTranslator.stop') : t('tools.morseCodeTranslator.playSound')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MorseCodeTranslator;
