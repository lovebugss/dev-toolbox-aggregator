import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useToolState } from '../contexts/ToolStateContext';
import { useToasts } from '../contexts/ToastContext';
import { ToolHeader } from '../components/ui/ToolHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { BracketsIcon, CopyIcon, VscChevronDownIcon, VscChevronRightIcon } from '../components/icons/Icons';

// --- STATE & TYPES ---
interface JsonFormatterState {
  inputJson: string;
  parsedJson: any | null;
  error: string | null;
  filterNullValues: boolean;
}
type CollapsedPaths = Record<string, boolean>;

const laxParse = (str: string): any => {
    const trimmed = str.trim();
    if (!trimmed) return null;
    try {
        return JSON.parse(trimmed);
    } catch (e) {
        try {
            const fn = new Function(`"use strict"; return (${trimmed});`);
            return fn();
        } catch (laxError: any) {
            throw new Error(laxError.message);
        }
    }
};

const removeNulls = (obj: any): any => {
    if (Array.isArray(obj)) {
        return obj.filter(v => v !== null).map(v => removeNulls(v));
    }
    if (obj !== null && typeof obj === 'object') {
        return Object.entries(obj).reduce((acc: {[key: string]: any}, [key, value]) => {
            if (value !== null) acc[key] = removeNulls(value);
            return acc;
        }, {});
    }
    return obj;
};

const CopyButton: React.FC<{ onCopy: () => void }> = ({ onCopy }) => (
    <button
        onClick={(e) => { e.stopPropagation(); onCopy(); }}
        className="p-1 rounded text-text-secondary dark:text-d-text-secondary hover:bg-black/10 dark:hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
    >
        <CopyIcon />
    </button>
);

const IndentationGuide: React.FC<{ level: number, isLast: boolean }> = ({ level, isLast }) => (
    <>
        {Array.from({ length: level }).map((_, i) => (
            <div key={i} className={`absolute top-0 bottom-0 w-px bg-border-color dark:bg-white/10 ${ isLast && i === level -1 ? 'h-5' : '' }`} style={{ left: `${(i * 1.5) + 0.75}rem` }}></div>
        ))}
    </>
);

const JsonNode: React.FC<{
    nodeKey: string;
    value: any;
    level: number;
    path: string;
    isLast: boolean;
    collapsedPaths: CollapsedPaths;
    toggleCollapse: (path: string) => void;
    onCopy: (value: any) => void;
}> = ({ nodeKey, value, level, path, isLast, collapsedPaths, toggleCollapse, onCopy }) => {
    const isCollapsed = collapsedPaths[path];
    const type = Array.isArray(value) ? 'array' : typeof value;
    const isCollapsible = (type === 'object' && value !== null) || type === 'array';
    const entries = isCollapsible ? Object.entries(value) : [];
    const count = entries.length;

    const renderValue = () => {
        if (value === null) return <span className="text-purple-600 dark:text-purple-400">null</span>;
        switch (type) {
            case 'string': return <span className="text-green-700 dark:text-green-400">"{value}"</span>;
            case 'number': return <span className="text-blue-600 dark:text-blue-400">{value}</span>;
            case 'boolean': return <span className="text-purple-600 dark:text-purple-400">{String(value)}</span>;
            default: return null;
        }
    };

    return (
        <div className="relative font-mono text-sm" style={{ paddingLeft: `${level * 1.5}rem` }}>
             <IndentationGuide level={level} isLast={isLast && (isCollapsed || !isCollapsible)} />
            <div className="group flex items-start rounded hover:bg-black/5 dark:hover:bg-white/5 py-0.5">
                {isCollapsible ? (
                    <button onClick={() => toggleCollapse(path)} className="flex items-center -ml-5 mr-1 pt-0.5 text-text-secondary/70 dark:text-d-text-secondary/70 group-hover:text-text-secondary dark:group-hover:text-d-text-secondary transition-colors">
                        {isCollapsed ? <VscChevronRightIcon /> : <VscChevronDownIcon />}
                    </button>
                ) : <div className="w-4 -ml-5 mr-1"></div>}
                
                {nodeKey && <span className="text-red-600 dark:text-red-400 mr-2 flex-shrink-0">"{nodeKey}":</span>}
                
                <div className="flex items-baseline dark:text-d-text-primary">
                    {isCollapsible ? (
                        <>
                            <span>{type === 'array' ? '[' : '{'}</span>
                            {isCollapsed && count > 0 && <span onClick={() => toggleCollapse(path)} className="text-text-secondary dark:text-d-text-secondary cursor-pointer hover:underline mx-1">...</span>}
                            {isCollapsed && <span>{type === 'array' ? ']' : '}'}</span>}
                        </>
                    ) : renderValue()}
                     {(isCollapsed || !isCollapsible) && !isLast && <span>,</span>}
                </div>
                
                <div className="flex items-center ml-2">
                     {count > 0 && <span className="text-text-secondary dark:text-d-text-secondary text-xs opacity-0 group-hover:opacity-100 transition-opacity">({count})</span>}
                    <div className="ml-2"><CopyButton onCopy={() => onCopy(value)} /></div>
                </div>
            </div>

            {!isCollapsed && isCollapsible && (
                <>
                    <div>
                        {entries.map(([key, childValue], index) => (
                            <JsonNode
                                key={key}
                                nodeKey={type === 'object' ? key : ''}
                                value={childValue}
                                level={level + 1}
                                path={`${path}.${key}`}
                                isLast={index === entries.length - 1}
                                collapsedPaths={collapsedPaths}
                                toggleCollapse={toggleCollapse}
                                onCopy={onCopy}
                            />
                        ))}
                    </div>
                    <span className="dark:text-d-text-primary">{type === 'array' ? ']' : '}'}</span>
                    {!isLast && <span className="dark:text-d-text-primary">,</span>}
                </>
            )}
        </div>
    );
};

const JsonFormatter: React.FC = () => {
    const { t } = useTranslation();
    const { state, setState } = useToolState<JsonFormatterState>('json-formatter', {
        inputJson: '{\n  "name": "DevToolbox",\n  "version": 1.0,\n  "tools": [\n    {\n      "id": "json-formatter",\n      "name": "JSON Formatter"\n    }\n  ],\n  "active": true,\n  "config": null\n}',
        parsedJson: null,
        error: null,
        filterNullValues: false,
    });
    const { inputJson, parsedJson, error, filterNullValues } = state;
    const addToast = useToasts();
    
    const [collapsedPaths, setCollapsedPaths] = useState<CollapsedPaths>({});
    const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const parseJson = useCallback((jsonString: string) => {
        if (!jsonString.trim()) {
            setState(s => ({ ...s, parsedJson: null, error: null }));
            return;
        }
        try {
            let parsed = laxParse(jsonString);
            if (filterNullValues) parsed = removeNulls(parsed);
            setState(s => ({ ...s, parsedJson: parsed, error: null }));
            setCollapsedPaths({});
        } catch (e: any) {
            setState(s => ({ ...s, parsedJson: null, error: t('tools.jsonFormatter.errorInvalid', { message: e.message }) }));
        }
    }, [setState, t, filterNullValues]);
    
    useEffect(() => {
        if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
        debounceTimeoutRef.current = setTimeout(() => parseJson(inputJson), 500);
        return () => { if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current); };
    }, [inputJson, parseJson]);

    const handleCopy = (value: any) => {
        const textToCopy = JSON.stringify(value, null, 2);
        navigator.clipboard.writeText(textToCopy).then(() => addToast(t('common.toast.copiedSuccess'), 'success'));
    };
    
    const lineNumbers = useMemo(() => {
        const count = inputJson.split('\n').length;
        return Array.from({ length: count }, (_, i) => i + 1).join('\n');
    }, [inputJson]);

    return (
        <div className="flex flex-col h-full">
            <ToolHeader title={t('tools.jsonFormatter.pageTitle')} description={t('tools.jsonFormatter.pageDescription')} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-grow min-h-0">
                <div className="flex flex-col glass-panel rounded-2xl overflow-hidden border-white/10">
                     <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
                         <h3 className="font-bold text-text-primary dark:text-d-text-primary uppercase tracking-widest text-xs">{t('tools.jsonFormatter.inputLabel')}</h3>
                         <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 text-xs font-bold text-text-secondary dark:text-d-text-secondary cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={filterNullValues}
                                    onChange={(e) => setState(s => ({...s, filterNullValues: e.target.checked}))}
                                    className="w-4 h-4 rounded text-accent focus:ring-accent accent-accent"
                                />
                                {t('tools.jsonFormatter.filterNulls')}
                            </label>
                            <button onClick={() => setState(s => ({ ...s, inputJson: '' }))} className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors uppercase">{t('tools.jsonFormatter.clearButton')}</button>
                         </div>
                     </div>
                     <div className="flex-grow flex p-4 min-h-0 overflow-auto bg-black/5 dark:bg-black/20">
                         <pre className="text-right pr-4 text-text-secondary/50 dark:text-d-text-secondary/30 select-none font-mono text-sm pt-0">{lineNumbers}</pre>
                         <textarea
                            value={inputJson}
                            onChange={(e) => setState(s => ({...s, inputJson: e.target.value}))}
                            placeholder={t('tools.jsonFormatter.placeholder') as string}
                            className="flex-grow bg-transparent text-text-primary dark:text-d-text-primary focus:outline-none font-mono text-sm resize-none placeholder:opacity-30"
                            spellCheck="false"
                        />
                     </div>
                     {error && <div className="p-3 bg-red-500/10 border-t border-red-500/20 text-red-500 text-xs font-mono">{error}</div>}
                </div>
                
                <div className="flex flex-col glass-panel rounded-2xl overflow-hidden border-white/10">
                     <div className="p-4 border-b border-white/10 bg-white/5">
                        <h3 className="font-bold text-text-primary dark:text-d-text-primary uppercase tracking-widest text-xs">{t('tools.jsonFormatter.outputLabel')}</h3>
                     </div>
                     <div className="flex-grow p-6 overflow-auto bg-black/5 dark:bg-black/10">
                        {parsedJson ? (
                            <JsonNode nodeKey="" value={parsedJson} level={0} path="root" isLast={true} collapsedPaths={collapsedPaths} toggleCollapse={path => setCollapsedPaths(prev => ({ ...prev, [path]: !prev[path] }))} onCopy={handleCopy} />
                        ) : (
                            !error && <EmptyState Icon={BracketsIcon} message={t('tools.jsonFormatter.outputPlaceholder') as string} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JsonFormatter;