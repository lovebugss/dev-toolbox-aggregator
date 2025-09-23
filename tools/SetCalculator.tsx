import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useToolState } from '../contexts/ToolStateContext';
import { useToasts } from '../contexts/ToastContext';
import { ToolHeader } from '../components/ui/ToolHeader';
import { CopyIcon } from '../components/icons/Icons';

type Operation = 'intersection' | 'union' | 'diffA' | 'diffB';

interface SetCalculatorState {
    inputA: string;
    inputB: string;
    operation: Operation;
}

const ResultCard: React.FC<{ title: string; data: Set<string>; }> = ({ title, data }) => {
    const { t } = useTranslation();
    const addToast = useToasts();
    const textData = useMemo(() => Array.from(data).join('\n'), [data]);

    const handleCopy = () => {
        if (!textData) return;
        navigator.clipboard.writeText(textData).then(() => {
            addToast(t('common.toast.copiedSuccess'), 'success');
        }, () => {
            addToast(t('common.toast.copiedFailed'), 'error');
        });
    };

    return (
        <div className="flex flex-col bg-secondary dark:bg-d-secondary rounded-lg border border-border-color dark:border-d-border-color h-full">
            <div className="flex justify-between items-center p-3 border-b border-border-color dark:border-d-border-color">
                <div>
                    <h3 className="font-semibold text-text-primary dark:text-d-text-primary">{title}</h3>
                    <p className="text-xs text-text-secondary dark:text-d-text-secondary">{t('tools.setCalculator.itemsCount', { count: data.size })}</p>
                </div>
                <button
                    onClick={handleCopy}
                    aria-label={t('common.copy')}
                    className="p-2 text-text-secondary dark:text-d-text-secondary hover:bg-primary dark:hover:bg-d-primary rounded-md transition-colors"
                >
                    <CopyIcon />
                </button>
            </div>
            <textarea
                readOnly
                value={textData}
                className="flex-grow p-3 bg-primary dark:bg-d-primary text-text-secondary dark:text-d-text-secondary font-mono text-sm resize-none focus:outline-none rounded-b-lg no-scrollbar"
            />
        </div>
    );
};

const OperationSelector: React.FC<{
    selected: Operation;
    onSelect: (op: Operation) => void;
}> = ({ selected, onSelect }) => {
    const { t } = useTranslation();
    const operations: { id: Operation, label: string }[] = [
        { id: 'intersection', label: t('tools.setCalculator.intersection') },
        { id: 'union', label: t('tools.setCalculator.union') },
        { id: 'diffA', label: t('tools.setCalculator.differenceA') },
        { id: 'diffB', label: t('tools.setCalculator.differenceB') },
    ];
    
    return (
        <div className="flex flex-wrap gap-2 bg-secondary dark:bg-d-secondary p-2 rounded-lg border border-border-color dark:border-d-border-color">
            {operations.map(op => (
                <button
                    key={op.id}
                    onClick={() => onSelect(op.id)}
                    aria-pressed={selected === op.id}
                    className={`flex-1 px-3 py-1.5 text-sm font-semibold rounded-md transition-colors whitespace-nowrap ${
                        selected === op.id
                            ? 'bg-primary dark:bg-d-primary text-accent dark:text-d-accent shadow'
                            : 'text-text-secondary dark:text-d-text-secondary hover:bg-primary/50 dark:hover:bg-d-primary/50'
                    }`}
                >
                    {op.label}
                </button>
            ))}
        </div>
    );
};

const SetCalculator: React.FC = () => {
    const { t } = useTranslation();
    const { state, setState } = useToolState<SetCalculatorState>('set-calculator', {
        inputA: 'apple\nbanana\norange\ngrape',
        inputB: 'banana\ngrape\nstrawberry\nblueberry',
        operation: 'intersection',
    });
    const { inputA, inputB, operation } = state;

    const sets = useMemo(() => {
        const process = (input: string): Set<string> =>
            new Set(input.split('\n').map(line => line.trim()).filter(Boolean));
        
        return {
            setA: process(inputA),
            setB: process(inputB),
        };
    }, [inputA, inputB]);

    const results = useMemo(() => {
        const { setA, setB } = sets;
        return {
            intersection: new Set([...setA].filter(item => setB.has(item))),
            union: new Set([...setA, ...setB]),
            diffA: new Set([...setA].filter(item => !setB.has(item))),
            diffB: new Set([...setB].filter(item => !setA.has(item))),
        };
    }, [sets]);

    const { displayData, displayTitle } = useMemo(() => {
        switch (operation) {
            case 'intersection': return { displayData: results.intersection, displayTitle: t('tools.setCalculator.intersection') };
            case 'union': return { displayData: results.union, displayTitle: t('tools.setCalculator.union') };
            case 'diffA': return { displayData: results.diffA, displayTitle: t('tools.setCalculator.differenceA') };
            case 'diffB': return { displayData: results.diffB, displayTitle: t('tools.setCalculator.differenceB') };
            default: return { displayData: new Set<string>(), displayTitle: '' };
        }
    }, [operation, results, t]);
    
    const setInputA = (value: string) => setState(s => ({...s, inputA: value}));
    const setInputB = (value: string) => setState(s => ({...s, inputB: value}));
    const setOperation = (op: Operation) => setState(s => ({...s, operation: op}));

    return (
        <div className="flex flex-col h-full">
            <ToolHeader
                title={t('tools.setCalculator.pageTitle')}
                description={t('tools.setCalculator.pageDescription')}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow min-h-0">
                {/* Inputs */}
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col">
                        <label htmlFor="set-a-input" className="font-semibold mb-2 text-text-secondary dark:text-d-text-secondary">{t('tools.setCalculator.setA')}</label>
                        <textarea
                            id="set-a-input"
                            value={inputA}
                            onChange={(e) => setInputA(e.target.value)}
                            className="flex-grow p-4 bg-secondary dark:bg-d-secondary border border-border-color dark:border-d-border-color rounded-lg text-text-primary dark:text-d-text-primary focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-d-accent font-mono text-sm resize-y min-h-[200px]"
                        />
                    </div>
                    <div className="flex flex-col">
                        <label htmlFor="set-b-input" className="font-semibold mb-2 text-text-secondary dark:text-d-text-secondary">{t('tools.setCalculator.setB')}</label>
                        <textarea
                            id="set-b-input"
                            value={inputB}
                            onChange={(e) => setInputB(e.target.value)}
                            className="flex-grow p-4 bg-secondary dark:bg-d-secondary border border-border-color dark:border-d-border-color rounded-lg text-text-primary dark:text-d-text-primary focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-d-accent font-mono text-sm resize-y min-h-[200px]"
                        />
                    </div>
                </div>

                {/* Controls and Output */}
                <div className="flex flex-col gap-4">
                    <div>
                        <h3 className="font-semibold mb-2 text-text-secondary dark:text-d-text-secondary">{t('tools.setCalculator.operation')}</h3>
                        <OperationSelector selected={operation} onSelect={setOperation} />
                    </div>
                    <div className="flex-grow min-h-[250px]">
                        <ResultCard title={displayTitle} data={displayData} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SetCalculator;