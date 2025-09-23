import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useToolState } from '../contexts/ToolStateContext';
import { ToolHeader } from '../components/ui/ToolHeader';

interface jwtDecoderState {
    jwt: string;
}

const JsonBlock: React.FC<{ title: string; data: object | null; error?: boolean }> = ({ title, data, error }) => (
    <div>
        <h3 className="text-lg font-semibold mb-2 text-text-primary dark:text-d-text-primary">{title}</h3>
        <pre className={`p-4 bg-primary dark:bg-d-primary rounded-lg text-sm whitespace-pre-wrap break-all ${error ? 'text-red-500' : 'text-accent dark:text-d-accent'}`}>
            <code>
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="flex flex-col">
                    <label htmlFor="jwt-input" className="font-semibold mb-2 text-text-secondary dark:text-d-text-secondary">{t('tools.jwtDecoder.encodedToken')}</label>
                    <textarea
                        id="jwt-input"
                        value={jwt}
                        onChange={(e) => setState({ jwt: e.target.value })}
                        placeholder={t('tools.jwtDecoder.tokenPlaceholder') as string}
                        className="flex-grow p-4 bg-secondary dark:bg-d-secondary border border-border-color dark:border-d-border-color rounded-lg text-text-primary dark:text-d-text-primary focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-d-accent font-mono text-sm resize-none"
                        style={{minHeight: '200px'}}
                    />
                </div>
                <div className="space-y-6">
                    <h3 className="text-xl font-bold text-text-primary dark:text-d-text-primary -mb-2">{t('tools.jwtDecoder.decoded')}</h3>
                    {decoded.error ? (
                        <div className="p-4 bg-red-900/50 border border-red-700 text-red-300 rounded-md">{decoded.error}</div>
                    ) : (
                        <>
                            <JsonBlock title={t('tools.jwtDecoder.header')} data={decoded.header} />
                            <JsonBlock title={t('tools.jwtDecoder.payload')} data={decoded.payload} />
                             <div>
                                <h3 className="text-lg font-semibold mb-2 text-text-primary dark:text-d-text-primary">{t('tools.jwtDecoder.signature')}</h3>
                                <p className="text-sm p-4 bg-primary dark:bg-d-primary rounded-lg text-text-secondary dark:text-d-text-secondary">{t('tools.jwtDecoder.signatureNotVerified')}</p>
                             </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default JwtDecoder;