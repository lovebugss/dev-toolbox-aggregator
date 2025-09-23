import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useToolState } from '../contexts/ToolStateContext';
import { useToasts } from '../contexts/ToastContext';
import { ToolHeader } from '../components/ui/ToolHeader';

interface HashingToolState {
    input: string;
    isUppercase: boolean;
}

const algorithms = [
    { name: 'SHA-1', digest: 'SHA-1' },
    { name: 'SHA-256', digest: 'SHA-256' },
    { name: 'SHA-384', digest: 'SHA-384' },
    { name: 'SHA-512', digest: 'SHA-512' },
];

const CopyButton: React.FC<{ text: string }> = ({ text }) => {
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
            title={t('common.copy') as string}
            className="p-2 bg-border-color dark:bg-d-border-color rounded-md text-text-secondary dark:text-d-text-secondary hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
        </button>
    );
};


const HashingTool: React.FC = () => {
    const { t } = useTranslation();
    const { state, setState } = useToolState<HashingToolState>('hashing-tool', {
        input: 'Hello World!',
        isUppercase: false,
    });
    const { input, isUppercase } = state;
    const [hashes, setHashes] = useState<Record<string, string>>({});

    const calculateHashes = useCallback(async (text: string) => {
        try {
            const encoder = new TextEncoder();
            const data = encoder.encode(text);

            const hashPromises = algorithms.map(async (algo) => {
                const hashBuffer = await crypto.subtle.digest(algo.digest, data);
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
                return { name: algo.name, hash: hashHex };
            });

            const results = await Promise.all(hashPromises);
            const newHashes = results.reduce((acc, { name, hash }) => {
                acc[name] = hash;
                return acc;
            }, {} as Record<string, string>);

            setHashes(newHashes);
        } catch (error) {
            console.error('Hashing error:', error);
        }
    }, []);

    useEffect(() => {
        const debounceTimeout = setTimeout(() => {
            calculateHashes(input);
        }, 200);

        return () => clearTimeout(debounceTimeout);
    }, [input, calculateHashes]);

    return (
        <div>
            <ToolHeader 
              title={t('tools.hashingTool.pageTitle')}
              description={t('tools.hashingTool.pageDescription')}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 flex flex-col">
                    <label htmlFor="hash-input" className="font-semibold mb-2 text-text-secondary dark:text-d-text-secondary">{t('tools.hashingTool.inputLabel')}</label>
                    <textarea
                        id="hash-input"
                        value={input}
                        onChange={(e) => setState(s => ({ ...s, input: e.target.value }))}
                        placeholder={t('tools.hashingTool.placeholder') as string}
                        className="w-full flex-grow p-4 bg-secondary dark:bg-d-secondary border border-border-color dark:border-d-border-color rounded-xl text-text-primary dark:text-d-text-primary focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-d-accent font-mono text-base resize-y shadow-sm"
                        style={{minHeight: '200px'}}
                    />
                </div>
                <div className="lg:col-span-1 flex flex-col">
                    <label htmlFor="hash-input" className="font-semibold mb-2 text-text-secondary dark:text-d-text-secondary">{t('tools.uuidGenerator.options')}</label>
                    <div
                        className="w-full flex-grow p-4 bg-secondary dark:bg-d-secondary border border-border-color dark:border-d-border-color rounded-xl text-text-primary dark:text-d-text-primary focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-d-accent font-mono text-base resize-y shadow-sm"
                    >
                        <div className="flex items-center justify-between">
                            <label htmlFor="uppercase-toggle" className="font-medium text-text-primary dark:text-d-text-primary">{t('tools.hashingTool.uppercase')}</label>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" id="uppercase-toggle" className="sr-only peer" checked={isUppercase} onChange={() => setState(s => ({ ...s, isUppercase: !s.isUppercase }))} />
                                <div className="w-11 h-6 bg-border-color peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-accent/50 rounded-full peer dark:bg-d-border-color peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-accent"></div>
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8">
                 <h3 className="text-xl font-bold text-text-primary dark:text-d-text-primary mb-4">{t('tools.hashingTool.outputLabel')}</h3>
                 <div className="p-4 bg-secondary dark:bg-d-secondary border border-border-color dark:border-d-border-color rounded-lg space-y-3">
                    {algorithms.map(algo => {
                        const hashValue = hashes[algo.name] || '';
                        const displayHash = isUppercase ? hashValue.toUpperCase() : hashValue;
                        return (
                            <div key={algo.name} className="p-3 bg-primary dark:bg-d-primary rounded-md flex items-center justify-between gap-4">
                                <span className="font-semibold text-text-secondary dark:text-d-text-secondary w-20">{algo.name}</span>
                                <code className="flex-1 font-mono text-sm text-accent dark:text-d-accent break-all">{displayHash}</code>
                                <CopyButton text={displayHash} />
                            </div>
                        );
                    })}
                 </div>
            </div>
        </div >
    );
};

export default HashingTool;
