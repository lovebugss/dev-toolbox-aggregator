import React, { useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useToolState } from '../contexts/ToolStateContext';
import { ToolHeader } from '../components/ui/ToolHeader';

interface ColorConverterState {
    hex: string;
    rgb: { r: number; g: number; b: number };
    hsl: { h: number; s: number; l: number };
}

// Basic color conversion functions
const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
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

const ColorConverter: React.FC = () => {
    const { t } = useTranslation();
    const { state, setState } = useToolState<ColorConverterState>('color-converter', {
        hex: '#818CF8',
        rgb: { r: 129, g: 140, b: 248 },
        hsl: { h: 235, s: 91, l: 76 },
    });
    const { hex, rgb, hsl } = state;

    const updateFromHex = useCallback((newHex: string) => {
        const newRgb = hexToRgb(newHex);
        if (newRgb) {
            const newHsl = rgbToHsl(newRgb.r, newRgb.g, newRgb.b);
            setState(s => ({ ...s, rgb: newRgb, hsl: newHsl }));
        }
    }, [setState]);

    useEffect(() => {
        updateFromHex(hex);
    }, [hex, updateFromHex]);

    const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setState(s => ({ ...s, hex: e.target.value }));
    };

    const handleRgbChange = (e: React.ChangeEvent<HTMLInputElement>, component: 'r' | 'g' | 'b') => {
        const value = parseInt(e.target.value, 10);
        if (!isNaN(value) && value >= 0 && value <= 255) {
            const newRgb = { ...rgb, [component]: value };
            const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
            const newHsl = rgbToHsl(newRgb.r, newRgb.g, newRgb.b);
            setState({ hex: newHex, rgb: newRgb, hsl: newHsl });
        }
    };
    
    const inputClasses = "w-full px-4 py-3 bg-primary dark:bg-d-primary border-none ring-1 ring-inset ring-border-color dark:ring-d-border-color rounded-lg text-text-primary dark:text-d-text-primary focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-d-accent font-mono";
    const outputClasses = "w-full px-4 py-3 bg-primary dark:bg-d-primary ring-1 ring-inset ring-border-color dark:ring-d-border-color rounded-lg text-text-primary dark:text-d-text-primary font-mono";

    return (
        <div>
            <ToolHeader 
              title={t('tools.colorConverter.pageTitle')}
              description={t('tools.colorConverter.pageDescription')}
            />

            <div className="bg-secondary dark:bg-d-secondary p-8 rounded-2xl shadow-sm">
                <div className="flex flex-col md:flex-row gap-12 items-center">
                    <div 
                        className="w-56 h-56 rounded-full border-8 border-primary dark:border-d-primary shadow-2xl transition-all"
                        style={{ backgroundColor: hex }}
                    />
                    <div className="flex-1 space-y-6 w-full max-w-md">
                        {/* HEX Input */}
                        <div>
                            <label htmlFor="hex-input" className="block text-sm font-medium text-text-secondary dark:text-d-text-secondary mb-2">HEX</label>
                            <input
                                type="text"
                                id="hex-input"
                                value={hex}
                                onChange={handleHexChange}
                                className={inputClasses}
                            />
                        </div>

                        {/* RGB Inputs */}
                        <div>
                            <label className="block text-sm font-medium text-text-secondary dark:text-d-text-secondary mb-2">RGB</label>
                            <div className="grid grid-cols-3 gap-3">
                                <input type="number" value={rgb.r} onChange={(e) => handleRgbChange(e, 'r')} className={inputClasses} />
                                <input type="number" value={rgb.g} onChange={(e) => handleRgbChange(e, 'g')} className={inputClasses} />
                                <input type="number" value={rgb.b} onChange={(e) => handleRgbChange(e, 'b')} className={inputClasses} />
                            </div>
                        </div>
                        
                        {/* HSL Display */}
                        <div>
                            <label className="block text-sm font-medium text-text-secondary dark:text-d-text-secondary mb-2">HSL</label>
                            <div className="grid grid-cols-3 gap-3">
                                <div className={outputClasses}>{hsl.h}</div>
                                <div className={outputClasses}>{hsl.s}%</div>
                                <div className={outputClasses}>{hsl.l}%</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ColorConverter;
