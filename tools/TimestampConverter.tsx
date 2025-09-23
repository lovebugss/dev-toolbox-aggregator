import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useToolState } from '../contexts/ToolStateContext';
import { useToasts } from '../contexts/ToastContext';

interface TimestampState {
    inputTimestamp: string;
    timestampUnit: 's' | 'ms';
    localDateOutput: string;
    utcDateOutput: string;
    inputDate: string;
    secondsOutput: string;
    millisecondsOutput: string;
}

const CopyButton: React.FC<{ text: string, tooltip: string }> = ({ text, tooltip }) => {
    const { t } = useTranslation();
    const addToast = useToasts();

    const handleCopy = () => {
        if (!text) return;
        navigator.clipboard.writeText(text).then(() => {
            addToast(t('common.toast.copiedSuccess'), 'success');
        }, () => {
            addToast(t('common.toast.copiedFailed'), 'error');
        });
    };

    return (
        <button
            onClick={handleCopy}
            title={tooltip}
            className="p-2 bg-border-color dark:bg-d-border-color rounded-md text-text-secondary dark:text-d-text-secondary hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
        </button>
    );
};

const TimestampConverter: React.FC = () => {
    const { t } = useTranslation();
    const { state, setState } = useToolState<TimestampState>('timestamp-converter', {
        inputTimestamp: '',
        timestampUnit: 's',
        localDateOutput: '',
        utcDateOutput: '',
        inputDate: '',
        secondsOutput: '',
        millisecondsOutput: '',
    });
    const { inputTimestamp, timestampUnit, localDateOutput, utcDateOutput, inputDate, secondsOutput, millisecondsOutput } = state;
    
    // Live current time
    const [currentTime, setCurrentTime] = useState(Math.floor(Date.now() / 1000));
    const [tsError, setTsError] = useState<string | null>(null);
    const [dateError, setDateError] = useState<string | null>(null);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(Math.floor(Date.now() / 1000));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const convertFromTimestamp = useCallback((ts: string, unit: 's' | 'ms') => {
        if (!ts.trim()) {
            setState(s => ({ ...s, localDateOutput: '', utcDateOutput: '' }));
            setTsError(null);
            return;
        }

        if (!/^\d+$/.test(ts)) {
            setTsError(t('tools.timestampConverter.errorInvalidTimestamp'));
            setState(s => ({ ...s, localDateOutput: '', utcDateOutput: '' }));
            return;
        }

        const num = parseInt(ts, 10);
        const date = new Date(unit === 's' ? num * 1000 : num);

        setState(s => ({ ...s, localDateOutput: date.toLocaleString(), utcDateOutput: date.toUTCString() }));
        setTsError(null);
    }, [t, setState]);

    const convertFromDate = useCallback((dateStr: string) => {
        if (!dateStr.trim()) {
            setState(s => ({ ...s, secondsOutput: '', millisecondsOutput: '' }));
            setDateError(null);
            return;
        }

        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
            setDateError(t('tools.timestampConverter.errorInvalidDate'));
            setState(s => ({ ...s, secondsOutput: '', millisecondsOutput: '' }));
            return;
        }

        setState(s => ({ ...s, millisecondsOutput: date.getTime().toString(), secondsOutput: Math.floor(date.getTime() / 1000).toString() }));
        setDateError(null);
    }, [t, setState]);

    useEffect(() => {
        convertFromTimestamp(inputTimestamp, timestampUnit);
    }, [inputTimestamp, timestampUnit, convertFromTimestamp]);

    useEffect(() => {
        convertFromDate(inputDate);
    }, [inputDate, convertFromDate]);

    const handleSetNow = () => {
        const now = new Date();
        const nowSeconds = Math.floor(now.getTime() / 1000).toString();
        
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;

        setState(s => ({ ...s, inputTimestamp: nowSeconds, timestampUnit: 's', inputDate: formattedDate }));
    };
    
    const baseInputClass = "w-full p-2 bg-primary dark:bg-d-primary border border-border-color dark:border-d-border-color rounded-md text-text-primary dark:text-d-text-primary focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-d-accent font-mono";
    const outputBoxClass = "relative w-full p-2 bg-secondary dark:bg-d-secondary border border-border-color dark:border-d-border-color rounded-md text-text-primary dark:text-d-text-primary font-mono text-sm min-h-[40px] flex items-center pr-12";
    const errorClass = "mt-1 text-xs text-red-600 dark:text-red-400";

    return (
        <div>
            <h2 className="text-2xl font-bold text-text-primary dark:text-d-text-primary mb-4">{t('tools.timestampConverter.pageTitle')}</h2>
            <p className="text-text-secondary dark:text-d-text-secondary mb-6">{t('tools.timestampConverter.pageDescription')}</p>

            <div className="mb-8 p-4 bg-secondary dark:bg-d-secondary border border-border-color dark:border-d-border-color rounded-lg text-center">
                <h3 className="text-sm font-medium text-text-secondary dark:text-d-text-secondary">{t('tools.timestampConverter.currentTime')}</h3>
                <p className="text-2xl font-bold font-mono text-accent dark:text-d-accent">{currentTime}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Timestamp to Date */}
                <div className="space-y-4 p-6 bg-secondary dark:bg-d-secondary border border-border-color dark:border-d-border-color rounded-lg">
                    <h3 className="text-lg font-semibold text-text-primary dark:text-d-text-primary">{t('tools.timestampConverter.timestampToDate')}</h3>
                    
                    <div>
                        <label className="block text-sm font-medium text-text-secondary dark:text-d-text-secondary mb-1">{t('tools.timestampConverter.unixTimestamp')}</label>
                        <input
                            type="text"
                            value={inputTimestamp}
                            onChange={(e) => setState(s => ({...s, inputTimestamp: e.target.value}))}
                            className={baseInputClass}
                        />
                         {tsError && <p className={errorClass}>{tsError}</p>}
                    </div>
                    
                    <div className="flex items-center space-x-4">
                        <span className="text-sm font-medium text-text-secondary dark:text-d-text-secondary">{t('tools.timestampConverter.unit')}:</span>
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input type="radio" name="unit" value="s" checked={timestampUnit === 's'} onChange={() => setState(s => ({...s, timestampUnit: 's'}))} className="h-4 w-4 text-accent dark:text-d-accent bg-secondary dark:bg-d-secondary border-border-color dark:border-d-border-color focus:ring-accent dark:focus:ring-d-accent" />
                            <span className="text-sm">{t('tools.timestampConverter.seconds')}</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input type="radio" name="unit" value="ms" checked={timestampUnit === 'ms'} onChange={() => setState(s => ({...s, timestampUnit: 'ms'}))} className="h-4 w-4 text-accent dark:text-d-accent bg-secondary dark:bg-d-secondary border-border-color dark:border-d-border-color focus:ring-accent dark:focus:ring-d-accent" />
                            <span className="text-sm">{t('tools.timestampConverter.milliseconds')}</span>
                        </label>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-secondary dark:text-d-text-secondary mb-1">{t('tools.timestampConverter.localTime')}</label>
                        <div className={outputBoxClass}>
                           {localDateOutput}
                           <div className="absolute top-1/2 right-2 -translate-y-1/2"><CopyButton text={localDateOutput} tooltip={t('common.tooltips.copyDate')} /></div>
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-text-secondary dark:text-d-text-secondary mb-1">{t('tools.timestampConverter.utcTime')}</label>
                         <div className={outputBoxClass}>
                            {utcDateOutput}
                            <div className="absolute top-1/2 right-2 -translate-y-1/2"><CopyButton text={utcDateOutput} tooltip={t('common.tooltips.copyDate')} /></div>
                         </div>
                    </div>
                </div>

                {/* Date to Timestamp */}
                <div className="space-y-4 p-6 bg-secondary dark:bg-d-secondary border border-border-color dark:border-d-border-color rounded-lg">
                     <h3 className="text-lg font-semibold text-text-primary dark:text-d-text-primary">{t('tools.timestampConverter.dateToTimestamp')}</h3>
                     <div>
                        <label className="block text-sm font-medium text-text-secondary dark:text-d-text-secondary mb-1">{t('tools.timestampConverter.humanReadableDate')}</label>
                        <input
                            type="text"
                            value={inputDate}
                            onChange={(e) => setState(s => ({...s, inputDate: e.target.value}))}
                            placeholder={t('tools.timestampConverter.inputDatePlaceholder')}
                            className={baseInputClass}
                        />
                        {dateError && <p className={errorClass}>{dateError}</p>}
                    </div>

                     <div>
                        <label className="block text-sm font-medium text-text-secondary dark:text-d-text-secondary mb-1">{t('tools.timestampConverter.seconds')}</label>
                        <div className={outputBoxClass}>
                            {secondsOutput}
                            <div className="absolute top-1/2 right-2 -translate-y-1/2"><CopyButton text={secondsOutput} tooltip={t('common.tooltips.copyTimestamp')} /></div>
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-text-secondary dark:text-d-text-secondary mb-1">{t('tools.timestampConverter.milliseconds')}</label>
                        <div className={outputBoxClass}>
                            {millisecondsOutput}
                            <div className="absolute top-1/2 right-2 -translate-y-1/2"><CopyButton text={millisecondsOutput} tooltip={t('common.tooltips.copyTimestamp')} /></div>
                        </div>
                    </div>

                    <button onClick={handleSetNow} className="w-full mt-4 px-6 py-2 bg-accent dark:bg-d-accent text-white dark:text-d-primary font-semibold rounded-lg hover:bg-blue-700 dark:hover:bg-blue-500 transition-colors duration-200 shadow-md">
                        {t('tools.timestampConverter.now')}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default TimestampConverter;