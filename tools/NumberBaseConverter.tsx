
import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useToasts } from '../contexts/ToastContext';
import { useToolState } from '../contexts/ToolStateContext';
import { ToolHeader } from '../components/ui/ToolHeader';
import { CopyIcon } from '../components/icons/Icons';

const BASES = [
    { name: 'binary', base: 2, labelKey: 'tools.numberBaseConverter.binary', regex: /^[01]*$/ },
    { name: 'octal', base: 8, labelKey: 'tools.numberBaseConverter.octal', regex: /^[0-7]*$/ },
    { name: 'decimal', base: 10, labelKey: 'tools.numberBaseConverter.decimal', regex: /^\d*$/ },
    { name: 'hexadecimal', base: 16, labelKey: 'tools.numberBaseConverter.hexadecimal', regex: /^[0-9a-fA-F]*$/ },
];

type BaseName = 'binary' | 'octal' | 'decimal' | 'hexadecimal';

interface NumberBaseToolState {
    values: Record<BaseName, string>;
}

const NumberBaseConverter: React.FC = () => {
    const { t } = useTranslation();
    const addToast = useToasts();
    const { state, setState } = useToolState<NumberBaseToolState>('number-base-converter', {
        values: { binary: '101010', octal: '52', decimal: '42', hexadecimal: '2A' },
    });
    const { values } = state;
    const [error, setError] = useState<{ base: BaseName | null, message: string | null }>({ base: null, message: null });
    
    const handleInputChange = useCallback((baseName: BaseName, value: string) => {
        const currentBaseInfo = BASES.find(b => b.name === baseName)!;
        if (value === '') {
            setState({ values: { binary: '', octal: '', decimal: '', hexadecimal: '' } });
            setError({ base: null, message: null });
            return;
        }
        if (!currentBaseInfo.regex.test(value)) {
            setError({ base: baseName, message: t('tools.numberBaseConverter.invalidInput') });
            setState(s => ({ values: { ...s.values, [baseName]: value } }));
            return;
        }
        setError({ base: null, message: null });

        try {
            let decimalValue: bigint;
            if (baseName === 'decimal') decimalValue = BigInt(value);
            else {
                const prefix = { binary: '0b', octal: '0o', hexadecimal: '0x' }[baseName];
                decimalValue = BigInt(`${prefix}${value}`);
            }
            const newValues = BASES.reduce((acc, b) => {
                acc[b.name as BaseName] = decimalValue.toString(b.base).toUpperCase();
                return acc;
            }, {} as Record<BaseName, string>);
            setState({ values: newValues });
        } catch (e) {
            setError({ base: baseName, message: t('tools.numberBaseConverter.invalidInput') });
        }
    }, [t, setState]);
    
    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text).then(() => addToast(t('common.toast.copiedSuccess'), 'success'));
    };

    return (
        <div>
            <ToolHeader title={t('tools.numberBaseConverter.pageTitle')} description={t('tools.numberBaseConverter.pageDescription')} />

            <div className="max-w-3xl mx-auto space-y-6">
                {BASES.map(({ name, labelKey, base }) => (
                    <div key={name} className="glass-panel p-6 rounded-[2rem] border-white/10 group hover:bg-white/5 transition-all">
                        <label htmlFor={name} className="flex items-center justify-between mb-4 px-2">
                            <span className="text-xs font-black uppercase tracking-[0.2em] text-text-secondary dark:text-d-text-secondary/70">
                                {t(labelKey)} <span className="opacity-40 font-mono text-[10px]">({base})</span>
                            </span>
                        </label>
                        {/* Fix: Removed extra closing span tag which caused syntax error. */}
                        <div className="relative">
                            <input
                                id={name}
                                type="text"
                                value={values[name as BaseName]}
                                onChange={(e) => handleInputChange(name as BaseName, e.target.value)}
                                placeholder={t('tools.numberBaseConverter.inputPlaceholder') as string}
                                className={`w-full p-4 pr-16 text-2xl font-mono bg-black/5 dark:bg-black/20 text-text-primary dark:text-d-text-primary border-2 rounded-2xl focus:outline-none transition-all ${error.base === name ? 'border-red-500/50' : 'border-transparent focus:border-accent/30'}`}
                                spellCheck="false"
                                autoComplete="off"
                            />
                            {values[name as BaseName] && (
                                <button
                                    onClick={() => handleCopy(values[name as BaseName])}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-accent/10 rounded-xl text-accent opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <CopyIcon className="w-5 h-5"/>
                                </button>
                            )}
                        </div>
                         {error.base === name && error.message && <p className="mt-3 text-xs text-red-500 px-2 font-bold">{error.message}</p>}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default NumberBaseConverter;
