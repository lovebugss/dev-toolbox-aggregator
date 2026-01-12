import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useToolState } from '../contexts/ToolStateContext';
import { ToolHeader } from '../components/ui/ToolHeader';
import { LabeledControl } from '../components/ui/LabeledControl';

interface TimeDiffState {
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
}

const TimeDiffCalculator: React.FC = () => {
    const { t } = useTranslation();
    
    const now = new Date();
    const defaultDate = now.toISOString().split('T')[0];
    const defaultTime = now.toTimeString().split(' ')[0].substring(0, 5);

    const { state, setState } = useToolState<TimeDiffState>('time-diff-calculator', {
        startDate: defaultDate,
        startTime: defaultTime,
        endDate: defaultDate,
        endTime: defaultTime,
    });

    const diffResult = useMemo(() => {
        const start = new Date(`${state.startDate}T${state.startTime}`);
        const end = new Date(`${state.endDate}T${state.endTime}`);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;

        const diffMs = Math.abs(end.getTime() - start.getTime());
        
        const seconds = Math.floor(diffMs / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        return {
            days,
            hours: hours % 24,
            minutes: minutes % 60,
            seconds: seconds % 60,
            totalSeconds: seconds,
            totalMinutes: minutes,
            totalHours: hours,
        };
    }, [state]);

    const setNow = (prefix: 'start' | 'end') => {
        const d = new Date();
        const dateStr = d.toISOString().split('T')[0];
        const timeStr = d.toTimeString().split(' ')[0].substring(0, 5);
        setState(s => ({
            ...s,
            [`${prefix}Date`]: dateStr,
            [`${prefix}Time`]: timeStr,
        }));
    };

    return (
        <div className="max-w-4xl mx-auto">
            <ToolHeader 
                title={t('tools.timeDiffCalculator.pageTitle')}
                description={t('tools.timeDiffCalculator.pageDescription')}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Inputs */}
                <div className="space-y-6">
                    <div className="glass-panel p-6 rounded-2xl border-white/10">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-sm uppercase tracking-widest text-text-secondary dark:text-d-text-secondary">{t('tools.timeDiffCalculator.startDate')}</h3>
                            <button onClick={() => setNow('start')} className="text-xs text-accent font-bold hover:underline cursor-pointer">NOW</button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <input 
                                type="date" 
                                value={state.startDate} 
                                onChange={e => setState(s => ({...s, startDate: e.target.value}))}
                                className="w-full p-2.5 bg-primary dark:bg-d-primary rounded-xl border-none ring-1 ring-border-color font-mono"
                            />
                            <input 
                                type="time" 
                                value={state.startTime} 
                                onChange={e => setState(s => ({...s, startTime: e.target.value}))}
                                className="w-full p-2.5 bg-primary dark:bg-d-primary rounded-xl border-none ring-1 ring-border-color font-mono"
                            />
                        </div>
                    </div>

                    <div className="glass-panel p-6 rounded-2xl border-white/10">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-sm uppercase tracking-widest text-text-secondary dark:text-d-text-secondary">{t('tools.timeDiffCalculator.endDate')}</h3>
                            <button onClick={() => setNow('end')} className="text-xs text-accent font-bold hover:underline cursor-pointer">NOW</button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <input 
                                type="date" 
                                value={state.endDate} 
                                onChange={e => setState(s => ({...s, endDate: e.target.value}))}
                                className="w-full p-2.5 bg-primary dark:bg-d-primary rounded-xl border-none ring-1 ring-border-color font-mono"
                            />
                            <input 
                                type="time" 
                                value={state.endTime} 
                                onChange={e => setState(s => ({...s, endTime: e.target.value}))}
                                className="w-full p-2.5 bg-primary dark:bg-d-primary rounded-xl border-none ring-1 ring-border-color font-mono"
                            />
                        </div>
                    </div>
                </div>

                {/* Results */}
                <div className="flex flex-col gap-4">
                    <h3 className="font-bold text-lg px-2">{t('tools.timeDiffCalculator.result')}</h3>
                    <div className="glass-panel p-8 rounded-[2rem] border-white/10 flex-grow flex flex-col justify-center text-center">
                        {diffResult ? (
                            <div className="space-y-8">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary dark:text-d-text-secondary mb-2 opacity-50">
                                        {t('tools.timeDiffCalculator.precise')}
                                    </p>
                                    <div className="flex justify-center gap-4 text-accent dark:text-indigo-400">
                                        <div className="flex flex-col">
                                            <span className="text-4xl font-black">{diffResult.days}</span>
                                            <span className="text-[10px] font-bold uppercase">Days</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-4xl font-black">{diffResult.hours}</span>
                                            <span className="text-[10px] font-bold uppercase">Hrs</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-4xl font-black">{diffResult.minutes}</span>
                                            <span className="text-[10px] font-bold uppercase">Min</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-4xl font-black">{diffResult.seconds}</span>
                                            <span className="text-[10px] font-bold uppercase">Sec</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-8 border-t border-white/10">
                                    <div className="bg-primary/30 dark:bg-black/20 p-4 rounded-2xl">
                                        <p className="text-[10px] font-bold text-text-secondary mb-1">TOTAL HOURS</p>
                                        <p className="text-xl font-mono font-bold">{diffResult.totalHours.toLocaleString()}</p>
                                    </div>
                                    <div className="bg-primary/30 dark:bg-black/20 p-4 rounded-2xl">
                                        <p className="text-[10px] font-bold text-text-secondary mb-1">TOTAL MINUTES</p>
                                        <p className="text-xl font-mono font-bold">{diffResult.totalMinutes.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-text-secondary italic">Invalid date format</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TimeDiffCalculator;