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
        <div className="bg-secondary dark:bg-d-secondary border border-border-color dark:border-d-border-color rounded-lg">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full p-3 text-left font-semibold flex justify-between items-center" aria-label={t('common.tooltips.toggleCheatsheet')} aria-expanded={isOpen}>
                {t('tools.regexEditor.cheatsheet.title')}
                <svg className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </button>
            {isOpen && (
                <div className="p-4 border-t border-border-color dark:border-d-border-color grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                    {Object.entries(cheats).map(([category, items]) => (
                        <div key={category}>
                            <h4 className="font-bold mb-2 text-text-primary dark:text-d-text-primary">{category}</h4>
                            <ul className="space-y-1">
                                {items.map(({ char, desc }) => (
                                    <li key={char} className="flex">
                                        <code className="w-20 font-mono text-accent dark:text-d-accent">{char}</code>
                                        <span className="text-text-secondary dark:text-d-text-secondary">{desc}</span>
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
                segments.push(<mark key={i} className="bg-accent/30 dark:bg-d-accent/30 rounded">{match[0]}</mark>);
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
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="md:col-span-3">
                    <label htmlFor="regex-pattern" className="block text-sm font-medium text-text-secondary dark:text-d-text-secondary mb-1">{t('tools.regexEditor.patternLabel')}</label>
                    <input
                        id="regex-pattern"
                        type="text"
                        value={pattern}
                        onChange={(e) => set('pattern')(e.target.value)}
                        className={`w-full p-2 font-mono bg-secondary dark:bg-d-secondary border ${error ? 'border-red-500' : 'border-border-color dark:border-d-border-color'} rounded-md focus:outline-none focus:ring-2 ${error ? 'focus:ring-red-500' : 'focus:ring-accent dark:focus:ring-d-accent'}`}
                    />
                </div>
                <div>
                    <label htmlFor="regex-flags" className="block text-sm font-medium text-text-secondary dark:text-d-text-secondary mb-1">{t('tools.regexEditor.flagsLabel')}</label>
                    <input
                        id="regex-flags"
                        type="text"
                        value={flags}
                        onChange={(e) => set('flags')(e.target.value)}
                        className="w-full p-2 font-mono bg-secondary dark:bg-d-secondary border border-border-color dark:border-d-border-color rounded-md focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-d-accent"
                    />
                </div>
            </div>
             {error && <div className="p-2 mb-4 bg-red-900/50 border border-red-700 text-red-300 rounded-md text-sm">{t('tools.regexEditor.invalidRegex')}: {error}</div>}

            <div className="mb-6">
                <label htmlFor="test-string" className="block text-sm font-medium text-text-secondary dark:text-d-text-secondary mb-1">{t('tools.regexEditor.testStringLabel')}</label>
                <div className="relative">
                    <textarea
                        ref={textareaRef}
                        id="test-string"
                        value={testString}
                        onChange={(e) => set('testString')(e.target.value)}
                        onScroll={handleScroll}
                        className="w-full h-48 p-3 font-mono bg-transparent border border-border-color dark:border-d-border-color rounded-lg text-transparent caret-text-primary dark:caret-d-text-primary focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-d-accent resize-y"
                        spellCheck="false"
                    />
                    <div 
                        ref={highlighterRef}
                        className="absolute inset-0 p-3 font-mono whitespace-pre-wrap pointer-events-none overflow-auto no-scrollbar"
                    >
                        {highlightedText}
                    </div>
                </div>
            </div>

            <div className="mb-8">
                <h3 className="text-xl font-bold mb-4">{t('tools.regexEditor.matchesLabel')} ({matches.length})</h3>
                {matches.length > 0 ? (
                    <div aria-live="polite" aria-atomic="true" className="space-y-4 max-h-60 overflow-y-auto p-4 bg-secondary dark:bg-d-secondary border border-border-color dark:border-d-border-color rounded-lg">
                        {matches.map((match, i) => (
                            <div key={i} className="p-3 bg-primary dark:bg-d-primary rounded-md border border-border-color dark:border-d-border-color/50">
                                <p><strong className="font-semibold text-accent dark:text-d-accent">{t('tools.regexEditor.match')} {i + 1}:</strong> <code className="bg-border-color/50 dark:bg-d-border-color/50 rounded p-1 text-sm">{match[0]}</code></p>
                                <p className="text-xs text-text-secondary dark:text-d-text-secondary">{t('tools.regexEditor.index')}: {match.index}</p>
                                {match.length > 1 && (
                                    <div className="mt-2 text-sm">
                                        {match.slice(1).map((group, j) => (
                                            <p key={j}>{t('tools.regexEditor.group')} {j + 1}: <code className="bg-border-color/50 dark:bg-d-border-color/50 rounded p-1 text-xs">{group}</code></p>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-text-secondary dark:text-d-text-secondary">{t('tools.regexEditor.noMatches')}</p>
                )}
            </div>
            
            <CheatSheet />
        </div>
    );
};

export default RegexEditor;