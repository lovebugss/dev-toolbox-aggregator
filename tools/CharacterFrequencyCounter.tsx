import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useToolState } from '../contexts/ToolStateContext';
import { ToolHeader } from '../components/ui/ToolHeader';

interface CharFreqState {
    text: string;
}

const CharacterFrequencyCounter: React.FC = () => {
    const { t } = useTranslation();
    const { state, setState } = useToolState<CharFreqState>('character-frequency-counter', {
        text: 'Hello World! This is a test string for character frequency counting.',
    });
    const { text } = state;

    const frequency = useMemo(() => {
        const freqMap = new Map<string, number>();
        for (const char of text) {
            freqMap.set(char, (freqMap.get(char) || 0) + 1);
        }
        return Array.from(freqMap.entries())
            .sort((a, b) => b[1] - a[1]);
    }, [text]);

    return (
        <div>
            <ToolHeader 
              title={t('tools.characterFrequencyCounter.pageTitle')}
              description={t('tools.characterFrequencyCounter.pageDescription')}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <textarea
                    value={text}
                    onChange={(e) => setState({ text: e.target.value })}
                    placeholder={t('tools.characterFrequencyCounter.placeholder') as string}
                    className="w-full h-96 p-4 bg-secondary dark:bg-d-secondary border-none ring-1 ring-inset ring-border-color dark:ring-d-border-color rounded-xl text-text-primary dark:text-d-text-primary focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-d-accent text-base resize-y shadow-sm"
                />
                <div className="bg-secondary dark:bg-d-secondary p-4 rounded-xl shadow-sm h-96 overflow-y-auto">
                    <h3 className="font-semibold mb-4 text-text-secondary dark:text-d-text-secondary">{t('tools.characterFrequencyCounter.resultsTitle')}</h3>
                    {frequency.length > 0 ? (
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-text-secondary dark:text-d-text-secondary uppercase bg-primary dark:bg-d-primary">
                                <tr>
                                    <th className="px-4 py-2">{t('tools.characterFrequencyCounter.character')}</th>
                                    <th className="px-4 py-2">{t('tools.characterFrequencyCounter.frequency')}</th>
                                    <th className="px-4 py-2">{t('tools.characterFrequencyCounter.percentage')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {frequency.map(([char, count]) => (
                                    <tr key={char} className="border-b border-border-color dark:border-d-border-color">
                                        <td className="px-4 py-2 font-mono text-accent dark:text-d-accent">{char === ' ' ? `"${char}" (space)` : char}</td>
                                        <td className="px-4 py-2">{count}</td>
                                        <td className="px-4 py-2">{text.length > 0 ? ((count / text.length) * 100).toFixed(2) : 0}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="text-text-secondary dark:text-d-text-secondary text-center py-8">{t('tools.characterFrequencyCounter.noText')}</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CharacterFrequencyCounter;
