import React, { useState, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useToolState } from '../contexts/ToolStateContext';
import { ToolHeader } from '../components/ui/ToolHeader';

interface RegexState {
    pattern: string;
    flags: string;
    testString: string;
}

const CheatSheet: React.FC = () => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);

    const cheats = {
        [t('tools.regexEditor.cheatsheet.characters')]: [
            { char: '.', desc: t('tools.regexEditor.cheatsheet.anyChar') },
            { char: '\\d', desc: t('tools.regexEditor.cheatsheet.digit') },
            { char: '\\w', desc: t('tools.regexEditor.cheatsheet.wordChar') },
            { char: '\\s', desc: t('tools.regexEditor.cheatsheet.whitespace') },
            { char: '\\D', desc: t('tools.regexEditor.cheatsheet.notDigit') },
            { char: '\\W', desc: t('tools.regexEditor.cheatsheet.notWordChar') },
            { char: '\\S', desc: t('tools.regexEditor.cheatsheet.notWhitespace') },
        ],
        [t('tools.regexEditor.cheatsheet.anchors')]: [
            { char: '^', desc: t('tools.regexEditor.cheatsheet.startOfString') },
            { char: '$', desc: t('tools.regexEditor.cheatsheet.endOfString') },
            { char: '\\b', desc: t('tools.regexEditor.cheatsheet.wordBoundary') },
            { char: '\\B', desc: t('tools.regexEditor.cheatsheet.notWordBoundary') },
        ],
        [t('tools.regexEditor.cheatsheet.quantifiers')]: [
            { char: '*', desc: t('tools.regexEditor.cheatsheet.zeroOrMore') },
            { char: '+', desc: t('tools.regexEditor.cheatsheet.oneOrMore') },
            { char: '?', desc: t('tools.regexEditor.cheatsheet.zeroOrOne') },
            { char: '{n}', desc: t('tools.regexEditor.cheatsheet.exactN') },
            { char: '{n,}', desc: t('tools.regexEditor.cheatsheet.nOrMore') },
            { char: '{n,m}', desc: t('tools.regexEditor.cheatsheet.nToM') },
        ],
        [t('tools.regexEditor.cheatsheet.groups')]: [
            { char: '(...)', desc: t('tools.regexEditor.cheatsheet.captureGroup') },
            { char: '[...]', desc: t('tools.regexEditor.cheatsheet.characterSet') },
            { char: '[^...]', desc: t('tools.regexEditor.cheatsheet.negatedSet') },
            { char: '|', desc: t('tools.regexEditor.cheatsheet.alternation') },
        ]
    };

    return (
        <div className="bg-secondary dark:bg-slate-900/50 border border-border-color dark:border-white/10 rounded-2xl overflow-hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full p-4 text-left font-bold flex justify-between items-center text-text-primary dark:text-d-text-primary transition-colors hover:bg-white/5" aria-label={t('common.tooltips.toggleCheatsheet')} aria-expanded={isOpen}>
                <span className="text-xs uppercase tracking-widest">{t('tools.regexEditor.cheatsheet.title')}</span>
                <svg className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
            </button>
            {isOpen && (
                <div className="p-6 border-t border-border-color dark:border-white/10 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 text-sm">
                    {Object.entries(cheats).map(([category, items]) => (
                        <div key={category}>
                            <h4 className="font-black mb-3 text-text-primary dark:text-d-text-primary uppercase tracking-tighter opacity-50">{category}</h4>
                            <ul className="space-y-2">
                                {items.map(({ char, desc }) => (
                                    <li key={char} className="flex">
                                        <code className="w-20 font-mono text-accent dark:text-indigo-400 font-bold">{char}</code>
                                        <span className="text-text-secondary dark:text-d-text-secondary/70">{desc}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const RegexEditor: React.FC = () => {
    const { t } = useTranslation();
    const { state, setState } = useToolState<RegexState>('regex-editor', {
        pattern: '\\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}\\b',
        flags: 'gi',
        testString: 'Contact us at support@example.com or for sales, sales.info@example.co.uk. Invalid: user@.com',
    });
    const { pattern, flags, testString } = state;

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const highlighterRef = useRef<HTMLDivElement>(null);

    const { matches, error, highlightedText } = useMemo(() => {
        if (!pattern) {
            return { matches: [], error: null, highlightedText: <>{testString}</> };
        }
        try {
            const regex = new RegExp(pattern, flags);
            const foundMatches = [...testString.matchAll(regex)];
            
            let lastIndex = 0;
            const segments: React.ReactNode[] = [];
            foundMatches.forEach((match, i) => {
                if (match.index > lastIndex) {
                    segments.push(testString.substring(lastIndex, match.index));
                }
                segments.push(<mark key={i} className="bg-accent/20 dark:bg-indigo-500/40 text-inherit rounded px-0.5 border-b-2 border-accent dark:border-indigo-400">{match[0]}</mark>);
                lastIndex = match.index + match[0].length;
            });
            if (lastIndex < testString.length) {
                segments.push(testString.substring(lastIndex));
            }

            return { matches: foundMatches, error: null, highlightedText: <>{segments}</> };
        } catch (e: any) {
            return { matches: [], error: e.message, highlightedText: <>{testString}</> };
        }
    }, [pattern, flags, testString]);
    
    const set = (key: keyof RegexState) => (value: string) => setState(s => ({ ...s, [key]: value }));

    const handleScroll = () => {
        if (textareaRef.current && highlighterRef.current) {
            highlighterRef.current.scrollTop = textareaRef.current.scrollTop;
            highlighterRef.current.scrollLeft = textareaRef.current.scrollLeft;
        }
    };

    return (
        <div>
            <ToolHeader 
              title={t('tools.regexEditor.pageTitle')}
              description={t('tools.regexEditor.pageDescription')}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="md:col-span-3">
                    <label htmlFor="regex-pattern" className="block text-[10px] font-bold uppercase tracking-widest text-text-secondary dark:text-d-text-secondary/70 mb-2 px-1">{t('tools.regexEditor.patternLabel')}</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary/40 font-mono">/</span>
                        <input
                            id="regex-pattern"
                            type="text"
                            value={pattern}
                            onChange={(e) => set('pattern')(e.target.value)}
                            className={`w-full p-3 pl-6 pr-6 font-mono bg-secondary dark:bg-slate-900 border ${error ? 'border-red-500' : 'border-border-color dark:border-white/10'} rounded-xl text-text-primary dark:text-d-text-primary focus:outline-none focus:ring-2 ${error ? 'focus:ring-red-500/50' : 'focus:ring-accent dark:focus:ring-indigo-500/50'} transition-all`}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary/40 font-mono">/</span>
                    </div>
                </div>
                <div>
                    <label htmlFor="regex-flags" className="block text-[10px] font-bold uppercase tracking-widest text-text-secondary dark:text-d-text-secondary/70 mb-2 px-1">{t('tools.regexEditor.flagsLabel')}</label>
                    <input
                        id="regex-flags"
                        type="text"
                        value={flags}
                        onChange={(e) => set('flags')(e.target.value)}
                        className="w-full p-3 font-mono bg-secondary dark:bg-slate-900 border border-border-color dark:border-white/10 rounded-xl text-text-primary dark:text-d-text-primary focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-indigo-500/50 transition-all"
                    />
                </div>
            </div>
             {error && <div className="p-3 mb-6 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs font-mono">{t('tools.regexEditor.invalidRegex')}: {error}</div>}

            <div className="mb-8">
                <label htmlFor="test-string" className="block text-[10px] font-bold uppercase tracking-widest text-text-secondary dark:text-d-text-secondary/70 mb-2 px-1">{t('tools.regexEditor.testStringLabel')}</label>
                <div className="relative glass-panel rounded-2xl border-white/10 overflow-hidden min-h-[200px]">
                    <textarea
                        ref={textareaRef}
                        id="test-string"
                        value={testString}
                        onChange={(e) => set('testString')(e.target.value)}
                        onScroll={handleScroll}
                        className="w-full h-48 p-4 font-mono bg-transparent border-none text-transparent caret-text-primary dark:caret-d-text-primary focus:outline-none focus:ring-0 resize-y relative z-10"
                        spellCheck="false"
                    />
                    <div 
                        ref={highlighterRef}
                        className="absolute inset-0 p-4 font-mono whitespace-pre-wrap pointer-events-none overflow-auto no-scrollbar text-text-primary dark:text-d-text-primary leading-normal"
                    >
                        {highlightedText}
                    </div>
                </div>
            </div>

            <div className="mb-10">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-text-primary dark:text-d-text-primary mb-4 flex items-center gap-3">
                    {t('tools.regexEditor.matchesLabel')} 
                    <span className="bg-accent/10 dark:bg-white/10 text-accent dark:text-indigo-400 px-2 py-0.5 rounded-full text-[10px]">{matches.length}</span>
                </h3>
                {matches.length > 0 ? (
                    <div aria-live="polite" aria-atomic="true" className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {matches.map((match, i) => (
                            <div key={i} className="p-4 bg-secondary dark:bg-slate-900 border border-border-color dark:border-white/5 rounded-2xl shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-[10px] font-black text-accent dark:text-indigo-400 uppercase tracking-widest">{t('tools.regexEditor.match')} {i + 1}</span>
                                    <span className="text-[10px] text-text-secondary dark:text-d-text-secondary/50 font-mono">{t('tools.regexEditor.index')}: {match.index}</span>
                                </div>
                                <code className="block bg-black/5 dark:bg-white/5 rounded-lg p-2.5 text-sm text-text-primary dark:text-d-text-primary break-all font-mono border border-transparent dark:border-white/5">{match[0]}</code>
                                {match.length > 1 && (
                                    <div className="mt-3 space-y-1">
                                        {match.slice(1).map((group, j) => (
                                            <div key={j} className="flex gap-2 items-baseline text-xs">
                                                <span className="opacity-40 shrink-0 font-bold">{t('tools.regexEditor.group')} {j + 1}:</span>
                                                <code className="text-text-secondary dark:text-d-text-secondary break-all">{group || 'null'}</code>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-8 text-center bg-black/5 dark:bg-white/5 rounded-2xl border border-dashed border-white/10">
                        <p className="text-text-secondary dark:text-d-text-secondary/40 italic text-sm">{t('tools.regexEditor.noMatches')}</p>
                    </div>
                )}
            </div>
            
            <CheatSheet />
        </div>
    );
};

export default RegexEditor;
