import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useToasts } from '../contexts/ToastContext';
import { useToolState } from '../contexts/ToolStateContext';
import { ToolHeader } from '../components/ui/ToolHeader';

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

const CopyButton: React.FC<{ text: string }> = ({ text }) => {
    const { t } = useTranslation();
    const addToast = useToasts();
    
    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!text) return;
        navigator.clipboard.writeText(text).then(
            () => addToast(t('common.toast.copiedSuccess'), 'success'),
            () => addToast(t('common.toast.copiedFailed'), 'error')
        );
    };

    return (
        <button
            onClick={handleCopy}
            title={t('common.copy') as string}
            className="absolute top-1/2 right-3 -translate-y-1/2 p-2 text-text-secondary dark:text-d-text-secondary hover:bg-border-color dark:hover:bg-d-border-color rounded-lg transition-colors"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
        </button>
    );
};

const NumberBaseConverter: React.FC = () => {
    const { t } = useTranslation();
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
            const newValues = { binary: '', octal: '', decimal: '', hexadecimal: '' };
            newValues[baseName] = value;
            setState({ values: newValues });
            return;
        }
        
        setError({ base: null, message: null });

        let decimalValue: bigint;
        try {
            if (baseName === 'decimal') {
                decimalValue = BigInt(value);
            } else {
                const prefix = { binary: '0b', octal: '0o', hexadecimal: '0x' }[baseName];
                decimalValue = BigInt(`${prefix}${value}`);
            }
        } catch (e) {
            setError({ base: baseName, message: t('tools.numberBaseConverter.invalidInput') });
            return;
        }
        
        const newValues = BASES.reduce((acc, b) => {
            acc[b.name as BaseName] = decimalValue.toString(b.base).toUpperCase();
            return acc;
        }, {} as Record<BaseName, string>);

        setState({ values: newValues });

    }, [t, setState]);
    
    return (
        <div>
            <ToolHeader 
              title={t('tools.numberBaseConverter.pageTitle')}
              description={t('tools.numberBaseConverter.pageDescription')}
            />

            <div className="max-w-2xl mx-auto space-y-6">
                {BASES.map(({ name, labelKey, base }) => (
                    <div key={name}>
                        <label htmlFor={name} className="block text-lg font-semibold text-text-secondary dark:text-d-text-secondary mb-2">
                            {t(labelKey)} 
                            <span className="text-sm font-normal opacity-60"> ({t('tools.numberBaseConverter.baseLabel', { base })})</span>
                        </label>
                        <div className="relative">
                            <input
                                id={name}
                                type="text"
                                value={values[name as BaseName]}
                                onChange={(e) => handleInputChange(name as BaseName, e.target.value)}
                                placeholder={t('tools.numberBaseConverter.inputPlaceholder') as string}
                                className={`w-full p-4 pr-14 text-2xl font-mono bg-secondary dark:bg-d-secondary border rounded-lg focus:outline-none focus:ring-2  ${error.base === name ? 'border-red-500 focus:ring-red-500' : 'border-border-color dark:border-d-border-color focus:ring-accent dark:focus:ring-d-accent'}`}
                                spellCheck="false"
                                autoComplete="off"
                            />
                            {values[name as BaseName] && <CopyButton text={values[name as BaseName]} />}
                        </div>
                         {error.base === name && error.message && (
                            <p className="mt-2 text-sm text-red-500">{error.message}</p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default NumberBaseConverter;
