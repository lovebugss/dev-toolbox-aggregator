import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useToolState } from '../contexts/ToolStateContext';
import { ToolHeader } from '../components/ui/ToolHeader';

interface TextCounterState {
    text: string;
}

const TextCounter: React.FC = () => {
    const { t } = useTranslation();
    const { state, setState } = useToolState<TextCounterState>('text-counter', {
        text: ''
    });
    const { text } = state;

    const stats = useMemo(() => {
        const trimmedText = text.trim();
        const characters = text.length;
        const words = trimmedText ? trimmedText.split(/\s+/).length : 0;
        const lines = text ? text.split('\n').length : 0;
        const paragraphs = trimmedText ? trimmedText.split(/\n+/).filter(p => p.trim() !== '').length : 0;
        
        return { characters, words, lines, paragraphs };
    }, [text]);

    const statCards = [
        { label: t('tools.textCounter.characters'), value: stats.characters },
        { label: t('tools.textCounter.words'), value: stats.words },
        { label: t('tools.textCounter.lines'), value: stats.lines },
        { label: t('tools.textCounter.paragraphs'), value: stats.paragraphs },
    ];

    return (
        <div>
            <ToolHeader 
              title={t('tools.textCounter.pageTitle')}
              description={t('tools.textCounter.pageDescription')}
            />
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                {statCards.map(stat => (
                    <div key={stat.label} className="p-6 bg-secondary dark:bg-d-secondary ring-1 ring-inset ring-border-color dark:ring-d-border-color rounded-xl text-center shadow-sm">
                        <p className="text-base text-text-secondary dark:text-d-text-secondary">{stat.label}</p>
                        <p className="text-4xl font-bold text-accent dark:text-d-accent mt-1">{stat.value}</p>
                    </div>
                ))}
            </div>
            
            <textarea
                value={text}
                onChange={(e) => setState({ text: e.target.value })}
                placeholder={t('tools.textCounter.placeholder') as string}
                aria-label={t('tools.textCounter.pageTitle')}
                className="w-full h-96 p-4 bg-secondary dark:bg-d-secondary border-none ring-1 ring-inset ring-border-color dark:ring-d-border-color rounded-xl text-text-primary dark:text-d-text-primary focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-d-accent text-base resize-y shadow-sm"
            />
        </div>
    );
};

export default TextCounter;