import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SearchIcon } from '../components/icons/Icons';
import { useToolState } from '../contexts/ToolStateContext';
import { ToolHeader } from '../components/ui/ToolHeader';

interface PostalCodeInfo {
    postcode: string;
    province: string;
    city: string;
    county: string;
    address: string;
}

interface PostalCodeState {
    postCode: string;
    result: PostalCodeInfo | null;
}

const ResultDisplay: React.FC<{ data: PostalCodeInfo }> = ({ data }) => {
    const { t } = useTranslation();
    const infoMap = [
        { label: t('tools.postalCodeLookup.address'), value: data.address },
        { label: t('tools.postalCodeLookup.province'), value: data.province },
        { label: t('tools.postalCodeLookup.city'), value: data.city },
        { label: t('tools.postalCodeLookup.county'), value: data.county },
    ];

    return (
        <div className="mt-6 p-6 bg-secondary dark:bg-d-secondary border border-border-color dark:border-d-border-color rounded-lg">
            <h3 className="text-lg font-semibold mb-4">{t('tools.postalCodeLookup.result')}</h3>
            <div className="space-y-3 text-sm">
                {infoMap.map(item => (
                    <div key={item.label} className="flex justify-between p-3 bg-primary dark:bg-d-primary rounded-md">
                        <span className="text-text-secondary dark:text-d-text-secondary">{item.label}:</span>
                        <span className="font-semibold text-text-primary dark:text-d-text-primary text-right">{item.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const PostalCodeLookup: React.FC = () => {
    const { t } = useTranslation();
    const { state, setState } = useToolState<PostalCodeState>('postal-code-lookup', {
        postCode: '',
        result: null,
    });
    const { postCode, result } = state;
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleQuery = async () => {
        if (!/^\d{6}$/.test(postCode)) {
            setError(t('tools.postalCodeLookup.errorInvalid'));
            setState(s => ({ ...s, result: null }));
            return;
        }
        setError(null);
        setIsLoading(true);
        setState(s => ({ ...s, result: null }));
        
        try {
            const response = await fetch(`https://api.oioweb.cn/api/common/postcode?postcode=${postCode}`);
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            if (data.code === 200 && data.result) {
                setState(s => ({ ...s, result: data.result }));
            } else {
                throw new Error(data.msg || 'Failed to fetch data');
            }
        } catch (e) {
            setError(t('tools.postalCodeLookup.errorApi'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
         <div>
            <ToolHeader 
              title={t('tools.postalCodeLookup.pageTitle')}
              description={t('tools.postalCodeLookup.pageDescription')}
            />

            <div className="max-w-xl mx-auto">
                 <div className="relative">
                    <label htmlFor="postcode-input" className="sr-only">{t('tools.postalCodeLookup.postCodeLabel')}</label>
                    <input
                        id="postcode-input"
                        type="text"
                        value={postCode}
                        onChange={(e) => setState(s => ({ ...s, postCode: e.target.value }))}
                        placeholder={t('tools.postalCodeLookup.placeholder')}
                        className="w-full pl-5 pr-32 py-4 text-lg bg-secondary dark:bg-d-secondary border border-border-color dark:border-d-border-color rounded-full focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-d-accent"
                    />
                    <button
                        onClick={handleQuery}
                        disabled={isLoading}
                        className="absolute inset-y-1.5 right-1.5 px-6 py-2 bg-accent dark:bg-d-accent text-white dark:text-d-primary font-semibold rounded-full hover:opacity-90 transition-opacity duration-200 shadow-md flex items-center disabled:opacity-50"
                    >
                        {isLoading ? (
                            <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                        ) : (
                           <SearchIcon className="w-5 h-5 mr-2" />
                        )}
                        {isLoading ? t('tools.postalCodeLookup.querying') : t('tools.postalCodeLookup.queryButton')}
                    </button>
                </div>

                {error && <p className="text-center mt-4 text-red-500">{error}</p>}
                {result && <ResultDisplay data={result} />}
            </div>
        </div>
    );
};

export default PostalCodeLookup;
