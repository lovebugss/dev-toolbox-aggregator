import React, { useState, useCallback, useMemo, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useToolState } from '../contexts/ToolStateContext';
import { useToasts } from '../contexts/ToastContext';
import { ToolHeader } from '../components/ui/ToolHeader';
import { LabeledControl } from '../components/ui/LabeledControl';
import { Accordion } from '../components/ui/Accordion';
import { CopyIcon, TrashIcon, RefreshIcon } from '../components/icons/Icons';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vs, vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ThemeContext } from '../App';

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface HeaderPair {
    key: string;
    value: string;
}

interface ResponseData {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: string;
    time: number;
    size: string;
}

interface HttpClientState {
    url: string;
    method: Method;
    headers: HeaderPair[];
    body: string;
}

const HttpClient: React.FC = () => {
    const { t } = useTranslation();
    const addToast = useToasts();
    const { theme } = useContext(ThemeContext);

    const { state, setState } = useToolState<HttpClientState>('http-client', {
        url: 'https://jsonplaceholder.typicode.com/posts/1',
        method: 'GET',
        headers: [{ key: 'Content-Type', value: 'application/json' }],
        body: '{\n  "title": "foo",\n  "body": "bar",\n  "userId": 1\n}',
    });

    const [isLoading, setIsLoading] = useState(false);
    const [response, setResponse] = useState<ResponseData | null>(null);
    const [error, setError] = useState<string | null>(null);

    const set = <K extends keyof HttpClientState>(key: K, value: HttpClientState[K]) => {
        setState(s => ({ ...s, [key]: value }));
    };

    const addHeader = () => set('headers', [...state.headers, { key: '', value: '' }]);
    const removeHeader = (index: number) => set('headers', state.headers.filter((_, i) => i !== index));
    const updateHeader = (index: number, pair: Partial<HeaderPair>) => {
        const newHeaders = [...state.headers];
        newHeaders[index] = { ...newHeaders[index], ...pair };
        set('headers', newHeaders);
    };

    const handleSend = async () => {
        if (!state.url.trim()) return;

        setIsLoading(true);
        setError(null);
        setResponse(null);

        const startTime = performance.now();
        try {
            const fetchHeaders: Record<string, string> = {};
            state.headers.forEach(h => {
                if (h.key.trim()) fetchHeaders[h.key] = h.value;
            });

            const options: RequestInit = {
                method: state.method,
                headers: fetchHeaders,
            };

            if (['POST', 'PUT', 'PATCH'].includes(state.method) && state.body) {
                options.body = state.body;
            }

            const res = await fetch(state.url, options);
            const endTime = performance.now();
            
            const bodyText = await res.text();
            let displayBody = bodyText;
            try {
                displayBody = JSON.stringify(JSON.parse(bodyText), null, 2);
            } catch (e) {
                // Not JSON, keep as is
            }

            const resHeaders: Record<string, string> = {};
            res.headers.forEach((val, key) => { resHeaders[key] = val; });

            setResponse({
                status: res.status,
                statusText: res.statusText,
                headers: resHeaders,
                body: displayBody,
                time: Math.round(endTime - startTime),
                size: (new Blob([bodyText]).size / 1024).toFixed(2) + ' KB',
            });
        } catch (err) {
            setError((err as Error).message);
            addToast(t('tools.httpClient.corsHint'), 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const formatJsonBody = () => {
        try {
            const formatted = JSON.stringify(JSON.parse(state.body), null, 2);
            set('body', formatted);
        } catch (e) {
            addToast(t('tools.jsonFormatter.errorInvalid', { message: '' }), 'error');
        }
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text).then(() => addToast(t('common.toast.copiedSuccess'), 'success'));
    };

    return (
        <div className="flex flex-col h-full">
            <ToolHeader title={t('tools.httpClient.pageTitle')} description={t('tools.httpClient.pageDescription')} />

            <div className="space-y-6">
                {/* Request Area */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <select 
                        value={state.method} 
                        onChange={e => set('method', e.target.value as Method)}
                        className="p-3 bg-secondary dark:bg-d-secondary border border-border-color dark:border-d-border-color rounded-xl font-bold text-accent dark:text-d-accent outline-none"
                    >
                        {['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <input
                        type="text"
                        value={state.url}
                        onChange={e => set('url', e.target.value)}
                        placeholder={t('tools.httpClient.urlPlaceholder') as string}
                        className="flex-grow p-3 bg-secondary dark:bg-d-secondary border border-border-color dark:border-d-border-color rounded-xl font-mono text-sm outline-none focus:ring-2 focus:ring-accent"
                    />
                    <button
                        onClick={handleSend}
                        disabled={isLoading}
                        className="px-8 py-3 bg-accent dark:bg-d-accent text-white dark:text-d-primary font-bold rounded-xl hover:opacity-90 transition-all shadow-lg disabled:opacity-50"
                    >
                        {isLoading ? t('tools.httpClient.sending') : t('tools.httpClient.send')}
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Config Area */}
                    <div className="space-y-4">
                        <Accordion title={t('tools.httpClient.headers')} defaultOpen>
                            <div className="space-y-2">
                                {state.headers.map((h, i) => (
                                    <div key={i} className="flex gap-2">
                                        <input 
                                            placeholder={t('tools.httpClient.key') as string} 
                                            value={h.key} 
                                            onChange={e => updateHeader(i, { key: e.target.value })}
                                            className="flex-1 p-2 text-xs bg-primary dark:bg-d-primary rounded border border-border-color" 
                                        />
                                        <input 
                                            placeholder={t('tools.httpClient.value') as string} 
                                            value={h.value} 
                                            onChange={e => updateHeader(i, { value: e.target.value })}
                                            className="flex-1 p-2 text-xs bg-primary dark:bg-d-primary rounded border border-border-color" 
                                        />
                                        <button onClick={() => removeHeader(i)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-md"><TrashIcon className="w-4 h-4"/></button>
                                    </div>
                                ))}
                                <button onClick={addHeader} className="w-full py-2 text-xs border border-dashed border-border-color rounded hover:bg-primary transition-colors">+ {t('tools.httpClient.addHeader')}</button>
                            </div>
                        </Accordion>

                        {['POST', 'PUT', 'PATCH'].includes(state.method) && (
                            <Accordion title={t('tools.httpClient.body')} defaultOpen>
                                <div className="relative">
                                    <textarea
                                        value={state.body}
                                        onChange={e => set('body', e.target.value)}
                                        className="w-full h-48 p-3 bg-primary dark:bg-d-primary font-mono text-xs border border-border-color rounded-lg focus:outline-none focus:ring-1 focus:ring-accent"
                                    />
                                    <button onClick={formatJsonBody} className="absolute top-2 right-2 p-1.5 bg-secondary dark:bg-d-secondary rounded hover:bg-border-color transition-colors" title="Format JSON"><RefreshIcon className="w-4 h-4"/></button>
                                </div>
                            </Accordion>
                        )}
                    </div>

                    {/* Response Area */}
                    <div className="flex flex-col bg-secondary dark:bg-d-secondary rounded-2xl border border-border-color dark:border-d-border-color min-h-[400px]">
                        <div className="p-4 border-b border-border-color flex items-center justify-between">
                            <h3 className="font-bold">{t('tools.httpClient.response')}</h3>
                            {response && (
                                <div className="flex items-center gap-4 text-xs">
                                    <span className={`px-2 py-1 rounded font-bold ${response.status < 300 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {response.status} {response.statusText}
                                    </span>
                                    <span className="text-text-secondary">{response.time} ms</span>
                                    <span className="text-text-secondary">{response.size}</span>
                                </div>
                            )}
                        </div>
                        <div className="flex-grow p-4 overflow-auto relative">
                            {isLoading ? (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
                                </div>
                            ) : error ? (
                                <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm font-mono border border-red-200">
                                    {error}
                                    <p className="mt-2 text-xs opacity-80">{t('tools.httpClient.corsHint')}</p>
                                </div>
                            ) : response ? (
                                <div className="space-y-6">
                                    <div className="relative group">
                                        <button 
                                            onClick={() => handleCopy(response.body)} 
                                            className="absolute top-0 right-0 p-2 bg-primary/80 opacity-0 group-hover:opacity-100 rounded-bl-lg transition-opacity"
                                        >
                                            <CopyIcon className="w-4 h-4"/>
                                        </button>
                                        <SyntaxHighlighter
                                            language="json"
                                            style={theme === 'dark' ? vscDarkPlus : vs}
                                            customStyle={{ margin: 0, background: 'transparent', fontSize: '0.75rem' }}
                                        >
                                            {response.body}
                                        </SyntaxHighlighter>
                                    </div>
                                    
                                    <div className="pt-4 border-t border-border-color">
                                        <h4 className="text-xs font-bold uppercase text-text-secondary mb-2">{t('tools.httpClient.headers')}</h4>
                                        <div className="space-y-1 font-mono text-[10px]">
                                            {Object.entries(response.headers).map(([k, v]) => (
                                                <div key={k} className="flex border-b border-border-color/30 py-1">
                                                    <span className="text-accent font-bold w-1/3 truncate">{k}:</span>
                                                    <span className="text-text-primary dark:text-d-text-primary flex-1 break-all">{v}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex items-center justify-center text-text-secondary text-sm text-center px-8 italic opacity-60">
                                    {t('tools.httpClient.noResponse')}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HttpClient;