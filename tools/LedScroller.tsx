import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useToolState } from '../contexts/ToolStateContext';
import { ToolHeader } from '../components/ui/ToolHeader';
import { LabeledControl } from '../components/ui/LabeledControl';
import { Accordion } from '../components/ui/Accordion';

// State definition
interface LedScrollerState {
    text: string;
    speed: number;
    textColor: string;
    backgroundColor: string;
    scrollDirection: 'left' | 'right';
    fontSize: number; // vh for fullscreen
    fontFamily: string;
    fontWeight: 'normal' | 'bold';
    isBlinking: boolean;
    blinkSpeed: number; // seconds
}

// Custom Color Input component for better UI
const ColorInput: React.FC<{ value: string; onChange: (color: string) => void }> = ({ value, onChange }) => (
    <div className="relative w-full h-10">
        <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div
            className="w-full h-full bg-primary dark:bg-d-primary ring-1 ring-inset ring-border-color dark:ring-d-border-color rounded-lg flex items-center px-3 pointer-events-none"
            style={{ backgroundColor: value }}
        >
            <span className="font-mono text-sm mix-blend-difference text-white">{value.toUpperCase()}</span>
        </div>
    </div>
);

const LedScroller: React.FC = () => {
    const { t } = useTranslation();
    const { state, setState } = useToolState<LedScrollerState>('led-scroller', {
        text: 'HELLO WORLD',
        speed: 5,
        textColor: '#FF0000',
        backgroundColor: '#000000',
        scrollDirection: 'left',
        fontSize: 25,
        fontFamily: "'Courier New', Courier, monospace",
        fontWeight: 'bold',
        isBlinking: false,
        blinkSpeed: 1,
    });
    const { text, speed, textColor, backgroundColor, scrollDirection, fontSize, fontFamily, fontWeight, isBlinking, blinkSpeed } = state;

    const [isFullScreen, setIsFullScreen] = useState(false);
    const scrollerRef = useRef<HTMLDivElement>(null);
    const ledTextRef = useRef<HTMLDivElement>(null);

    const [animationStyle, setAnimationStyle] = useState({});
    const [keyframes, setKeyframes] = useState('');

    useLayoutEffect(() => {
        if (scrollerRef.current && ledTextRef.current) {
            const containerWidth = scrollerRef.current.offsetWidth;
            const textWidth = ledTextRef.current.offsetWidth;

            const totalDistance = containerWidth + textWidth;
            const pixelsPerSecond = speed * 25; // pixels per second, adjust scaling factor for desired speed range
            const duration = totalDistance > 0 && pixelsPerSecond > 0 ? totalDistance / pixelsPerSecond : 0;

            const fromX = scrollDirection === 'left' ? containerWidth : -textWidth;
            const toX = scrollDirection === 'left' ? -textWidth : containerWidth;
            
            const scrollKeyframesName = 'scroll';

            setKeyframes(`
                @keyframes ${scrollKeyframesName} {
                    from { transform: translateX(${fromX}px); }
                    to { transform: translateX(${toX}px); }
                }
                @keyframes blink {
                    50% { opacity: 0.2; }
                }
            `);

            const animations: string[] = [];
            if (duration > 0 && isFinite(duration)) {
                 animations.push(`${scrollKeyframesName} ${duration}s linear infinite`);
            }
            if (isBlinking) {
                animations.push(`blink ${blinkSpeed}s steps(1, end) infinite`);
            }
            
            setAnimationStyle({
                color: textColor,
                fontSize: isFullScreen ? `${fontSize}vh` : `${Math.max(4, fontSize / 2.5)}vh`,
                fontFamily,
                fontWeight,
                animation: animations.join(', '),
            });
        }
    }, [text, speed, textColor, isFullScreen, fontSize, fontFamily, fontWeight, scrollDirection, isBlinking, blinkSpeed]);


    const handleToggleFullScreen = () => {
        const elem = scrollerRef.current;
        if (!elem) return;

        if (!document.fullscreenElement) {
            elem.requestFullscreen().catch(err => {
                alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    useEffect(() => {
        const onFullScreenChange = () => {
            setIsFullScreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', onFullScreenChange);
        return () => document.removeEventListener('fullscreenchange', onFullScreenChange);
    }, []);

    const scrollerClasses = isFullScreen
        ? 'fixed inset-0 z-[100] rounded-none border-none flex items-center overflow-hidden'
        : 'md:col-span-2 h-60 rounded-lg border-4 border-gray-700 dark:border-gray-600 flex items-center overflow-hidden relative shadow-inner';

    const fonts = ["'Courier New', Courier, monospace", "monospace", "'Lucida Console', Monaco, monospace", "'Comic Sans MS', cursive, sans-serif"];

    return (
        <div>
            <style>{keyframes}</style>
            <ToolHeader
                title={t('tools.ledScroller.pageTitle')}
                description={t('tools.ledScroller.pageDescription')}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1 bg-secondary dark:bg-d-secondary p-4 rounded-lg border border-border-color dark:border-d-border-color h-fit">
                    <LabeledControl label={t('tools.ledScroller.textLabel')}>
                        <textarea
                            value={text}
                            onChange={(e) => setState(s => ({ ...s, text: e.target.value }))}
                            placeholder={t('tools.ledScroller.textPlaceholder') as string}
                            className="w-full h-24 p-2 bg-primary dark:bg-d-primary border-none ring-1 ring-inset ring-border-color dark:ring-d-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-d-accent resize-y"
                        />
                    </LabeledControl>

                    <Accordion title={t('tools.ledScroller.fontSettings')} defaultOpen>
                        <LabeledControl label={t('tools.ledScroller.textColor')}>
                            <ColorInput value={textColor} onChange={color => setState(s => ({...s, textColor: color}))} />
                        </LabeledControl>
                        <LabeledControl label={t('tools.ledScroller.backgroundColor')}>
                            <ColorInput value={backgroundColor} onChange={color => setState(s => ({...s, backgroundColor: color}))} />
                        </LabeledControl>
                        <LabeledControl label={t('tools.ledScroller.fontFamily')}>
                             <select value={fontFamily} onChange={(e) => setState(s => ({ ...s, fontFamily: e.target.value }))} className="w-full p-2 bg-primary dark:bg-d-primary border-none ring-1 ring-inset ring-border-color dark:ring-d-border-color rounded-lg text-text-primary dark:text-d-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-d-accent">
                                {fonts.map(font => <option key={font} value={font}>{font.split(',')[0].replace(/'/g, '')}</option>)}
                            </select>
                        </LabeledControl>
                        <LabeledControl label={t('tools.ledScroller.fontSize')} valueDisplay={`${fontSize}`}>
                           <input type="range" min="5" max="40" value={fontSize} onChange={(e) => setState(s => ({ ...s, fontSize: parseInt(e.target.value, 10) }))} className="w-full accent-accent dark:accent-d-accent" />
                        </LabeledControl>
                        <LabeledControl label={t('tools.ledScroller.fontWeight')}>
                            <div className="flex bg-primary dark:bg-d-primary p-1 rounded-md border border-border-color dark:border-d-border-color">
                                <button onClick={() => setState(s => ({ ...s, fontWeight: 'normal' }))} className={`w-1/2 py-1 text-xs rounded ${fontWeight === 'normal' ? 'bg-secondary dark:bg-d-secondary shadow' : ''}`}>{t('tools.ledScroller.normal')}</button>
                                <button onClick={() => setState(s => ({ ...s, fontWeight: 'bold' }))} className={`w-1/2 py-1 text-xs rounded ${fontWeight === 'bold' ? 'bg-secondary dark:bg-d-secondary shadow' : ''}`}>{t('tools.ledScroller.bold')}</button>
                            </div>
                        </LabeledControl>
                    </Accordion>
                    
                    <Accordion title={t('tools.ledScroller.blinkEffect')}>
                        <div className="flex items-center justify-between">
                             <label htmlFor="blinking-toggle" className="text-sm font-medium text-text-primary dark:text-d-text-primary">{t('tools.ledScroller.enableBlinking')}</label>
                             <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" id="blinking-toggle" className="sr-only peer" checked={isBlinking} onChange={() => setState(s => ({...s, isBlinking: !s.isBlinking}))} />
                                <div className="w-11 h-6 bg-border-color peer-focus:outline-none rounded-full peer dark:bg-d-border-color peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-accent"></div>
                            </label>
                        </div>
                        {isBlinking && (
                             <LabeledControl label={t('tools.ledScroller.blinkSpeed')} valueDisplay={`${blinkSpeed.toFixed(1)}s`}>
                                <input type="range" min="0.2" max="2" step="0.1" value={blinkSpeed} onChange={(e) => setState(s => ({ ...s, blinkSpeed: parseFloat(e.target.value) }))} className="w-full accent-accent dark:accent-d-accent" />
                            </LabeledControl>
                        )}
                    </Accordion>
                    
                    <Accordion title={t('common.settings')} defaultOpen>
                        <LabeledControl label={t('tools.ledScroller.speedLabel')} valueDisplay={`${speed}`}>
                           <div className="flex items-center gap-2">
                                <span className="text-xs text-text-secondary dark:text-d-text-secondary">{t('tools.ledScroller.slow')}</span>
                                <input type="range" min="1" max="10" value={speed} onChange={(e) => setState(s => ({ ...s, speed: parseInt(e.target.value, 10) }))} className="w-full accent-accent dark:accent-d-accent" />
                                <span className="text-xs text-text-secondary dark:text-d-text-secondary">{t('tools.ledScroller.fast')}</span>
                           </div>
                        </LabeledControl>
                        <LabeledControl label={t('tools.ledScroller.scrollDirection')}>
                            <div className="flex bg-primary dark:bg-d-primary p-1 rounded-md border border-border-color dark:border-d-border-color">
                                <button onClick={() => setState(s => ({ ...s, scrollDirection: 'left' }))} className={`w-1/2 py-1 text-xs rounded ${scrollDirection === 'left' ? 'bg-secondary dark:bg-d-secondary shadow' : ''}`}>{t('tools.ledScroller.directionLeft')}</button>
                                <button onClick={() => setState(s => ({ ...s, scrollDirection: 'right' }))} className={`w-1/2 py-1 text-xs rounded ${scrollDirection === 'right' ? 'bg-secondary dark:bg-d-secondary shadow' : ''}`}>{t('tools.ledScroller.directionRight')}</button>
                            </div>
                        </LabeledControl>
                    </Accordion>


                    <button
                        onClick={handleToggleFullScreen}
                        className="w-full px-4 py-2 mt-4 bg-accent/90 text-white font-semibold rounded-lg hover:bg-accent transition-colors"
                    >
                        {t('tools.ledScroller.fullscreen')}
                    </button>
                </div>

                <div
                    ref={scrollerRef}
                    className={scrollerClasses}
                    style={{ backgroundColor: backgroundColor }}
                    onClick={isFullScreen ? handleToggleFullScreen : undefined}
                >
                    <div
                        ref={ledTextRef}
                        className="absolute text-5xl md:text-7xl lg:text-9xl whitespace-nowrap uppercase"
                        style={animationStyle}
                    >
                        {text}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LedScroller;