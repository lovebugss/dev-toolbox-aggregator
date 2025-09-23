import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import UAParser from 'ua-parser-js';
import { ToolHeader } from '../components/ui/ToolHeader';
import { useToasts } from '../contexts/ToastContext';
import { CopyIcon } from '../components/icons/Icons';
import { FiChrome, FiMonitor, FiCpu, FiSmartphone, FiTablet, FiHardDrive, FiGitMerge } from 'react-icons/fi';

// Fix: Corrected typo in type definition. The namespace is UAParser, not IUAParser.
type ParsedUA = UAParser.IResult;

const InfoCard: React.FC<{ icon: React.ReactNode; title: string; data: Record<string, string | undefined> }> = ({ icon, title, data }) => {
    const { t } = useTranslation();
    const filteredData = Object.entries(data).filter(([_, value]) => value);

    if (filteredData.length === 0) {
        return null;
    }

    return (
        <div className="bg-secondary dark:bg-d-secondary p-4 rounded-lg border border-border-color dark:border-d-border-color">
            <div className="flex items-center gap-3 mb-3">
                <div className="flex-shrink-0 w-8 h-8 bg-primary dark:bg-d-primary rounded-md flex items-center justify-center text-accent dark:text-d-accent">
                    {icon}
                </div>
                <h3 className="font-semibold text-text-primary dark:text-d-text-primary">{title}</h3>
            </div>
            <div className="space-y-2 text-sm">
                {filteredData.map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center bg-primary dark:bg-d-primary p-2 rounded-md">
                        <span className="text-text-secondary dark:text-d-text-secondary capitalize">{t(`tools.userAgentViewer.${key}`)}</span>
                        <span className="font-mono text-text-primary dark:text-d-text-primary text-right">{value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};


const UserAgentViewer: React.FC = () => {
    const { t } = useTranslation();
    const addToast = useToasts();
    const [uaString, setUaString] = useState('');
    const [parsedUa, setParsedUa] = useState<ParsedUA | null>(null);

    useEffect(() => {
        const userAgent = navigator.userAgent;
        setUaString(userAgent);
        const parser = new UAParser(userAgent);
        setParsedUa(parser.getResult());
    }, []);

    const handleCopy = () => {
        if (!uaString) return;
        navigator.clipboard.writeText(uaString).then(() => {
            addToast(t('common.toast.copiedSuccess'), 'success');
        }, () => {
            addToast(t('common.toast.copiedFailed'), 'error');
        });
    };
    
    const getDeviceIcon = () => {
        switch(parsedUa?.device.type) {
            case 'mobile': return <FiSmartphone />;
            case 'tablet': return <FiTablet />;
            default: return <FiMonitor />;
        }
    };
    
    return (
        <div>
            <ToolHeader 
              title={t('tools.userAgentViewer.pageTitle')}
              description={t('tools.userAgentViewer.pageDescription')}
            />
            
            <div className="space-y-8">
                <div>
                    <h3 className="text-xl font-bold text-text-primary dark:text-d-text-primary mb-2">{t('tools.userAgentViewer.fullString')}</h3>
                    <div className="relative p-4 bg-secondary dark:bg-d-secondary border border-border-color dark:border-d-border-color rounded-lg font-mono text-sm text-accent dark:text-d-accent">
                        {uaString}
                        <button
                            onClick={handleCopy}
                            className="absolute top-1/2 right-3 -translate-y-1/2 p-2 bg-primary dark:bg-d-primary text-text-secondary dark:text-d-text-secondary rounded-md hover:bg-border-color dark:hover:bg-d-border-color transition-colors"
                            aria-label={t('common.copy')}
                        >
                            <CopyIcon />
                        </button>
                    </div>
                </div>

                <div>
                     <h3 className="text-xl font-bold text-text-primary dark:text-d-text-primary mb-4">{t('tools.userAgentViewer.parsedDetails')}</h3>
                     {parsedUa ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <InfoCard 
                                icon={<FiChrome />} 
                                title={t('tools.userAgentViewer.browser')} 
                                data={{ name: parsedUa.browser.name, version: parsedUa.browser.version }}
                            />
                             <InfoCard 
                                icon={<FiHardDrive />} 
                                title={t('tools.userAgentViewer.os')} 
                                data={{ name: parsedUa.os.name, version: parsedUa.os.version }}
                            />
                             <InfoCard 
                                icon={getDeviceIcon()} 
                                title={t('tools.userAgentViewer.device')} 
                                data={{ 
                                    vendor: parsedUa.device.vendor || t('tools.userAgentViewer.unknown'), 
                                    model: parsedUa.device.model,
                                    type: parsedUa.device.type
                                }}
                            />
                             <InfoCard 
                                icon={<FiCpu />} 
                                title={t('tools.userAgentViewer.cpu')} 
                                data={{ architecture: parsedUa.cpu.architecture }}
                            />
                             <InfoCard 
                                icon={<FiGitMerge />} 
                                title={t('tools.userAgentViewer.engine')} 
                                data={{ name: parsedUa.engine.name, version: parsedUa.engine.version }}
                            />
                        </div>
                     ) : (
                        <p>{t('common.loading')}...</p>
                     )}
                </div>
            </div>
        </div>
    );
};

export default UserAgentViewer;