import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useToolState } from '../contexts/ToolStateContext';
import { ToolHeader } from '../components/ui/ToolHeader';
import { Accordion } from '../components/ui/Accordion';
import { LabeledControl } from '../components/ui/LabeledControl';
import { RefreshIcon } from '../components/icons/Icons';
import { useToasts } from '../contexts/ToastContext';

// --- TYPES & STATE ---
interface SvgShapeGeneratorState {
    complexity: number;
    randomness: number;
    fillType: 'solid' | 'gradient' | 'none';
    solidColor: string;
    gradientStart: string;
    gradientEnd: string;
    gradientAngle: number;
    hasStroke: boolean;
    strokeColor: string;
    strokeWidth: number;
    width: number;
    height: number;
    regenerateTrigger: number;
}

// --- HELPER COMPONENTS ---
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

const FillTypeSelector: React.FC<{ value: string, onChange: (value: any) => void }> = ({ value, onChange }) => {
    const { t } = useTranslation();
    const options = ['solid', 'gradient', 'none'];
    return (
        <div className="flex bg-primary dark:bg-d-primary p-1 rounded-lg border border-border-color dark:border-d-border-color">
            {options.map(opt => (
                <button
                    key={opt}
                    onClick={() => onChange(opt)}
                    className={`w-full py-1 text-xs rounded ${value === opt ? 'bg-secondary dark:bg-d-secondary shadow font-semibold' : ''}`}
                >
                    {t(`tools.svgShapeGenerator.${opt}`)}
                </button>
            ))}
        </div>
    );
};


// --- MAIN COMPONENT ---
const SvgShapeGenerator: React.FC = () => {
    const { t } = useTranslation();
    const addToast = useToasts();
    const { state, setState } = useToolState<SvgShapeGeneratorState>('svg-shape-generator', {
        complexity: 8,
        randomness: 0.5,
        fillType: 'gradient',
        solidColor: '#6366F1',
        gradientStart: '#EC4899',
        gradientEnd: '#8B5CF6',
        gradientAngle: 45,
        hasStroke: false,
        strokeColor: '#0F172A',
        strokeWidth: 4,
        width: 500,
        height: 500,
        regenerateTrigger: 0,
    });

    const {
        complexity, randomness, fillType, solidColor, gradientStart,
        gradientEnd, gradientAngle, hasStroke, strokeColor, strokeWidth,
        width, height, regenerateTrigger
    } = state;

    const set = (key: keyof SvgShapeGeneratorState) => (value: any) => setState(s => ({ ...s, [key]: value }));

    const pathData = useMemo(() => {
        // regenerateTrigger is used to force re-calculation
        const size = Math.min(width, height);
        const radius = size / 2.5;
        const center_x = width / 2;
        const center_y = height / 2;
        const points = [];
        const angleStep = (Math.PI * 2) / complexity;

        for (let i = 0; i < complexity; i++) {
            const angle = i * angleStep;
            const randomOffset = 1 + (Math.random() - 0.5) * 2 * randomness;
            const r = radius * randomOffset;
            points.push({
                x: center_x + r * Math.cos(angle),
                y: center_y + r * Math.sin(angle),
            });
        }

        const midpoints = [];
        for (let i = 0; i < complexity; i++) {
            const p1 = points[i];
            const p2 = points[(i + 1) % complexity];
            midpoints.push({ x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 });
        }

        let d = `M${midpoints[complexity - 1].x.toFixed(2)},${midpoints[complexity - 1].y.toFixed(2)}`;
        for (let i = 0; i < complexity; i++) {
            d += ` Q${points[i].x.toFixed(2)},${points[i].y.toFixed(2)} ${midpoints[i].x.toFixed(2)},${midpoints[i].y.toFixed(2)}`;
        }
        return `${d} Z`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [complexity, randomness, regenerateTrigger, width, height]);
    
    const svgCode = useMemo(() => {
        const fillAttr = fillType === 'solid' ? `fill="${solidColor}"`
            : fillType === 'gradient' ? `fill="url(#blobGradient)"`
            : `fill="none"`;
            
        const strokeAttr = hasStroke ? `stroke="${strokeColor}" stroke-width="${strokeWidth}"` : '';

        const gradientDef = fillType === 'gradient' ? `
    <defs>
      <linearGradient id="blobGradient" gradientTransform="rotate(${gradientAngle})">
        <stop offset="0%" stop-color="${gradientStart}" />
        <stop offset="100%" stop-color="${gradientEnd}" />
      </linearGradient>
    </defs>` : '';

        return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">${gradientDef}
  <path d="${pathData}" ${fillAttr} ${strokeAttr} />
</svg>`;
    }, [pathData, fillType, solidColor, gradientStart, gradientEnd, gradientAngle, hasStroke, strokeColor, strokeWidth, width, height]);
    
    const copySvg = () => {
        navigator.clipboard.writeText(svgCode).then(() => {
            addToast(t('common.toast.copiedSuccess'), 'success');
        }, () => {
            addToast(t('common.toast.copiedFailed'), 'error');
        });
    };
    
    const downloadSvg = () => {
        const blob = new Blob([svgCode], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'shape.svg';
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="flex flex-col h-full">
            <ToolHeader title={t('tools.svgShapeGenerator.pageTitle')} description={t('tools.svgShapeGenerator.pageDescription')} />
            
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8 min-h-0">
                {/* Display Area */}
                <div className="bg-secondary dark:bg-d-secondary p-4 rounded-lg border border-border-color dark:border-d-border-color flex items-center justify-center">
                    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
                        <defs>
                            <linearGradient id="blobGradient" gradientTransform={`rotate(${gradientAngle})`}>
                                <stop offset="0%" stopColor={gradientStart} />
                                <stop offset="100%" stopColor={gradientEnd} />
                            </linearGradient>
                        </defs>
                        <path
                            d={pathData}
                            fill={fillType === 'solid' ? solidColor : fillType === 'gradient' ? 'url(#blobGradient)' : 'none'}
                            stroke={hasStroke ? strokeColor : 'none'}
                            strokeWidth={hasStroke ? strokeWidth : 0}
                        />
                    </svg>
                </div>
                {/* Control Panel */}
                <div className="flex flex-col gap-4">
                    <button onClick={() => set('regenerateTrigger')(regenerateTrigger + 1)} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-accent text-white font-semibold rounded-lg hover:opacity-90 transition-opacity">
                        <RefreshIcon />
                        {t('tools.svgShapeGenerator.regenerate')}
                    </button>
                    <div className="flex-grow bg-secondary dark:bg-d-secondary rounded-lg border border-border-color dark:border-d-border-color overflow-y-auto">
                        <Accordion title={t('tools.svgShapeGenerator.shape')} defaultOpen>
                            <LabeledControl label={t('tools.svgShapeGenerator.complexity')} valueDisplay={String(complexity)}>
                                <input type="range" min="3" max="20" value={complexity} onChange={e => set('complexity')(parseInt(e.target.value, 10))} className="w-full accent-accent dark:accent-d-accent" />
                            </LabeledControl>
                            <LabeledControl label={t('tools.svgShapeGenerator.randomness')} valueDisplay={randomness.toFixed(2)}>
                                <input type="range" min="0" max="1" step="0.05" value={randomness} onChange={e => set('randomness')(parseFloat(e.target.value))} className="w-full accent-accent dark:accent-d-accent" />
                            </LabeledControl>
                            <LabeledControl label={t('tools.svgShapeGenerator.size')}>
                                <div className="flex items-center gap-2">
                                    <input type="number" min="1" value={width} onChange={e => set('width')(parseInt(e.target.value, 10) || 1)} className="w-full p-1 bg-primary dark:bg-d-primary rounded-md text-center text-sm" />
                                    <span className="text-text-secondary dark:text-d-text-secondary">x</span>
                                    <input type="number" min="1" value={height} onChange={e => set('height')(parseInt(e.target.value, 10) || 1)} className="w-full p-1 bg-primary dark:bg-d-primary rounded-md text-center text-sm" />
                                </div>
                            </LabeledControl>
                        </Accordion>
                        <Accordion title={t('tools.svgShapeGenerator.fill')} defaultOpen>
                            <LabeledControl label={t('tools.svgShapeGenerator.fillType')}>
                                <FillTypeSelector value={fillType} onChange={set('fillType')} />
                            </LabeledControl>
                            {fillType === 'solid' && (
                                <LabeledControl label={t('tools.svgShapeGenerator.solidColor')}>
                                    <ColorInput value={solidColor} onChange={set('solidColor')} />
                                </LabeledControl>
                            )}
                            {fillType === 'gradient' && (
                                <>
                                <LabeledControl label={t('tools.svgShapeGenerator.gradientColors')}>
                                    <div className="flex gap-2">
                                        <ColorInput value={gradientStart} onChange={set('gradientStart')} />
                                        <ColorInput value={gradientEnd} onChange={set('gradientEnd')} />
                                    </div>
                                </LabeledControl>
                                <LabeledControl label={t('tools.svgShapeGenerator.gradientAngle')} valueDisplay={`${gradientAngle}°`}>
                                    <input type="range" min="0" max="360" value={gradientAngle} onChange={e => set('gradientAngle')(parseInt(e.target.value, 10))} className="w-full accent-accent dark:accent-d-accent" />
                                </LabeledControl>
                                </>
                            )}
                        </Accordion>
                        <Accordion title={t('tools.svgShapeGenerator.stroke')}>
                            <div className="flex items-center justify-between">
                                <label htmlFor="stroke-toggle" className="text-sm font-medium">{t('tools.svgShapeGenerator.enableStroke')}</label>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" id="stroke-toggle" className="sr-only peer" checked={hasStroke} onChange={() => set('hasStroke')(!hasStroke)} />
                                    <div className="w-11 h-6 bg-border-color peer-focus:outline-none rounded-full peer dark:bg-d-border-color peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                                </label>
                            </div>
                            {hasStroke && (
                                <>
                                <LabeledControl label={t('tools.svgShapeGenerator.strokeColor')}>
                                    <ColorInput value={strokeColor} onChange={set('strokeColor')} />
                                </LabeledControl>
                                <LabeledControl label={t('tools.svgShapeGenerator.strokeWidth')} valueDisplay={`${strokeWidth}px`}>
                                    <input type="range" min="1" max="50" value={strokeWidth} onChange={e => set('strokeWidth')(parseInt(e.target.value, 10))} className="w-full accent-accent dark:accent-d-accent" />
                                </LabeledControl>
                                </>
                            )}
                        </Accordion>
                         <Accordion title={t('tools.svgShapeGenerator.export')}>
                            <textarea
                                readOnly
                                value={svgCode}
                                className="w-full h-32 p-2 bg-primary dark:bg-d-primary text-text-secondary dark:text-d-text-secondary font-mono text-xs resize-none focus:outline-none rounded-lg no-scrollbar"
                            />
                            <div className="flex gap-2 mt-2">
                                <button onClick={copySvg} className="flex-1 px-3 py-1.5 text-xs bg-primary dark:bg-d-primary rounded-md">{t('tools.svgShapeGenerator.copySvg')}</button>
                                <button onClick={downloadSvg} className="flex-1 px-3 py-1.5 text-xs bg-primary dark:bg-d-primary rounded-md">{t('tools.svgShapeGenerator.downloadSvg')}</button>
                            </div>
                        </Accordion>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SvgShapeGenerator;
