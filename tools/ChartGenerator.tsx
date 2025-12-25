import React, { useState, useMemo, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie, AreaChart, Area,
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell
} from 'recharts';
import { useToolState } from '../contexts/ToolStateContext';
import { ToolHeader } from '../components/ui/ToolHeader';
import { LabeledControl } from '../components/ui/LabeledControl';
import { Accordion } from '../components/ui/Accordion';
import { BarChartIcon, DownloadIcon } from '../components/icons/Icons';

type ChartType = 'bar' | 'line' | 'area' | 'pie' | 'scatter';

interface ChartState {
    rawData: string;
    chartType: ChartType;
    xAxisKey: string;
    yAxisKeys: string[];
    title: string;
    themeColors: string[];
}

const THEME_PRESETS = [
    ['#4f46e5', '#818cf8', '#c7d2fe', '#4338ca', '#3730a3'], // Indigo
    ['#059669', '#34d399', '#a7f3d0', '#065f46', '#064e3b'], // Emerald
    ['#dc2626', '#f87171', '#fecaca', '#991b1b', '#7f1d1d'], // Red
    ['#d97706', '#fbbf24', '#fef3c7', '#92400e', '#78350f'], // Amber
    ['#2563eb', '#60a5fa', '#dbeafe', '#1e40af', '#1e3a8a'], // Blue
];

const ChartGenerator: React.FC = () => {
    const { t } = useTranslation();
    const chartRef = useRef<HTMLDivElement>(null);

    const { state, setState } = useToolState<ChartState>('chart-generator', {
        rawData: JSON.stringify([
            { name: 'Jan', revenue: 4000, profit: 2400 },
            { name: 'Feb', revenue: 3000, profit: 1398 },
            { name: 'Mar', revenue: 2000, profit: 9800 },
            { name: 'Apr', revenue: 2780, profit: 3908 },
            { name: 'May', revenue: 1890, profit: 4800 },
            { name: 'Jun', revenue: 2390, profit: 3800 },
            { name: 'Jul', revenue: 3490, profit: 4300 },
        ], null, 2),
        chartType: 'bar',
        xAxisKey: 'name',
        yAxisKeys: ['revenue', 'profit'],
        title: 'Monthly Performance',
        themeColors: THEME_PRESETS[0],
    });

    const { rawData, chartType, xAxisKey, yAxisKeys, title, themeColors } = state;

    const parsedData = useMemo(() => {
        const trimmed = rawData.trim();
        if (!trimmed) return [];
        try {
            if (trimmed.startsWith('[')) {
                return JSON.parse(trimmed);
            } else {
                // Simple CSV parsing
                const lines = trimmed.split('\n');
                const headers = lines[0].split(',').map(h => h.trim());
                return lines.slice(1).map(line => {
                    const values = line.split(',').map(v => v.trim());
                    return headers.reduce((obj, header, i) => {
                        const val = values[i];
                        obj[header] = isNaN(Number(val)) ? val : Number(val);
                        return obj;
                    }, {} as any);
                });
            }
        } catch (e) {
            return null;
        }
    }, [rawData]);

    const dataKeys = useMemo(() => {
        if (!parsedData || parsedData.length === 0) return [];
        return Object.keys(parsedData[0]);
    }, [parsedData]);

    const handleYAxisToggle = (key: string) => {
        setState(s => ({
            ...s,
            yAxisKeys: s.yAxisKeys.includes(key)
                ? s.yAxisKeys.filter(k => k !== key)
                : [...s.yAxisKeys, key]
        }));
    };

    const handleDownload = useCallback(async () => {
        if (!chartRef.current) return;
        const svgElement = chartRef.current.querySelector('svg');
        if (!svgElement) return;

        const svgData = new XMLSerializer().serializeToString(svgElement);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        // Increase resolution for the download
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        img.onload = () => {
            canvas.width = img.width * 2;
            canvas.height = img.height * 2;
            if (ctx) {
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.scale(2, 2);
                ctx.drawImage(img, 0, 0);
                const pngUrl = canvas.toDataURL('image/png');
                const downloadLink = document.createElement('a');
                downloadLink.href = pngUrl;
                downloadLink.download = `${title || 'chart'}.png`;
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
                URL.revokeObjectURL(url);
            }
        };
        img.src = url;
    }, [title]);

    const renderChart = () => {
        if (!parsedData || parsedData.length === 0) {
            return (
                <div className="h-full flex items-center justify-center text-text-secondary opacity-50 uppercase tracking-widest text-xs italic">
                    {t('tools.chartGenerator.noData')}
                </div>
            );
        }

        const commonProps = {
            width: '100%',
            height: '100%',
            data: parsedData,
            margin: { top: 20, right: 30, left: 20, bottom: 20 },
        };

        const renderAxis = () => (
            <>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey={xAxisKey} stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
            </>
        );

        switch (chartType) {
            case 'bar':
                return (
                    <BarChart {...commonProps}>
                        {renderAxis()}
                        {yAxisKeys.map((key, i) => (
                            <Bar key={key} dataKey={key} fill={themeColors[i % themeColors.length]} radius={[4, 4, 0, 0]} />
                        ))}
                    </BarChart>
                );
            case 'line':
                return (
                    <LineChart {...commonProps}>
                        {renderAxis()}
                        {yAxisKeys.map((key, i) => (
                            <Line key={key} type="monotone" dataKey={key} stroke={themeColors[i % themeColors.length]} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        ))}
                    </LineChart>
                );
            case 'area':
                return (
                    <AreaChart {...commonProps}>
                        <defs>
                            {yAxisKeys.map((key, i) => (
                                <linearGradient key={`grad-${key}`} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={themeColors[i % themeColors.length]} stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor={themeColors[i % themeColors.length]} stopOpacity={0}/>
                                </linearGradient>
                            ))}
                        </defs>
                        {renderAxis()}
                        {yAxisKeys.map((key, i) => (
                            <Area key={key} type="monotone" dataKey={key} stroke={themeColors[i % themeColors.length]} strokeWidth={2} fillOpacity={1} fill={`url(#grad-${key})`} />
                        ))}
                    </AreaChart>
                );
            case 'pie':
                return (
                    <PieChart {...commonProps}>
                        <Pie
                            data={parsedData}
                            dataKey={yAxisKeys[0]}
                            nameKey={xAxisKey}
                            cx="50%" cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            stroke="none"
                        >
                            {parsedData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={themeColors[index % themeColors.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                    </PieChart>
                );
            case 'scatter':
                return (
                    <ScatterChart {...commonProps}>
                        {renderAxis()}
                        {yAxisKeys.map((key, i) => (
                            <Scatter key={key} name={key} dataKey={key} fill={themeColors[i % themeColors.length]} />
                        ))}
                    </ScatterChart>
                );
            default:
                return null;
        }
    };

    return (
        <div className="flex flex-col h-full">
            <ToolHeader title={t('tools.chartGenerator.pageTitle')} description={t('tools.chartGenerator.pageDescription')} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-grow min-h-0">
                {/* Inputs Side */}
                <div className="flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
                    <div className="glass-panel p-6 rounded-[2rem] border-white/10 space-y-4">
                        <LabeledControl label={t('tools.chartGenerator.dataInput')}>
                            <textarea
                                value={rawData}
                                onChange={(e) => setState(s => ({ ...s, rawData: e.target.value }))}
                                placeholder={t('tools.chartGenerator.placeholder') as string}
                                className="w-full h-48 p-4 bg-primary/50 dark:bg-slate-900/50 border border-border-color dark:border-white/10 rounded-xl text-text-primary dark:text-d-text-primary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent transition-all resize-none placeholder:opacity-30"
                                spellCheck="false"
                            />
                        </LabeledControl>
                        {parsedData === null && (
                            <p className="text-red-500 text-xs font-bold">{t('tools.chartGenerator.invalidData')}</p>
                        )}
                    </div>

                    <div className="glass-panel p-6 rounded-[2rem] border-white/10 space-y-6">
                        <h3 className="font-bold text-text-primary dark:text-d-text-primary uppercase tracking-widest text-xs">
                            {t('tools.chartGenerator.config')}
                        </h3>

                        <LabeledControl label={t('tools.chartGenerator.chartType')}>
                            <div className="flex flex-wrap gap-2">
                                {(['bar', 'line', 'area', 'pie', 'scatter'] as ChartType[]).map(type => (
                                    <button
                                        key={type}
                                        onClick={() => setState(s => ({ ...s, chartType: type }))}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${chartType === type ? 'bg-accent text-white shadow-lg' : 'bg-primary/50 dark:bg-slate-800 text-text-secondary hover:bg-accent/10'}`}
                                    >
                                        {t(`tools.chartGenerator.${type}`)}
                                    </button>
                                ))}
                            </div>
                        </LabeledControl>

                        <LabeledControl label={t('tools.chartGenerator.title')}>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setState(s => ({ ...s, title: e.target.value }))}
                                className="w-full p-2.5 bg-primary/50 dark:bg-slate-800 border border-border-color dark:border-white/10 rounded-xl text-text-primary dark:text-d-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent transition-all"
                            />
                        </LabeledControl>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <LabeledControl label={t('tools.chartGenerator.xAxis')}>
                                <select
                                    value={xAxisKey}
                                    onChange={(e) => setState(s => ({ ...s, xAxisKey: e.target.value }))}
                                    className="w-full p-2.5 bg-primary/50 dark:bg-slate-800 border border-border-color dark:border-white/10 rounded-xl text-text-primary dark:text-d-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent transition-all"
                                >
                                    {dataKeys.map(key => <option key={key} value={key}>{key}</option>)}
                                </select>
                            </LabeledControl>

                            <LabeledControl label={t('tools.chartGenerator.yAxes')}>
                                <div className="max-h-32 overflow-y-auto p-2 bg-primary/30 dark:bg-slate-900/30 rounded-xl space-y-1">
                                    {dataKeys.map(key => (
                                        <label key={key} className="flex items-center gap-2 text-xs font-bold text-text-secondary dark:text-d-text-secondary cursor-pointer hover:text-accent">
                                            <input
                                                type="checkbox"
                                                checked={yAxisKeys.includes(key)}
                                                onChange={() => handleYAxisToggle(key)}
                                                className="w-4 h-4 rounded text-accent focus:ring-accent accent-accent"
                                            />
                                            {key}
                                        </label>
                                    ))}
                                </div>
                            </LabeledControl>
                        </div>

                        <LabeledControl label={t('tools.chartGenerator.colors')}>
                            <div className="flex gap-3">
                                {THEME_PRESETS.map((p, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setState(s => ({ ...s, themeColors: p }))}
                                        className={`w-10 h-10 rounded-xl overflow-hidden border-2 transition-all hover:scale-110 ${themeColors[0] === p[0] ? 'border-accent shadow-lg shadow-accent/20' : 'border-transparent'}`}
                                    >
                                        <div className="grid grid-cols-2 grid-rows-2 h-full">
                                            <div style={{ backgroundColor: p[0] }}></div>
                                            <div style={{ backgroundColor: p[1] }}></div>
                                            <div style={{ backgroundColor: p[2] }}></div>
                                            <div style={{ backgroundColor: p[3] }}></div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </LabeledControl>
                    </div>
                </div>

                {/* Preview Side */}
                <div className="flex flex-col gap-6">
                    <div className="flex justify-between items-center px-4">
                        <h3 className="font-bold text-text-primary dark:text-d-text-primary uppercase tracking-widest text-xs">Preview</h3>
                        <button
                            onClick={handleDownload}
                            disabled={!parsedData || parsedData.length === 0}
                            className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white font-black rounded-2xl hover:opacity-90 transition-all shadow-lg disabled:opacity-50"
                        >
                            <DownloadIcon className="w-4 h-4" />
                            {t('tools.chartGenerator.download')}
                        </button>
                    </div>
                    <div ref={chartRef} className="flex-grow glass-panel rounded-[2.5rem] p-8 border-white/10 flex flex-col min-h-[400px]">
                        {title && <h2 className="text-center font-black text-xl mb-6 text-text-primary dark:text-d-text-primary">{title}</h2>}
                        <div className="flex-grow">
                            <ResponsiveContainer width="100%" height="100%">
                                {renderChart() as any}
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChartGenerator;