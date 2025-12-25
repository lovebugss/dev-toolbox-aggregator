import React, { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { create, type Delta } from 'jsondiffpatch';
import { diffLines, diffWords } from 'diff';
import { CodeIcon } from '../components/icons/Icons';
import { useToolState } from '../contexts/ToolStateContext';
import { ToolHeader } from '../components/ui/ToolHeader';

// --- TYPES & STATE ---
interface DiffCheckerState {
    activeTab: 'json' | 'text';
    jsonA: string;
    jsonB: string;
    textA: string;
    textB: string;
}

// --- HELPERS ---

/**
 * 宽松的 JSON 解析器
 * 支持未加引号的键、单引号、尾随逗号和注释
 */
const laxParse = (str: string): any => {
    const trimmed = str.trim();
    if (!trimmed) return null;
    try {
        return JSON.parse(trimmed);
    } catch (e) {
        try {
            // 使用 Function 构造器处理 JS 对象字面量格式
            const fn = new Function(`"use strict"; return (${trimmed});`);
            return fn();
        } catch (laxError: any) {
            throw new Error(laxError.message);
        }
    }
};

const getLines = (text: string) => text.split('\n').filter((line, index, arr) => index < arr.length - 1 || line !== '');

// --- SUB-COMPONENTS (Defined outside to prevent focus loss) ---

const JsonInput: React.FC<{ 
    id: string; 
    label: string; 
    value: string; 
    onChange: (v: string) => void; 
    error: string | null;
}> = ({ id, label, value, onChange, error }) => (
    <div className="flex flex-col flex-grow">
        <label htmlFor={id} className="font-semibold mb-2 text-text-secondary dark:text-d-text-secondary">{label}</label>
        <textarea
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="flex-grow p-4 bg-secondary dark:bg-d-secondary border border-border-color dark:border-d-border-color rounded-lg text-text-primary dark:text-d-text-primary focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-d-accent font-mono text-sm resize-none"
            spellCheck="false"
        />
        {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
);

const WordDiff: React.FC<{ oldText: string; newText: string; }> = ({ oldText, newText }) => {
    const wordsDiff = diffWords(oldText, newText);
    return (
        <>
            <div className="flex-1 pr-2 bg-red-500/10">
                {wordsDiff.map((part, index) => !part.added && (
                    <span key={index} className={part.removed ? 'bg-red-500/20 rounded' : ''}>{part.value}</span>
                ))}
            </div>
            <div className="flex-1 pl-2 bg-green-500/10">
                {wordsDiff.map((part, index) => !part.removed && (
                    <span key={index} className={part.added ? 'bg-green-500/20 rounded' : ''}>{part.value}</span>
                ))}
            </div>
        </>
    );
};

const TabButton: React.FC<{ 
    active: boolean; 
    onClick: () => void; 
    children: React.ReactNode 
}> = ({ active, onClick, children }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors focus:outline-none ${
            active
                ? 'bg-secondary dark:bg-d-secondary border-x border-t border-border-color dark:border-d-border-color text-accent dark:text-d-accent'
                : 'text-text-secondary dark:text-d-text-secondary hover:bg-secondary/50 dark:hover:bg-d-secondary/50'
        }`}
    >
        {children}
    </button>
);

// --- JSON Diff View ---
const JsonDiffView: React.FC = () => {
    const { t } = useTranslation();
    const { state, setState } = useToolState<DiffCheckerState>('diff-checker', {
        activeTab: 'json', jsonA: '', jsonB: '', textA: '', textB: '',
    });
    const { jsonA, jsonB } = state;
    
    const [diffHtml, setDiffHtml] = useState<string | null>(null);
    const [errors, setErrors] = useState<{ a: string | null; b: string | null }>({ a: null, b: null });

    const differ = useMemo(() => create({
        objectHash: (obj: any, index: number) => obj.id || obj._id || `$$index:${index}`,
    }), []);
    
    const setJsonA = (value: string) => setState(s => ({ ...s, jsonA: value }));
    const setJsonB = (value: string) => setState(s => ({ ...s, jsonB: value }));

    const handleCompare = useCallback(() => {
        setDiffHtml(null);
        setErrors({ a: null, b: null });

        let parsedA, parsedB;
        try {
            parsedA = laxParse(jsonA);
        } catch (e: any) {
            setErrors(prev => ({ ...prev, a: t('tools.diffChecker.json.errorInvalidA', { message: e.message }) }));
            return;
        }
        try {
            parsedB = laxParse(jsonB);
        } catch (e: any) {
            setErrors(prev => ({ ...prev, b: t('tools.diffChecker.json.errorInvalidB', { message: e.message }) }));
            return;
        }

        const delta: Delta | undefined = differ.diff(parsedA, parsedB);
        
        if (delta) {
            try {
                // @ts-ignore
                const html = (differ as any).formatters.html.format(delta, parsedA);
                setDiffHtml(html);
            } catch (error) {
                const diffText = JSON.stringify(delta, null, 2);
                setDiffHtml(`<pre>${diffText}</pre>`);
            }
        } else {
            setDiffHtml(''); 
        }
    }, [jsonA, jsonB, t, differ]);

    const diffResultContent = useMemo(() => {
        if (diffHtml === null) {
            return <div className="text-text-secondary dark:text-d-text-secondary p-4">{t('tools.diffChecker.pageDescription')}</div>;
        }
        if (diffHtml === '') {
            return <div className="p-4 text-center text-text-secondary dark:text-d-text-secondary">{t('tools.diffChecker.json.noDifferences')}</div>;
        }
        return <div className="diff-html-container" dangerouslySetInnerHTML={{ __html: diffHtml }} />;
    }, [diffHtml, t]);

    return (
        <div className="flex flex-col h-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow min-h-0">
                <JsonInput id="json-a-input" label={t('tools.diffChecker.json.jsonA')} value={jsonA} onChange={setJsonA} error={errors.a} />
                <JsonInput id="json-b-input" label={t('tools.diffChecker.json.jsonB')} value={jsonB} onChange={setJsonB} error={errors.b} />
            </div>
            <div className="mt-6">
                <button
                    onClick={handleCompare}
                    className="px-6 py-2 bg-accent dark:bg-d-accent text-white dark:text-d-primary font-semibold rounded-lg hover:opacity-90 transition-colors duration-200 shadow-md"
                >
                    {t('tools.diffChecker.json.compareButton')}
                </button>
            </div>
            <section className="mt-6 flex-shrink-0">
                <h3 className="text-xl font-bold text-text-primary dark:text-d-text-primary mb-2">{t('tools.diffChecker.json.diffOutput')}</h3>
                <div className="p-4 bg-secondary dark:bg-d-secondary border border-border-color dark:border-d-border-color rounded-lg font-mono text-sm overflow-auto max-h-[40vh] min-h-[20vh]">
                    {diffResultContent}
                </div>
            </section>
        </div>
    );
};

// --- Text Diff View ---
const TextDiffView: React.FC = () => {
    const { t } = useTranslation();
    const { state, setState } = useToolState<DiffCheckerState>('diff-checker', {
        activeTab: 'text', jsonA: '', jsonB: '', textA: '', textB: '',
    });
    const { textA, textB } = state;
    const [viewMode, setViewMode] = useState<'split' | 'unified'>('split');
    
    const setTextA = (value: string) => setState(s => ({...s, textA: value}));
    const setTextB = (value: string) => setState(s => ({...s, textB: value}));

    const diffData = useMemo(() => diffLines(textA, textB), [textA, textB]);
    const hasDifferences = diffData.length > 1 || (diffData.length === 1 && (diffData[0].added || diffData[0].removed));
    
    return (
        <div className="flex flex-col h-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow min-h-0">
                <div className="flex flex-col">
                    <label htmlFor="text-a-input" className="font-semibold mb-2 text-text-secondary dark:text-d-text-secondary">{t('tools.diffChecker.text.originalText')}</label>
                    <textarea id="text-a-input" value={textA} onChange={(e) => setTextA(e.target.value)} className="flex-grow p-4 bg-secondary dark:bg-d-secondary border border-border-color dark:border-d-border-color rounded-lg text-text-primary dark:text-d-text-primary focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-d-accent font-mono text-sm resize-none" spellCheck="false" />
                </div>
                <div className="flex flex-col">
                    <label htmlFor="text-b-input" className="font-semibold mb-2 text-text-secondary dark:text-d-text-secondary">{t('tools.diffChecker.text.changedText')}</label>
                    <textarea id="text-b-input" value={textB} onChange={(e) => setTextB(e.target.value)} className="flex-grow p-4 bg-secondary dark:bg-d-secondary border border-border-color dark:border-d-border-color rounded-lg text-text-primary dark:text-d-text-primary focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-d-accent font-mono text-sm resize-none" spellCheck="false" />
                </div>
            </div>
            
            <div className="mt-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-text-primary dark:text-d-text-primary">{t('tools.diffChecker.text.diffOutput')}</h3>
                    <div className="flex items-center bg-secondary dark:bg-d-secondary p-1 rounded-lg border border-border-color dark:border-d-border-color">
                        <button onClick={() => setViewMode('split')} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${viewMode === 'split' ? 'bg-primary dark:bg-d-primary text-accent dark:text-d-accent shadow' : 'text-text-secondary dark:text-d-text-secondary hover:bg-primary/50 dark:hover:bg-d-primary/50'}`}>{t('tools.diffChecker.text.viewSplit')}</button>
                        <button onClick={() => setViewMode('unified')} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${viewMode === 'unified' ? 'bg-primary dark:bg-d-primary text-accent dark:text-d-accent shadow' : 'text-text-secondary dark:text-d-text-secondary hover:bg-primary/50 dark:hover:bg-d-primary/50'}`}>{t('tools.diffChecker.text.viewUnified')}</button>
                    </div>
                </div>
                <div className="p-4 bg-secondary dark:bg-d-secondary border border-border-color dark:border-d-border-color rounded-lg font-mono text-sm overflow-auto max-h-96 whitespace-pre-wrap break-words">
                    {!hasDifferences ? (
                        <div className="flex flex-col items-center justify-center p-8 text-text-secondary dark:text-d-text-secondary">
                            <CodeIcon className="w-12 h-12 mb-4" />
                            <p className="text-lg font-semibold">{t('tools.diffChecker.text.noDifferences')}</p>
                        </div>
                    ) : viewMode === 'unified' ? (
                        <pre>{diffData.map((part, index) => {
                            const style = part.added ? 'bg-green-500/10 text-green-800 dark:text-green-300' : part.removed ? 'bg-red-500/10 text-red-800 dark:text-red-300' : 'text-text-secondary dark:text-d-text-secondary';
                            const prefix = part.added ? '+' : part.removed ? '-' : ' ';
                            return <div key={index} className={`${style} flex`}><span className="w-6 text-center select-none">{prefix}</span><span className="flex-1">{part.value}</span></div>;
                        })}</pre>
                    ) : (
                        <div>{(() => {
                            const rows: React.ReactNode[] = []; let leftLine = 1; let rightLine = 1;
                            for (let i = 0; i < diffData.length; i++) {
                                const part = diffData[i]; const nextPart = diffData[i + 1];
                                if (part.removed && nextPart?.added) {
                                    const removedLines = getLines(part.value); const addedLines = getLines(nextPart.value); const maxLen = Math.max(removedLines.length, addedLines.length);
                                    for(let j=0; j<maxLen; j++) { rows.push(<div key={`c-${i}-${j}`} className="flex"><span className="w-8 text-right pr-2 select-none text-text-secondary dark:text-d-text-secondary">{removedLines[j] !== undefined ? leftLine++ : ''}</span><span className="w-8 text-right pr-2 select-none text-text-secondary dark:text-d-text-secondary">{addedLines[j] !== undefined ? rightLine++ : ''}</span><WordDiff oldText={removedLines[j] || ''} newText={addedLines[j] || ''} /></div>) }
                                    i++; 
                                } else if (part.removed) {
                                    getLines(part.value).forEach((line, lineIndex) => rows.push(<div key={`r-${i}-${lineIndex}`} className="flex bg-red-500/10"><span className="w-8 text-right pr-2 select-none text-text-secondary dark:text-d-text-secondary">{leftLine++}</span><span className="w-8 select-none"></span><div className="flex-1 pr-2">{line}</div><div className="flex-1 pl-2"></div></div>));
                                } else if (part.added) {
                                    getLines(part.value).forEach((line, lineIndex) => rows.push(<div key={`a-${i}-${lineIndex}`} className="flex bg-green-500/10"><span className="w-8 select-none"></span><span className="w-8 text-right pr-2 select-none text-text-secondary dark:text-d-text-secondary">{rightLine++}</span><div className="flex-1 pr-2"></div><div className="flex-1 pl-2">{line}</div></div>));
                                } else {
                                    getLines(part.value).forEach((line, lineIndex) => rows.push(<div key={`u-${i}-${lineIndex}`} className="flex hover:bg-black/5 dark:hover:bg-white/5"><span className="w-8 text-right pr-2 select-none text-text-secondary dark:text-d-text-secondary">{leftLine++}</span><span className="w-8 text-right pr-2 select-none text-text-secondary dark:text-d-text-secondary">{rightLine++}</span><div className="flex-1 pr-2 text-text-secondary dark:text-d-text-secondary">{line}</div><div className="flex-1 pl-2 text-text-secondary dark:text-d-text-secondary border-l border-border-color dark:border-d-border-color">{line}</div></div>));
                                }
                            }
                            return rows;
                        })()}</div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Main DiffChecker Component ---
const DiffChecker: React.FC = () => {
    const { t } = useTranslation();
    const { state, setState } = useToolState<DiffCheckerState>('diff-checker', {
        activeTab: 'json',
        jsonA: '', jsonB: '', textA: '', textB: '',
    });
    const { activeTab } = state;
    
    const setActiveTab = (tab: 'json' | 'text') => setState(s => ({ ...s, activeTab: tab }));

    return (
        <div className="flex flex-col h-full">
            <ToolHeader 
              title={t('tools.diffChecker.pageTitle')}
              description={t('tools.diffChecker.pageDescription')}
            />

            <div className="flex border-b border-border-color dark:border-d-border-color -mb-px">
                <TabButton active={activeTab === 'json'} onClick={() => setActiveTab('json')}>{t('tools.diffChecker.jsonDiffTab')}</TabButton>
                <TabButton active={activeTab === 'text'} onClick={() => setActiveTab('text')}>{t('tools.diffChecker.textDiffTab')}</TabButton>
            </div>

            <div className="flex-grow min-h-0 pt-6 bg-secondary dark:bg-d-secondary p-6 rounded-b-lg rounded-tr-lg border-x border-b border-border-color dark:border-d-border-color">
                {activeTab === 'json' ? <JsonDiffView /> : <TextDiffView />}
            </div>
        </div>
    );
};

export default DiffChecker;