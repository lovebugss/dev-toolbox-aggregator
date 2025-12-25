import React, { useMemo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';
import { useToolState } from '../contexts/ToolStateContext';
import { ToolHeader } from '../components/ui/ToolHeader';
import { Accordion } from '../components/ui/Accordion';
import { LabeledControl } from '../components/ui/LabeledControl';
import { RefreshIcon, TrashIcon, LayersIcon, CopyIcon, DownloadIcon, BringForwardIcon, SendBackwardIcon } from '../components/icons/Icons';
import { useToasts } from '../contexts/ToastContext';

// --- TYPES & STATE ---

type BlendMode = 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten' | 'color-dodge' | 'color-burn' | 'hard-light' | 'soft-light' | 'difference' | 'exclusion' | 'hue' | 'saturation' | 'color' | 'luminosity';

interface ShapeLayer {
    id: string;
    name: string;
    complexity: number;
    randomness: number;
    fillType: 'solid' | 'gradient' | 'none';
    solidColor: string;
    gradientStart: string;
    gradientEnd: string;
    gradientAngle: number;
    opacity: number;
    blendMode: BlendMode;
    hasStroke: boolean;
    strokeColor: string;
    strokeWidth: number;
    seed: number;
}

interface SvgShapeGeneratorState {
    layers: ShapeLayer[];
    width: number;
    height: number;
    activeLayerId: string | null;
}

const BLEND_MODES: BlendMode[] = [
    'normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 
    'color-dodge', 'color-burn', 'hard-light', 'soft-light', 
    'difference', 'exclusion'
];

// --- HELPERS ---

const createDefaultLayer = (index: number): ShapeLayer => {
    const colors = ['#6366F1', '#EC4899', '#8B5CF6', '#10B981', '#F59E0B', '#3B82F6', '#EF4444'];
    return {
        id: uuidv4(),
        name: `Layer ${index + 1}`,
        complexity: 6 + Math.floor(Math.random() * 4),
        randomness: 0.4 + Math.random() * 0.3,
        fillType: index % 2 === 0 ? 'gradient' : 'solid',
        solidColor: colors[index % colors.length],
        gradientStart: colors[index % colors.length],
        gradientEnd: colors[(index + 1) % colors.length],
        gradientAngle: 45,
        opacity: index === 0 ? 1 : 0.7,
        blendMode: 'normal',
        hasStroke: false,
        strokeColor: '#000000',
        strokeWidth: 2,
        seed: Math.random() * 100000,
    };
};

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
            <span className="font-mono text-xs mix-blend-difference text-white">{value.toUpperCase()}</span>
        </div>
    </div>
);

// --- MAIN COMPONENT ---

const SvgShapeGenerator: React.FC = () => {
    const { t } = useTranslation();
    const addToast = useToasts();
    
    const initialLayer = createDefaultLayer(0);
    const { state, setState } = useToolState<SvgShapeGeneratorState>('svg-shape-generator', {
        layers: [initialLayer],
        width: 800,
        height: 800,
        activeLayerId: initialLayer.id,
    });

    const { layers, width, height, activeLayerId } = state;

    const activeLayer = useMemo(() => 
        layers.find(l => l.id === activeLayerId) || layers[0], 
    [layers, activeLayerId]);

    // Enhanced path calculation using deterministic pseudo-random logic
    const calculatePath = useCallback((layer: ShapeLayer, w: number, h: number) => {
        const size = Math.min(w, h);
        const radius = size / 3;
        const center_x = w / 2;
        const center_y = h / 2;
        const points = [];
        const angleStep = (Math.PI * 2) / layer.complexity;

        const getRand = (index: number) => {
            const x = Math.sin(layer.seed + index * 123.456) * 10000;
            return x - Math.floor(x);
        };

        for (let i = 0; i < layer.complexity; i++) {
            const angle = i * angleStep;
            const rOffset = 1 + (getRand(i) - 0.5) * 2 * layer.randomness;
            const r = radius * rOffset;
            points.push({
                x: center_x + r * Math.cos(angle),
                y: center_y + r * Math.sin(angle),
            });
        }

        const midpoints = [];
        for (let i = 0; i < layer.complexity; i++) {
            const p1 = points[i];
            const p2 = points[(i + 1) % layer.complexity];
            midpoints.push({ x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 });
        }

        let d = `M${midpoints[layer.complexity - 1].x.toFixed(2)},${midpoints[layer.complexity - 1].y.toFixed(2)}`;
        for (let i = 0; i < layer.complexity; i++) {
            d += ` Q${points[i].x.toFixed(2)},${points[i].y.toFixed(2)} ${midpoints[i].x.toFixed(2)},${midpoints[i].y.toFixed(2)}`;
        }
        return `${d} Z`;
    }, []);

    const updateLayer = (id: string, updates: Partial<ShapeLayer>) => {
        setState(s => ({
            ...s,
            layers: s.layers.map(l => l.id === id ? { ...l, ...updates } : l)
        }));
    };

    const addLayer = () => {
        const newLayer = createDefaultLayer(layers.length);
        setState(s => ({
            ...s,
            layers: [...s.layers, newLayer],
            activeLayerId: newLayer.id
        }));
    };

    const deleteLayer = (id: string) => {
        if (layers.length <= 1) return;
        setState(s => {
            const filtered = s.layers.filter(l => l.id !== id);
            return {
                ...s,
                layers: filtered,
                activeLayerId: s.activeLayerId === id ? filtered[0].id : s.activeLayerId
            };
        });
    };

    const moveLayer = (id: string, direction: 'up' | 'down') => {
        const index = layers.findIndex(l => l.id === id);
        if ((direction === 'up' && index === layers.length - 1) || (direction === 'down' && index === 0)) return;
        
        const newLayers = [...layers];
        const newIndex = direction === 'up' ? index + 1 : index - 1;
        const [moved] = newLayers.splice(index, 1);
        newLayers.splice(newIndex, 0, moved);
        
        setState(s => ({ ...s, layers: newLayers }));
    };

    const regenerateAll = () => {
        setState(s => ({
            ...s,
            layers: s.layers.map(l => ({ ...l, seed: Math.random() * 100000 }))
        }));
    };

    const svgCode = useMemo(() => {
        const paths = layers.map(layer => {
            const d = calculatePath(layer, width, height);
            const fill = layer.fillType === 'solid' ? layer.solidColor : 
                        layer.fillType === 'gradient' ? `url(#grad-${layer.id})` : 'none';
            const stroke = layer.hasStroke ? `stroke="${layer.strokeColor}" stroke-width="${layer.strokeWidth}"` : '';
            const style = `mix-blend-mode: ${layer.blendMode};`;
            return `<path d="${d}" fill="${fill}" fill-opacity="${layer.opacity}" ${stroke} style="${style}" />`;
        }).join('\n  ');

        const defs = layers.filter(l => l.fillType === 'gradient').map(layer => `
    <linearGradient id="grad-${layer.id}" gradientTransform="rotate(${layer.gradientAngle})">
      <stop offset="0%" stop-color="${layer.gradientStart}" />
      <stop offset="100%" stop-color="${layer.gradientEnd}" />
    </linearGradient>`).join('');

        return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>${defs}
  </defs>
  <rect width="100%" height="100%" fill="transparent" />
  ${paths}
</svg>`;
    }, [layers, width, height, calculatePath]);

    const handleCopy = () => {
        navigator.clipboard.writeText(svgCode).then(() => addToast(t('common.toast.copiedSuccess'), 'success'));
    };

    const handleDownload = () => {
        const blob = new Blob([svgCode], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'abstract-shape.svg';
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="flex flex-col h-full">
            <ToolHeader title={t('tools.svgShapeGenerator.pageTitle')} description={t('tools.svgShapeGenerator.pageDescription')} />

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 flex-grow min-h-0">
                {/* Preview Area */}
                <div className="flex flex-col gap-4">
                    <div className="flex-grow glass-panel rounded-[2.5rem] border border-white/10 flex items-center justify-center p-8 overflow-hidden relative group bg-black/5 dark:bg-black/40">
                        {/* Checkerboard background for transparency preview */}
                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 10%, transparent 10%)', backgroundSize: '20px 20px' }}></div>
                        
                        <div 
                            className="w-full h-full max-w-full max-h-full flex items-center justify-center transition-transform duration-700 group-hover:scale-[1.02]"
                            dangerouslySetInnerHTML={{ __html: svgCode }} 
                        />
                        
                        <div className="absolute bottom-6 right-6 flex gap-2">
                             <button onClick={handleCopy} className="p-3 bg-white/90 dark:bg-slate-800/90 rounded-2xl shadow-xl hover:scale-110 transition-all text-accent" title="Copy SVG Code"><CopyIcon /></button>
                             <button onClick={handleDownload} className="p-3 bg-white/90 dark:bg-slate-800/90 rounded-2xl shadow-xl hover:scale-110 transition-all text-green-500" title="Download SVG"><DownloadIcon /></button>
                        </div>
                    </div>

                    {/* Layer List Area */}
                    <div className="space-y-3">
                         <div className="flex justify-between items-center px-2">
                            <h3 className="text-xs font-black uppercase tracking-widest text-text-secondary dark:text-d-text-secondary/70">{t('tools.svgShapeGenerator.layers')}</h3>
                            <button onClick={addLayer} className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-accent text-white rounded-full hover:opacity-90 transition-all shadow-lg shadow-accent/20">+ {t('tools.svgShapeGenerator.addLayer')}</button>
                         </div>
                         <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                            {layers.map((layer, idx) => (
                                <div key={layer.id} className="relative shrink-0">
                                    <button
                                        onClick={() => setState(s => ({ ...s, activeLayerId: layer.id }))}
                                        className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl border transition-all ${
                                            activeLayerId === layer.id 
                                            ? 'bg-accent text-white border-accent shadow-xl scale-105 z-10' 
                                            : 'bg-secondary dark:bg-d-secondary border-border-color dark:border-white/5 text-text-secondary hover:bg-white/10'
                                        }`}
                                    >
                                        <div 
                                            className="w-4 h-4 rounded-full border border-white/20 shadow-inner" 
                                            style={{ backgroundColor: layer.fillType === 'solid' ? layer.solidColor : (layer.fillType === 'gradient' ? layer.gradientStart : 'transparent') }} 
                                        />
                                        <span className="text-xs font-bold whitespace-nowrap">{layer.name}</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Properties Side */}
                <div className="flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={regenerateAll} className="flex items-center justify-center gap-2 py-3 bg-accent text-white font-bold rounded-2xl shadow-lg hover:opacity-90 transition-all text-xs">
                            <RefreshIcon className="w-4 h-4" />
                            {t('tools.svgShapeGenerator.regenerateAll')}
                        </button>
                        <button onClick={() => updateLayer(activeLayer.id, { seed: Math.random() * 100000 })} className="flex items-center justify-center gap-2 py-3 bg-secondary dark:bg-d-secondary border border-border-color dark:border-white/5 rounded-2xl font-bold hover:bg-primary dark:hover:bg-d-primary transition-all text-xs">
                            <RefreshIcon className="w-4 h-4" />
                            {t('tools.svgShapeGenerator.randomizeLayer')}
                        </button>
                    </div>

                    <div className="glass-panel rounded-[2rem] border-white/10 overflow-hidden shadow-2xl">
                        {/* Active Layer Actions Header */}
                        <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <LayersIcon className="w-4 h-4 text-accent" />
                                <h3 className="font-bold text-xs uppercase tracking-widest">{activeLayer.name} {t('tools.svgShapeGenerator.settings')}</h3>
                            </div>
                            <div className="flex gap-1">
                                <button onClick={() => moveLayer(activeLayer.id, 'up')} className="p-1.5 hover:bg-white/10 rounded-lg text-text-secondary" title={t('tools.svgShapeGenerator.moveUp') as string}><BringForwardIcon className="w-4 h-4" /></button>
                                <button onClick={() => moveLayer(activeLayer.id, 'down')} className="p-1.5 hover:bg-white/10 rounded-lg text-text-secondary" title={t('tools.svgShapeGenerator.moveDown') as string}><SendBackwardIcon className="w-4 h-4" /></button>
                                <button onClick={() => deleteLayer(activeLayer.id)} className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg ml-2" title={t('tools.svgShapeGenerator.deleteLayer') as string}><TrashIcon className="w-4 h-4" /></button>
                            </div>
                        </div>

                        <Accordion title={t('tools.svgShapeGenerator.geometry')} defaultOpen>
                            <LabeledControl label={t('tools.svgShapeGenerator.complexity')} valueDisplay={String(activeLayer.complexity)}>
                                <input type="range" min="3" max="50" value={activeLayer.complexity} onChange={e => updateLayer(activeLayer.id, { complexity: parseInt(e.target.value) })} className="w-full accent-accent" />
                            </LabeledControl>
                            <LabeledControl label={t('tools.svgShapeGenerator.randomness')} valueDisplay={`${Math.round(activeLayer.randomness * 100)}%`}>
                                <input type="range" min="0" max="1" step="0.01" value={activeLayer.randomness} onChange={e => updateLayer(activeLayer.id, { randomness: parseFloat(e.target.value) })} className="w-full accent-accent" />
                            </LabeledControl>
                            <div className="pt-2 border-t border-white/5 space-y-4">
                                <LabeledControl label={t('tools.svgShapeGenerator.opacity')} valueDisplay={`${Math.round(activeLayer.opacity * 100)}%`}>
                                    <input type="range" min="0" max="1" step="0.01" value={activeLayer.opacity} onChange={e => updateLayer(activeLayer.id, { opacity: parseFloat(e.target.value) })} className="w-full accent-accent" />
                                </LabeledControl>
                                <LabeledControl label={t('tools.svgShapeGenerator.blendMode')}>
                                    <select 
                                        value={activeLayer.blendMode} 
                                        onChange={e => updateLayer(activeLayer.id, { blendMode: e.target.value as BlendMode })}
                                        className="w-full p-2.5 bg-primary dark:bg-d-primary border-none ring-1 ring-inset ring-border-color dark:ring-d-border-color rounded-xl text-xs font-bold focus:ring-2 focus:ring-accent"
                                    >
                                        {BLEND_MODES.map(mode => <option key={mode} value={mode}>{mode.toUpperCase()}</option>)}
                                    </select>
                                </LabeledControl>
                            </div>
                        </Accordion>

                        <Accordion title={t('tools.svgShapeGenerator.fillStyle')} defaultOpen>
                            <LabeledControl label={t('tools.svgShapeGenerator.fillType')}>
                                <div className="flex bg-primary dark:bg-d-primary p-1 rounded-xl border border-border-color dark:border-white/10">
                                    {['solid', 'gradient', 'none'].map(t_key => (
                                        <button 
                                            key={t_key}
                                            onClick={() => updateLayer(activeLayer.id, { fillType: t_key as any })}
                                            className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-tighter rounded-lg transition-all ${activeLayer.fillType === t_key ? 'bg-accent text-white shadow-md' : 'hover:bg-white/5 text-text-secondary'}`}
                                        >
                                            {t(`tools.svgShapeGenerator.${t_key}`)}
                                        </button>
                                    ))}
                                </div>
                            </LabeledControl>

                            {activeLayer.fillType === 'solid' && (
                                <LabeledControl label={t('tools.svgShapeGenerator.color')}>
                                    <ColorInput value={activeLayer.solidColor} onChange={c => updateLayer(activeLayer.id, { solidColor: c })} />
                                </LabeledControl>
                            )}

                            {activeLayer.fillType === 'gradient' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <LabeledControl label={t('tools.svgShapeGenerator.start')}>
                                            <ColorInput value={activeLayer.gradientStart} onChange={c => updateLayer(activeLayer.id, { gradientStart: c })} />
                                        </LabeledControl>
                                        <LabeledControl label={t('tools.svgShapeGenerator.end')}>
                                            <ColorInput value={activeLayer.gradientEnd} onChange={c => updateLayer(activeLayer.id, { gradientEnd: c })} />
                                        </LabeledControl>
                                    </div>
                                    <LabeledControl label={t('tools.svgShapeGenerator.angle')} valueDisplay={`${activeLayer.gradientAngle}°`}>
                                        <input type="range" min="0" max="360" value={activeLayer.gradientAngle} onChange={e => updateLayer(activeLayer.id, { gradientAngle: parseInt(e.target.value) })} className="w-full accent-accent" />
                                    </LabeledControl>
                                </div>
                            )}
                        </Accordion>

                        <Accordion title={t('tools.svgShapeGenerator.stroke')}>
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-xs font-bold uppercase tracking-widest opacity-70">{t('tools.svgShapeGenerator.enableStroke')}</span>
                                <input type="checkbox" checked={activeLayer.hasStroke} onChange={e => updateLayer(activeLayer.id, { hasStroke: e.target.checked })} className="w-4 h-4 accent-accent rounded" />
                            </div>
                            {activeLayer.hasStroke && (
                                <div className="space-y-4">
                                    <LabeledControl label={t('tools.svgShapeGenerator.color')}>
                                        <ColorInput value={activeLayer.strokeColor} onChange={c => updateLayer(activeLayer.id, { strokeColor: c })} />
                                    </LabeledControl>
                                    <LabeledControl label={t('tools.svgShapeGenerator.width')} valueDisplay={`${activeLayer.strokeWidth}px`}>
                                        <input type="range" min="1" max="50" value={activeLayer.strokeWidth} onChange={e => updateLayer(activeLayer.id, { strokeWidth: parseInt(e.target.value) })} className="w-full accent-accent" />
                                    </LabeledControl>
                                </div>
                            )}
                        </Accordion>

                        <Accordion title={t('tools.svgShapeGenerator.canvasDimension')}>
                            <div className="grid grid-cols-2 gap-4">
                                <LabeledControl label={t('tools.svgShapeGenerator.width')}>
                                    <input type="number" value={width} onChange={e => setState(s => ({ ...s, width: Math.max(100, parseInt(e.target.value) || 100) }))} className="w-full p-2 bg-primary dark:bg-d-primary rounded-xl border-none ring-1 ring-border-color text-sm" />
                                </LabeledControl>
                                <LabeledControl label={t('tools.svgShapeGenerator.height')}>
                                    <input type="number" value={height} onChange={e => setState(s => ({ ...s, height: Math.max(100, parseInt(e.target.value) || 100) }))} className="w-full p-2 bg-primary dark:bg-d-primary rounded-xl border-none ring-1 ring-border-color text-sm" />
                                </LabeledControl>
                            </div>
                        </Accordion>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SvgShapeGenerator;