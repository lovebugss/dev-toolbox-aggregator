import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useToolState } from '../contexts/ToolStateContext';
import { ToolHeader } from '../components/ui/ToolHeader';
import { LabeledControl } from '../components/ui/LabeledControl';
import { GlobeIcon, RefreshIcon } from '../components/icons/Icons';

interface TimezoneState {
    sourceTime: string;
    targetTimezone: string;
}

const commonTimezones = [
    "UTC",
    "Asia/Shanghai",
    "Asia/Tokyo",
    "Asia/Hong_Kong",
    "America/New_York",
    "America/Los_Angeles",
    "America/Chicago",
    "Europe/London",
    "Europe/Paris",
    "Europe/Berlin",
    "Australia/Sydney",
    "Pacific/Auckland"
];

const TimezoneConverter: React.FC = () => {
    const { t } = useTranslation();
    
    const [currentTime, setCurrentTime] = useState(new Date());

    const { state, setState } = useToolState<TimezoneState>('timezone-converter', {
        sourceTime: new Date().toISOString().substring(0, 16),
        targetTimezone: 'UTC',
    });

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const convertedTime = useMemo(() => {
        try {
            const date = new Date(state.sourceTime);
            return new Intl.DateTimeFormat('en-US', {
                timeZone: state.targetTimezone,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
            }).format(date);
        } catch (e) {
            return "Invalid format";
        }
    }, [state.sourceTime, state.targetTimezone]);

    return (
        <div className="max-w-4xl mx-auto">
            <ToolHeader 
                title={t('tools.timezoneConverter.pageTitle')}
                description={t('tools.timezoneConverter.pageDescription')}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Configuration */}
                <div className="space-y-6">
                    <div className="glass-panel p-6 rounded-2xl border-white/10 space-y-6">
                        <LabeledControl label={t('tools.timezoneConverter.sourceTime')}>
                            <div className="flex gap-2">
                                <input 
                                    type="datetime-local" 
                                    value={state.sourceTime}
                                    onChange={e => setState(s => ({...s, sourceTime: e.target.value}))}
                                    className="flex-grow p-2.5 bg-primary dark:bg-d-primary rounded-xl border-none ring-1 ring-border-color font-mono"
                                />
                                <button 
                                    onClick={() => setState(s => ({...s, sourceTime: new Date().toISOString().substring(0, 16)}))}
                                    className="p-2.5 bg-accent text-white rounded-xl shadow-lg hover:scale-105 transition-transform"
                                    title="Current Time"
                                >
                                    <RefreshIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </LabeledControl>

                        <LabeledControl label={t('tools.timezoneConverter.targetTimezone')}>
                            <select 
                                value={state.targetTimezone}
                                onChange={e => setState(s => ({...s, targetTimezone: e.target.value}))}
                                className="w-full p-2.5 bg-primary dark:bg-d-primary rounded-xl border-none ring-1 ring-border-color font-bold"
                            >
                                {commonTimezones.map(tz => (
                                    <option key={tz} value={tz}>{tz}</option>
                                ))}
                            </select>
                        </LabeledControl>
                    </div>

                    {/* Quick Live Preview */}
                    <div className="glass-panel p-6 rounded-2xl border-white/10 bg-accent/5">
                        <div className="flex items-center gap-3 mb-2">
                            <GlobeIcon className="text-accent" />
                            <h4 className="font-bold text-xs uppercase tracking-widest opacity-70">{t('tools.timezoneConverter.local')}</h4>
                        </div>
                        <p className="text-2xl font-mono font-black text-text-primary dark:text-d-text-primary">
                            {currentTime.toLocaleTimeString()}
                        </p>
                        <p className="text-[10px] font-bold text-text-secondary dark:text-d-text-secondary mt-1">
                            {Intl.DateTimeFormat().resolvedOptions().timeZone}
                        </p>
                    </div>
                </div>

                {/* Big Result Display */}
                <div className="flex flex-col">
                    <h3 className="font-bold text-lg mb-4 px-2">{t('tools.timezoneConverter.convertedTime')}</h3>
                    <div className="glass-panel p-10 rounded-[2.5rem] border-white/10 flex-grow flex flex-col items-center justify-center text-center relative overflow-hidden group">
                        <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] bg-gradient-radial from-accent/10 to-transparent opacity-50 pointer-events-none group-hover:scale-110 transition-transform duration-1000"></div>
                        
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-accent dark:text-indigo-400 mb-4 block">
                            {state.targetTimezone}
                        </span>
                        
                        <p className="text-5xl font-black text-text-primary dark:text-d-text-primary tracking-tighter leading-tight relative z-10">
                            {convertedTime.split(', ')[1]}
                        </p>
                        <p className="text-xl font-bold text-text-secondary dark:text-d-text-secondary mt-2 relative z-10">
                            {convertedTime.split(', ')[0]}
                        </p>
                        
                        <div className="mt-10 flex gap-2 relative z-10">
                            <button 
                                onClick={() => navigator.clipboard.writeText(convertedTime)}
                                className="px-6 py-2 bg-white/10 hover:bg-white/20 dark:bg-black/20 dark:hover:bg-black/40 rounded-full text-xs font-bold transition-all border border-white/10"
                            >
                                Copy Result
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TimezoneConverter;