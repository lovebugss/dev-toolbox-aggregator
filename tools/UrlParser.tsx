import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useToolState } from '../contexts/ToolStateContext';
import { useToasts } from '../contexts/ToastContext';
import { ToolHeader } from '../components/ui/ToolHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { LinkIcon } from '../components/icons/Icons';

interface ParsedUrl {
    protocol: string;
    hostname: string;
    port: string;
    pathname: string;
    search: string;
    hash: string;
    params: [string, string][];
}

interface UrlParserState {
    urlInput: string;
    parsedUrl: ParsedUrl | null;
    error: string | null;
}

const CopyButton: React.FC<{ text: string }> = ({ text }) => {
    const { t } = useTranslation();
    const addToast = useToasts();

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
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
            aria-label={t('common.copy')}
            className="p-1.5 text-text-secondary dark:text-d-text-secondary hover:bg-border-color dark:hover:bg-white/10 rounded-md transition-colors"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
        </button>
    );
};

const ResultRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="flex items-center justify-between p-3 bg-primary dark:bg-slate-800/50 rounded-md border border-transparent dark:border-white/5">
        <span className="font-semibold text-text-secondary dark:text-d-text-secondary text-sm">{label}</span>
        <div className="flex items-center gap-2">
            <code className="text-accent dark:text-indigo-400 break-all font-mono text-xs">{value}</code>
            <CopyButton text={value} />
        </div>
    </div>
);

export const UrlParser: React.FC = () => {
    const { t } = useTranslation();
    const { state, setState } = useToolState<UrlParserState>('url-parser', {
        urlInput: 'https://example.com:8080/path/to/page?query=string&another=value#hash',
        parsedUrl: null,
        error: null,
    });
    const { urlInput, parsedUrl, error } = state;

    useEffect(() => {
        if (!urlInput.trim()) {
            setState(s => ({ ...s, parsedUrl: null, error: t('tools.urlParser.noUrl') }));
            return;
        }

        try {
            let fullUrl = urlInput;
            if (!/^[a-zA-Z]+:\/\//.test(fullUrl)) {
                fullUrl = 'https://' + fullUrl;
            }

            const url = new URL(fullUrl);
            const params: [string, string][] = Array.from(url.searchParams.entries());

            setState(s => ({
                ...s,
                parsedUrl: {
                    protocol: url.protocol,
                    hostname: url.hostname,
                    port: url.port,
                    pathname: url.pathname,
                    search: url.search,
                    hash: url.hash,
                    params,
                },
                error: null,
            }));
        } catch (e) {
            setState(s => ({ ...s, parsedUrl: null, error: t('tools.urlParser.invalidUrl') }));
        }
    }, [urlInput, setState, t]);

    return (
        <div>
            <ToolHeader 
              title={t('tools.urlParser.pageTitle')}
              description={t('tools.urlParser.pageDescription')}
            />

            <input
                type="text"
                value={urlInput}
                onChange={(e) => setState(s => ({ ...s, urlInput: e.target.value }))}
                placeholder={t('tools.urlParser.placeholder') as string}
                className="w-full p-4 mb-8 text-lg font-mono bg-secondary dark:bg-slate-900/50 border border-border-color dark:border-white/10 rounded-2xl text-text-primary dark:text-d-text-primary focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-indigo-500 placeholder:opacity-30 transition-all"
                aria-label="URL Input"
            />

            <h3 className="text-xl font-bold text-text-primary dark:text-d-text-primary mb-4 px-2">{t('tools.urlParser.resultsTitle')}</h3>
            <div className="p-6 glass-panel rounded-[2rem] border-white/10 space-y-3">
                {error && !parsedUrl && (
                     <EmptyState Icon={LinkIcon} message={error} />
                )}
                {parsedUrl && (
                    <>
                        <ResultRow label={t('tools.urlParser.protocol')} value={parsedUrl.protocol} />
                        <ResultRow label={t('tools.urlParser.hostname')} value={parsedUrl.hostname} />
                        {parsedUrl.port && <ResultRow label={t('tools.urlParser.port')} value={parsedUrl.port} />}
                        <ResultRow label={t('tools.urlParser.pathname')} value={parsedUrl.pathname} />
                        {parsedUrl.search && <ResultRow label={t('tools.urlParser.search')} value={parsedUrl.search} />}
                        {parsedUrl.hash && <ResultRow label={t('tools.urlParser.hash')} value={parsedUrl.hash} />}
                        
                        {parsedUrl.params.length > 0 && (
                             <div className="pt-4 mt-4 border-t border-white/5">
                                <h4 className="font-semibold text-text-secondary dark:text-d-text-secondary text-xs uppercase tracking-widest mb-3">{t('tools.urlParser.queryParams')}</h4>
                                <div className="space-y-2 p-3 bg-primary dark:bg-slate-800/30 rounded-xl border border-transparent dark:border-white/5">
                                    {parsedUrl.params.map(([key, value], index) => (
                                        <div key={index} className="flex items-center justify-between text-sm py-1.5 border-b border-white/5 last:border-0">
                                            <span className="font-medium text-text-secondary dark:text-d-text-secondary break-all">{key}</span>
                                            <div className="flex items-center gap-2">
                                                <code className="text-accent dark:text-indigo-300 break-all font-mono text-xs">{value}</code>
                                                <CopyButton text={value} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                         {parsedUrl.params.length === 0 && (
                             <p className="text-sm text-text-secondary dark:text-d-text-secondary/40 italic py-2">{t('tools.urlParser.noParams')}</p>
                         )}
                    </>
                )}
            </div>
        </div>
    );
};
