import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useToolState } from '../contexts/ToolStateContext';
import { useToasts } from '../contexts/ToastContext';
import { ToolHeader } from '../components/ui/ToolHeader';

interface UuidGeneratorState {
    isUppercase: boolean;
    removeHyphens: boolean;
    count: number;
}

const UuidGenerator: React.FC = () => {
    const { t } = useTranslation();
    const addToast = useToasts();
    const { state, setState } = useToolState<UuidGeneratorState>('uuid-generator', {
        isUppercase: false,
        removeHyphens: false,
        count: 5,
    });
    const { isUppercase, removeHyphens, count } = state;

    const [uuids, setUuids] = useState<string>('');

    const generateUuids = useCallback(() => {
        let generated: string[] = [];
        for (let i = 0; i < count; i++) {
            let uuid: string = crypto.randomUUID();
            if (isUppercase) {
                uuid = uuid.toUpperCase();
            }
            if (removeHyphens) {
                uuid = uuid.replace(/-/g, '');
            }
            generated.push(uuid);
        }
        setUuids(generated.join('\n'));
    }, [count, isUppercase, removeHyphens]);

    useEffect(() => {
        generateUuids();
    }, [generateUuids]);

    const handleCopy = () => {
        if (!uuids) return;
        navigator.clipboard.writeText(uuids).then(() => {
            addToast(t('common.toast.copiedSuccess'), 'success');
        }, () => {
            addToast(t('common.toast.copiedFailed'), 'error');
        });
    };

    const handleCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value, 10);
        setState(s => ({ ...s, count: value > 0 && value <= 1000 ? value : 1 }));
    }
    
    const handleToggle = (key: 'isUppercase' | 'removeHyphens') => {
        setState(s => ({ ...s, [key]: !s[key] }));
    }

    return (
        <div>
            <ToolHeader
                title={t('tools.uuidGenerator.pageTitle')}
                description={t('tools.uuidGenerator.pageDescription')}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 flex flex-col">
                    <div className="flex justify-between items-center mb-2">
                        <label htmlFor="uuid-output" className="font-semibold text-text-secondary dark:text-d-text-secondary">{t('tools.uuidGenerator.generatedUuids')}</label>
                        <button
                            onClick={handleCopy}
                            className="px-4 py-1 text-sm bg-border-color dark:bg-d-border-color text-text-primary dark:text-d-text-primary font-semibold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            title={t('common.tooltips.copyOutput')}
                        >
                            {t('common.copy')}
                        </button>
                    </div>
                    <textarea
                        id="uuid-output"
                        value={uuids}
                        readOnly
                        className="flex-grow p-4 bg-secondary dark:bg-d-secondary border border-border-color dark:border-d-border-color rounded-lg text-text-primary dark:text-d-text-primary focus:outline-none font-mono text-sm resize-none h-80"
                    />
                </div>
                <div className="md:col-span-1 flex flex-col">
                    <div className="flex justify-between items-center mb-2">
                        <label htmlFor="uuid-output" className="font-semibold text-text-secondary dark:text-d-text-secondary">{t('tools.uuidGenerator.options')}</label>
                    </div>
                    <div
                        className="flex-grow p-4 bg-secondary dark:bg-d-secondary border border-border-color dark:border-d-border-color rounded-lg text-text-primary dark:text-d-text-primary focus:outline-none font-mono text-sm resize-none h-80 space-y-4"
                    >
                     <div className="flex items-center justify-between">
                            <label htmlFor="uppercase-toggle" className="text-sm font-medium text-text-primary dark:text-d-text-primary">{t('tools.uuidGenerator.uppercase')}</label>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" id="uppercase-toggle" className="sr-only peer" checked={isUppercase} onChange={() => handleToggle('isUppercase')} />
                                <div className="w-11 h-6 bg-border-color peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-d-border-color peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-accent"></div>
                            </label>
                        </div>
                        <div className="flex items-center justify-between">
                            <label htmlFor="hyphens-toggle" className="text-sm font-medium text-text-primary dark:text-d-text-primary">{t('tools.uuidGenerator.removeHyphens')}</label>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" id="hyphens-toggle" className="sr-only peer" checked={removeHyphens} onChange={() => handleToggle('removeHyphens')} />
                                <div className="w-11 h-6 bg-border-color peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-d-border-color peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-accent"></div>
                            </label>
                        </div>
                        <div>
                            <label htmlFor="bulk-count" className="block text-sm font-medium text-text-primary dark:text-d-text-primary mb-2">{t('tools.uuidGenerator.howMany')}</label>
                            <input
                                id="bulk-count"
                                type="number"
                                min="1"
                                max="1000"
                                value={count}
                                onChange={handleCountChange}
                                className="w-full p-2 bg-primary dark:bg-d-primary border border-border-color dark:border-d-border-color rounded-md text-text-primary dark:text-d-text-primary focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-d-accent"
                            />
                        </div>
                        <button
                            onClick={generateUuids}
                            className="w-full px-6 py-2 bg-accent dark:bg-d-accent text-white dark:text-d-primary font-semibold rounded-lg hover:opacity-90 transition-colors duration-200 shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent dark:focus-visible:ring-d-accent"
                            title={t('common.tooltips.generateUuids')}
                        >
                            {t('tools.uuidGenerator.generate')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UuidGenerator;