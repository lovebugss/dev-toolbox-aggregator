import React, { useState, useCallback, useMemo, useContext } from 'react';
// FIX: Corrected import of useTranslation from react-i18next.
import { useTranslation } from 'react-i18next';
import { useToolState } from '../contexts/ToolStateContext';
import { useToasts } from '../contexts/ToastContext';
import { ToolHeader } from '../components/ui/ToolHeader';
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
    const [activeResponseTab, setActiveResponseTab] = useState<'body' | 'headers'>('body');

    const set = <K extends keyof HttpClientState>(key: K, value: HttpClientState[K]) => {
        setState(s => ({ ...s, [key]: value }));
    };

    const handleSend = async () => {
        if (!state.url.trim()) return;
        setIsLoading(true);
        setError(null);
        setResponse(null);
        const startTime = performance.now();
        try {
            const fetchHeaders: Record<string, string> = {};
            state.headers.forEach(h => { if (h.key.trim()) fetchHeaders[h.key] = h.value; });
            const options: RequestInit = { method: state.method, headers: fetchHeaders };
            if (['POST', 'PUT', 'PATCH'].includes(state.method) && state.body) options.body = state.body;
            const res = await fetch(state.url, options);
            const endTime = performance.now();
            const bodyText = await res.text();
            let displayBody = bodyText;
            try { displayBody = JSON.stringify(JSON.parse(bodyText), null, 2); } catch (e) {}
            const resHeaders: Record<string, string> = {};
            res.headers.forEach((val, key) => { resHeaders[key] = val; });
            setResponse({
                status: res.status, statusText: res.statusText, headers: resHeaders, body: displayBody,
                time: Math.round(endTime - startTime), size: (new Blob([bodyText]).size / 1024).toFixed(2) + ' KB',
            });
            setActiveResponseTab('body');
        } catch (err) {
            setError((err as Error).message);
            addToast(t('tools.httpClient.corsHint'), 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <ToolHeader title={t('tools.httpClient.pageTitle')} description={t('tools.httpClient.pageDescription')} />

            <div className="space-y-8">
                {/* Request Area */}
                <div className="flex flex-col sm:flex-row gap-3 glass-panel p-3 rounded-[2rem] border-white/10">
                    <select 
                        value={state.method} 
                        onChange={e => set('method', e.target.value as Method)}
                        className="p-3 bg-white/5 dark:bg-black/20 border-r border-white/10 font-black text-accent outline-none rounded-xl"
                    >
                        {['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <input
                        type="text"
                        value={state.url}
                        onChange={e => set('url', e.target.value)}
                        placeholder={t('tools.httpClient.urlPlaceholder') as string}
                        className="flex-grow p-3 bg-transparent text-text-primary dark:text-d-text-primary font-mono text-sm outline-none placeholder:opacity-30"
                    />
                    <button
                        onClick={handleSend}
                        disabled={isLoading}
                        className="px-8 py-3 bg-accent text-white font-black rounded-2xl hover:opacity-90 transition-all shadow-lg disabled:opacity-50"
                    >
                        {isLoading ? t('tools.httpClient.sending') : t('tools.httpClient.send')}
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <Accordion title={t('tools.httpClient.headers')} defaultOpen>
                            <div className="space-y-2 px-1">
                                {state.headers.map((h, i) => (
                                    <div key={i} className="flex gap-2">
                                        <input 
                                            placeholder={t('tools.httpClient.key') as string} 
                                            value={h.key} 
                                            onChange={e => {
                                                const newH = [...state.headers];
                                                newH[i].key = e.target.value;
                                                set('headers', newH);
                                            }}
                                            className="flex-1 p-2.5 text-xs bg-white/5 dark:bg-black/20 rounded-xl border border-white/10 text-text-primary dark:text-d-text-primary focus:border-accent outline-none" 
                                        />
                                        <input 
                                            placeholder={t('tools.httpClient.value') as string} 
                                            value={h.value} 
                                            onChange={e => {
                                                const newH = [...state.headers];
                                                newH[i].value = e.target.value;
                                                set('headers', newH);
                                            }}
                                            className="flex-1 p-2.5 text-xs bg-white/5 dark:bg-black/20 rounded-xl border border-white/10 text-text-primary dark:text-d-text-primary focus:border-accent outline-none" 
                                        />
                                        <button onClick={() => set('headers', state.headers.filter((_, idx) => idx !== i))} className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl"><TrashIcon className="w-4 h-4"/></button>
                                    </div>
                                ))}
                                <button onClick={() => set('headers', [...state.headers, {key: '', value: ''}])} className="w-full py-3 text-[10px] font-black uppercase tracking-widest border border-dashed border-white/20 rounded-xl text-text-secondary hover:bg-white/5 transition-colors">+ {t('tools.httpClient.addHeader')}</button>
                            </div>
                        </Accordion>

                        {['POST', 'PUT', 'PATCH'].includes(state.method) && (
                            <Accordion title={t('tools.httpClient.body')} defaultOpen>
                                <div className="relative glass-panel rounded-2xl overflow-hidden border-white/10">
                                    <textarea
                                        value={state.body}
                                        onChange={e => set('body', e.target.value)}
                                        className="w-full h-48 p-4 bg-black/5 dark:bg-black/20 text-text-primary dark:text-d-text-primary font-mono text-xs focus:outline-none placeholder:opacity-30"
                                    />
                                    <button onClick={() => { try { set('body', JSON.stringify(JSON.parse(state.body), null, 2)); } catch(e) {} }} className="absolute top-2 right-2 p-1.5 bg-white/10 rounded hover:bg-white/20 text-accent" title="Format JSON"><RefreshIcon className="w-4 h-4"/></button>
                                </div>
                            </Accordion>
                        )}
                    </div>

                    <div className="flex flex-col glass-panel rounded-[2rem] overflow-hidden border-white/10 min-h-[400px]">
                        <div className="p-4 border-b border-white/10 bg-white/5 flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-black uppercase tracking-widest text-text-primary dark:text-d-text-primary">{t('tools.httpClient.response')}</h3>
                                {response && (
                                    <div className="flex items-center gap-4 text-[10px] font-bold">
                                        <span className={`px-2 py-0.5 rounded ${response.status < 300 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                            {response.status} {response.statusText}
                                        </span>
                                        <span className="text-text-secondary">{response.time} ms</span>
                                        <span className="text-text-secondary">{response.size}</span>
                                    </div>
                                )}
                            </div>
                            
                            {response && (
                                <div className="flex gap-4">
                                    <button 
                                        onClick={() => setActiveResponseTab('body')}
                                        className={`pb-1 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${activeResponseTab === 'body' ? 'text-accent border-accent' : 'text-text-secondary/50 border-transparent hover:text-text-secondary'}`}
                                    >
                                        {t('tools.httpClient.responseBody')}
                                    </button>
                                    <button 
                                        onClick={() => setActiveResponseTab('headers')}
                                        className={`pb-1 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${activeResponseTab === 'headers' ? 'text-accent border-accent' : 'text-text-secondary/50 border-transparent hover:text-text-secondary'}`}
                                    >
                                        {t('tools.httpClient.responseHeaders')}
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="flex-grow p-4 overflow-auto relative bg-black/5 dark:bg-black/10">
                            {isLoading ? (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
                                </div>
                            ) : error ? (
                                <div className="p-4 bg-red-500/5 text-red-500 rounded-xl text-xs font-mono border border-red-500/10 leading-relaxed">{error}</div>
                            ) : response ? (
                                <>
                                    {activeResponseTab === 'body' && (
                                        <div className="relative group">
                                            {/* FIX: Cast v to string for writeText compatibility. */}
                                            <button onClick={() => navigator.clipboard.writeText(response.body).then(() => addToast(t('common.toast.copiedSuccess'), 'success'))} className="absolute top-0 right-0 p-2 bg-white/10 opacity-0 group-hover:opacity-100 rounded-bl-xl transition-opacity text-accent"><CopyIcon className="w-4 h-4"/></button>
                                            <SyntaxHighlighter language="json" style={theme === 'dark' ? vscDarkPlus : vs} customStyle={{ margin: 0, background: 'transparent', fontSize: '0.75rem', lineHeight: '1.4' }}>
                                                {response.body}
                                            </SyntaxHighlighter>
                                        </div>
                                    )}
                                    {activeResponseTab === 'headers' && (
                                        <div className="space-y-1 font-mono text-[10px]">
                                            {Object.entries(response.headers).map(([k, v]) => (
                                                <div key={k} className="flex border-b border-white/5 py-1.5 hover:bg-white/5 transition-colors rounded px-2 group">
                                                    <span className="text-accent font-bold w-1/3 truncate">{k}:</span>
                                                    <span className="text-text-primary dark:text-d-text-primary flex-1 break-all px-2">{v}</span>
                                                    {/* FIX: Cast v to string for writeText compatibility. */}
                                                    <button onClick={() => { navigator.clipboard.writeText(v as string); addToast(t('common.toast.copiedSuccess'), 'success'); }} className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto"><CopyIcon className="w-3 h-3 text-text-secondary"/></button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="h-full flex items-center justify-center text-text-secondary dark:text-d-text-secondary/20 text-xs italic text-center px-8 uppercase tracking-widest">{t('tools.httpClient.noResponse')}</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HttpClient;