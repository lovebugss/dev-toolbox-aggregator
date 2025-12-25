import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useToolState } from '../contexts/ToolStateContext';
import { ToolHeader } from '../components/ui/ToolHeader';

interface jwtDecoderState {
    jwt: string;
}

const JsonBlock: React.FC<{ title: string; data: object | null; error?: boolean }> = ({ title, data, error }) => (
    <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-widest text-text-secondary dark:text-d-text-secondary/70 ml-2">{title}</h3>
        <pre className={`p-4 bg-secondary dark:bg-slate-900 border border-border-color dark:border-white/10 rounded-2xl text-sm whitespace-pre-wrap break-all shadow-inner ${error ? 'text-red-500' : 'text-accent dark:text-indigo-300'}`}>
            <code className="font-mono">
                {data ? JSON.stringify(data, null, 2) : ''}
            </code>
        </pre>
    </div>
);

const JwtDecoder: React.FC = () => {
    const { t } = useTranslation();
    const { state, setState } = useToolState<jwtDecoderState>('jwt-decoder', {
        jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
    });
    const { jwt } = state;

    const decoded = useMemo(() => {
        if (!jwt.trim()) {
            return { header: null, payload: null, error: null };
        }
        try {
            const parts = jwt.split('.');
            if (parts.length !== 3) {
                return { header: null, payload: null, error: t('tools.jwtDecoder.invalidToken') };
            }

            const b64UrlDecode = (str: string): string => {
                // Base64 URL to Base64
                let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
                // Pad with '='
                while (base64.length % 4) {
                    base64 += '=';
                }
                // Decode from Base64 and then URI component to handle UTF-8
                return decodeURIComponent(
                    atob(base64)
                        .split('')
                        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                        .join('')
                );
            };

            const [header, payload] = parts.slice(0, 2).map(part => JSON.parse(b64UrlDecode(part)));
            
            return { header, payload, error: null };
        } catch (e) {
            return { header: null, payload: null, error: t('tools.jwtDecoder.invalidToken') };
        }
    }, [jwt, t]);

    return (
        <div>
            <ToolHeader 
              title={t('tools.jwtDecoder.pageTitle')}
              description={t('tools.jwtDecoder.pageDescription')}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <div className="flex flex-col">
                    <label htmlFor="jwt-input" className="text-[10px] font-bold uppercase tracking-widest text-text-secondary dark:text-d-text-secondary/70 mb-3 px-2">{t('tools.jwtDecoder.encodedToken')}</label>
                    <div className="glass-panel rounded-[2rem] border-white/10 overflow-hidden">
                        <textarea
                            id="jwt-input"
                            value={jwt}
                            onChange={(e) => setState({ jwt: e.target.value })}
                            placeholder={t('tools.jwtDecoder.tokenPlaceholder') as string}
                            className="w-full min-h-[300px] p-6 bg-black/5 dark:bg-slate-900/50 border-none text-text-primary dark:text-d-text-primary focus:outline-none font-mono text-sm leading-relaxed resize-none placeholder:opacity-30"
                            style={{minHeight: '400px'}}
                        />
                    </div>
                </div>
                <div className="space-y-8">
                    <h3 className="text-xl font-black text-text-primary dark:text-d-text-primary px-2 uppercase tracking-tighter">{t('tools.jwtDecoder.decoded')}</h3>
                    {decoded.error ? (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-xs font-mono">{decoded.error}</div>
                    ) : (
                        <div className="space-y-6">
                            <JsonBlock title={t('tools.jwtDecoder.header')} data={decoded.header} />
                            <JsonBlock title={t('tools.jwtDecoder.payload')} data={decoded.payload} />
                             <div className="space-y-2">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-text-secondary dark:text-d-text-secondary/70 ml-2">{t('tools.jwtDecoder.signature')}</h3>
                                <div className="p-4 bg-secondary dark:bg-slate-900/30 border border-dashed border-border-color dark:border-white/10 rounded-2xl text-xs text-text-secondary dark:text-d-text-secondary/50 italic leading-relaxed">
                                    {t('tools.jwtDecoder.signatureNotVerified')}
                                </div>
                             </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default JwtDecoder;
