import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { SearchIcon } from '../components/icons/Icons';
import { useToolState } from '../contexts/ToolStateContext';
import { ToolHeader } from '../components/ui/ToolHeader';

interface IpInfo {
    country: string;
    regionName: string;
    city: string;
    zip: string;
    isp: string;
    org: string;
    as: string;
    query: string;
}

interface IpLookupState {
    ip: string;
    result: IpInfo | null;
}

const ResultDisplay: React.FC<{ data: IpInfo }> = ({ data }) => {
    const { t } = useTranslation();
    const infoMap = [
        { label: t('tools.ipLookup.ipAddress'), value: data.query },
        { label: t('tools.ipLookup.country'), value: data.country },
        { label: t('tools.ipLookup.region'), value: data.regionName },
        { label: t('tools.ipLookup.city'), value: data.city },
        { label: t('tools.ipLookup.zip'), value: data.zip },
        { label: t('tools.ipLookup.isp'), value: data.isp },
        { label: t('tools.ipLookup.org'), value: data.org },
        { label: t('tools.ipLookup.as'), value: data.as },
    ];

    return (
        <div className="mt-6 p-6 bg-secondary dark:bg-d-secondary border border-border-color dark:border-d-border-color rounded-lg">
            <h3 className="text-lg font-semibold mb-4">{t('tools.ipLookup.result')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                {infoMap.map(item => (
                    item.value ? (
                        <div key={item.label} className="flex justify-between p-3 bg-primary dark:bg-d-primary rounded-md break-all">
                            <span className="text-text-secondary dark:text-d-text-secondary mr-2">{item.label}:</span>
                            <span className="font-semibold text-text-primary dark:text-d-text-primary text-right">{item.value}</span>
                        </div>
                    ) : null
                ))}
            </div>
        </div>
    );
};

const IpLookup: React.FC = () => {
    const { t } = useTranslation();
    const { state, setState } = useToolState<IpLookupState>('ip-lookup', {
        ip: '',
        result: null,
    });
    const { ip, result } = state;
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const queryIp = useCallback(async (ipAddress: string) => {
        setIsLoading(true);
        setError(null);
        setState(s => ({ ...s, result: null }));

        try {
            const response = await fetch(`http://ip-api.com/json/${ipAddress}`);
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            if (data.status === 'success') {
                setState(s => ({ ...s, result: data }));
            } else {
                throw new Error(data.message || 'Failed to fetch data');
            }
        } catch (e) {
            setError(t('tools.ipLookup.errorApi'));
        } finally {
            setIsLoading(false);
        }
    }, [setState, t]);

    const handleQuery = () => {
        if (!ip.trim()) {
            queryMyIp();
            return;
        }
        // Basic IP regex validation
        if (!/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(ip)) {
             setError(t('tools.ipLookup.errorInvalid'));
             return;
        }
        queryIp(ip);
    };
    
    const queryMyIp = useCallback(() => {
        setState(s => ({ ...s, ip: '' }));
        queryIp('');
    }, [setState, queryIp]);

    useEffect(() => {
        // Query user's IP only on initial mount if no result is stored
        if (!result) {
            queryMyIp();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
         <div>
            <ToolHeader 
              title={t('tools.ipLookup.pageTitle')}
              description={t('tools.ipLookup.pageDescription')}
            />

            <div className="max-w-2xl mx-auto">
                 <div className="flex space-x-2">
                    <input
                        type="text"
                        value={ip}
                        onChange={(e) => setState(s => ({ ...s, ip: e.target.value }))}
                        placeholder={t('tools.ipLookup.placeholder')}
                        className="w-full px-4 py-3 text-base bg-secondary dark:bg-d-secondary border border-border-color dark:border-d-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-d-accent"
                    />
                    <button
                        onClick={handleQuery}
                        disabled={isLoading}
                        className="px-6 py-2 bg-accent dark:bg-d-accent text-white dark:text-d-primary font-semibold rounded-lg hover:opacity-90 transition-opacity duration-200 shadow-md flex items-center disabled:opacity-50"
                    >
                        <SearchIcon className="w-5 h-5 mr-2" />
                        {t('tools.ipLookup.queryButton')}
                    </button>
                    <button
                        onClick={queryMyIp}
                        disabled={isLoading}
                        className="px-6 py-2 bg-secondary dark:bg-d-secondary ring-1 ring-inset ring-border-color dark:ring-d-border-color text-text-primary dark:text-d-text-primary font-semibold rounded-lg hover:bg-border-color dark:hover:bg-d-border-color transition-colors duration-200 shadow-sm disabled:opacity-50"
                    >
                        {t('tools.ipLookup.myIpButton')}
                    </button>
                </div>
                 
                {isLoading && (
                    <div className="text-center mt-6">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-accent dark:border-d-accent"></div>
                        <p className="mt-2 text-text-secondary dark:text-d-text-secondary">{t('tools.ipLookup.querying')}</p>
                    </div>
                )}
                {error && <p className="text-center mt-4 text-red-500">{error}</p>}
                {result && <ResultDisplay data={result} />}
            </div>
        </div>
    );
};

export default IpLookup;