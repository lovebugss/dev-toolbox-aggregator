import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useToolState } from '../contexts/ToolStateContext';
import { useToasts } from '../contexts/ToastContext';
import { ToolHeader } from '../components/ui/ToolHeader';
import { CopyIcon } from '../components/icons/Icons';

// --- HELPER FUNCTIONS ---

const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) {
        const shortResult = /^#?([a-f\d])([a-f\d])([a-f\d])$/i.exec(hex);
        return shortResult ? {
            r: parseInt(shortResult[1] + shortResult[1], 16),
            g: parseInt(shortResult[2] + shortResult[2], 16),
            b: parseInt(shortResult[3] + shortResult[3], 16)
        } : null;
    }
    return {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    };
};

const rgbToHex = (r: number, g: number, b: number): string => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
};

const rgbToHsl = (r: number, g: number, b: number): { h: number; s: number; l: number } => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
};

const hslToRgb = (h: number, s: number, l: number): { r: number, g: number, b: number } => {
    h /= 360; s /= 100; l /= 100;
    let r, g, b;
    if (s === 0) {
        r = g = b = l;
    } else {
        const hue2rgb = (p: number, q: number, t: number) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
};

// --- SUB-COMPONENTS ---

const ColorField: React.FC<{ 
    label: string; 
    value: string; 
    onCopy: (val: string) => void;
    onChange?: (val: string) => void;
    readOnly?: boolean;
}> = ({ label, value, onCopy, onChange, readOnly }) => (
    <div className="flex flex-col gap-1.5 flex-1">
        <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary/70 dark:text-d-text-secondary/80">{label}</label>
        <div className="relative group">
            <input
                type="text"
                value={value}
                readOnly={readOnly}
                onChange={e => onChange?.(e.target.value)}
                spellCheck="false"
                className="w-full px-3 py-2 bg-primary/50 dark:bg-slate-800 border border-border-color dark:border-white/10 rounded-lg font-mono text-xs text-text-primary dark:text-d-text-primary focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-indigo-500 transition-all"
            />
            <button
                onClick={() => onCopy(value)}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 hover:bg-accent/10 dark:hover:bg-white/10 rounded opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <CopyIcon className="w-3.5 h-3.5 text-accent dark:text-indigo-400" />
            </button>
        </div>
    </div>
);

// --- MAIN COMPONENT ---

interface ColorState {
    hex: string;
    rgb: { r: number; g: number; b: number };
    hsl: { h: number; s: number; l: number };
    history: string[];
}

const ColorConverter: React.FC = () => {
    const { t } = useTranslation();
    const addToast = useToasts();
    
    const slRef = useRef<HTMLDivElement>(null);
    const hueRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState<'sl' | 'hue' | null>(null);

    const { state, setState } = useToolState<ColorState>('color-converter', {
        hex: '#6366F1',
        rgb: { r: 99, g: 102, b: 241 },
        hsl: { h: 239, s: 84, l: 67 },
        history: ['#6366F1', '#EC4899', '#10B981', '#F59E0B', '#3B82F6']
    });

    const { hex, rgb, hsl, history } = state;

    const updateColors = useCallback((newHsl: { h: number; s: number; l: number }) => {
        const newRgb = hslToRgb(newHsl.h, newHsl.s, newHsl.l);
        const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
        setState(s => ({ ...s, hex: newHex, rgb: newRgb, hsl: newHsl }));
    }, [setState]);

    const handleHexInput = (val: string) => {
        setState(s => ({ ...s, hex: val }));
        const cleaned = val.startsWith('#') ? val : `#${val}`;
        if (/^#([0-9A-F]{3}){1,2}$/i.test(cleaned)) {
            const newRgb = hexToRgb(cleaned);
            if (newRgb) {
                const newHsl = rgbToHsl(newRgb.r, newRgb.g, newRgb.b);
                setState(s => ({ ...s, rgb: newRgb, hsl: newHsl }));
            }
        }
    };

    // --- INTERACTION ---

    const handleInteraction = useCallback((e: MouseEvent | React.MouseEvent) => {
        if (!isDragging) return;

        if (isDragging === 'sl' && slRef.current) {
            const rect = slRef.current.getBoundingClientRect();
            const s = Math.max(0, Math.min(100, Math.round(((e.clientX - rect.left) / rect.width) * 100)));
            const l = Math.max(0, Math.min(100, Math.round((1 - (e.clientY - rect.top) / rect.height) * 100)));
            updateColors({ ...hsl, s, l });
        } else if (isDragging === 'hue' && hueRef.current) {
            const rect = hueRef.current.getBoundingClientRect();
            const h = Math.max(0, Math.min(360, Math.round(((e.clientX - rect.left) / rect.width) * 360)));
            updateColors({ ...hsl, h });
        }
    }, [isDragging, hsl, updateColors]);

    useEffect(() => {
        const handleGlobalUp = () => {
            if (isDragging) {
                setIsDragging(null);
                setState(s => {
                    const newHistory = [s.hex, ...s.history.filter(h => h !== s.hex)].slice(0, 10);
                    return { ...s, history: newHistory };
                });
            }
        };
        if (isDragging) {
            window.addEventListener('mousemove', handleInteraction);
            window.addEventListener('mouseup', handleGlobalUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleInteraction);
            window.removeEventListener('mouseup', handleGlobalUp);
        };
    }, [isDragging, handleInteraction, setState]);

    const handleEyedropper = async () => {
        if (!('EyeDropper' in window)) {
            addToast(t('tools.colorConverter.eyedropperNotSupported'), 'error');
            return;
        }
        try {
            // @ts-ignore
            const result = await new window.EyeDropper().open();
            const newRgb = hexToRgb(result.sRGBHex);
            if (newRgb) {
                const newHsl = rgbToHsl(newRgb.r, newRgb.g, newRgb.b);
                setState(s => ({
                    ...s, hex: result.sRGBHex.toUpperCase(), rgb: newRgb, hsl: newHsl,
                    history: [result.sRGBHex.toUpperCase(), ...s.history.filter(h => h !== result.sRGBHex.toUpperCase())].slice(0, 10)
                }));
            }
        } catch (e) {}
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text).then(() => addToast(t('common.toast.copiedSuccess'), 'success'));
    };

    return (
        <div className="flex flex-col h-full max-w-5xl mx-auto animate-in fade-in duration-700">
            <ToolHeader 
                title={t('tools.colorConverter.pageTitle')}
                description={t('tools.colorConverter.pageDescription')}
            />

            <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-10 items-start">
                
                {/* Visual Picker Side */}
                <div className="glass-panel p-6 rounded-[2.5rem] flex flex-col gap-6 relative overflow-hidden group">
                    <div 
                        className="absolute inset-0 opacity-10 blur-[100px] pointer-events-none transition-colors duration-1000"
                        style={{ backgroundColor: hex }}
                    />

                    {/* Main SL Square */}
                    <div 
                        ref={slRef}
                        className="relative w-full aspect-square rounded-2xl cursor-crosshair overflow-hidden border border-white/20 dark:border-white/10 shadow-xl select-none touch-none"
                        onMouseDown={() => setIsDragging('sl')}
                    >
                        {/* Base Hue Layer */}
                        <div className="absolute inset-0" style={{ backgroundColor: `hsl(${hsl.h}, 100%, 50%)` }} />
                        {/* Saturation/Lightness Gradients */}
                        <div className="absolute inset-0 bg-gradient-to-r from-white to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
                        
                        {/* SL Cursor */}
                        <div 
                            className="absolute w-5 h-5 border-2 border-white rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)] z-10 pointer-events-none"
                            style={{
                                left: `${hsl.s}%`,
                                top: `${100 - hsl.l}%`,
                                transform: 'translate(-50%, -50%)'
                            }}
                        />
                    </div>

                    {/* Hue Slider Strip */}
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary/70 dark:text-d-text-secondary/80">Hue</label>
                        <div 
                            ref={hueRef}
                            className="relative h-6 w-full rounded-full cursor-pointer shadow-inner border border-white/20 dark:border-white/10 select-none touch-none"
                            style={{ background: 'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)' }}
                            onMouseDown={() => setIsDragging('hue')}
                        >
                            {/* Hue Cursor */}
                            <div 
                                className="absolute top-0 bottom-0 w-3 bg-white border border-black/20 rounded-full shadow-md -translate-x-1/2 pointer-events-none"
                                style={{ left: `${(hsl.h / 360) * 100}%` }}
                            />
                        </div>
                    </div>

                    {/* Eyedropper & Swatch */}
                    <div className="flex items-center gap-4 mt-2">
                        <div 
                            className="w-12 h-12 rounded-xl border-2 border-white/20 dark:border-white/10 shadow-lg shrink-0"
                            style={{ backgroundColor: hex }}
                        />
                        <button 
                            onClick={handleEyedropper}
                            className="flex-grow py-3 bg-white/80 dark:bg-slate-700/80 backdrop-blur-md rounded-xl border border-white/20 dark:border-white/5 shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm font-bold text-text-primary dark:text-d-text-primary"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-3M9.707 9.707l4.586-4.586a1 1 0 011.414 0l2.121 2.121a1 1 0 010 1.414l-4.586 4.586m-3.535-3.535L7 12m5.657-5.657l3.535 3.535" /></svg>
                            {t('tools.colorConverter.eyedropper')}
                        </button>
                    </div>
                </div>

                {/* Info & Data Side */}
                <div className="flex flex-col gap-8">
                    {/* Main Info Card */}
                    <div className="glass-panel p-8 rounded-[2.5rem] border-white/20 dark:border-white/10 space-y-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-4xl font-black text-text-primary dark:text-d-text-primary tracking-tighter uppercase">{hex}</h3>
                                <p className="text-text-secondary dark:text-d-text-secondary/70 font-mono text-sm mt-1">rgb({rgb.r}, {rgb.g}, {rgb.b})</p>
                            </div>
                            <div className="flex gap-2">
                                {[1, 0.7, 0.4].map(op => (
                                    <div key={op} className="w-8 h-8 rounded-lg shadow-inner" style={{ backgroundColor: hex, opacity: op }} />
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <ColorField label="HEX" value={hex} onChange={handleHexInput} onCopy={handleCopy} />
                            <div className="flex gap-3">
                                <ColorField label="R" value={String(rgb.r)} readOnly onCopy={() => {}} />
                                <ColorField label="G" value={String(rgb.g)} readOnly onCopy={() => {}} />
                                <ColorField label="B" value={String(rgb.b)} readOnly onCopy={() => {}} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <ColorField label="RGB" value={`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`} onCopy={handleCopy} readOnly />
                             <ColorField label="HSL" value={`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`} onCopy={handleCopy} readOnly />
                        </div>
                    </div>

                    {/* History Card */}
                    <div className="glass-panel p-6 rounded-[2.5rem] dark:border-white/10">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-text-secondary/70 dark:text-d-text-secondary/80 mb-4 block">Recently Used</h4>
                        <div className="flex flex-wrap gap-3">
                            {history.map((h, i) => (
                                <button 
                                    key={`${h}-${i}`}
                                    onClick={() => handleHexInput(h)}
                                    className="w-10 h-10 rounded-xl border-2 border-white/10 dark:border-white/5 shadow-sm hover:scale-110 hover:shadow-lg active:scale-95 transition-all"
                                    style={{ backgroundColor: h }}
                                    title={h}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ColorConverter;