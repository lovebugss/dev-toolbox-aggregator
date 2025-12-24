import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
// UAParser v2.x provides a named export 'UAParser', not a default export.
import { UAParser } from 'ua-parser-js';
import { ToolHeader } from '../components/ui/ToolHeader';
import { useToasts } from '../contexts/ToastContext';
import { CopyIcon } from '../components/icons/Icons';
import { FiChrome, FiMonitor, FiCpu, FiSmartphone, FiTablet, FiHardDrive, FiGitMerge } from 'react-icons/fi';

// Define the result interface for ua-parser-js v2.x compatibility
interface ParsedUA {
    browser: { name?: string; version?: string; major?: string };
    engine: { name?: string; version?: string };
    os: { name?: string; version?: string };
    device: { model?: string; type?: string; vendor?: string };
    cpu: { architecture?: string };
    ua: string;
}

const InfoCard: React.FC<{ icon: React.ReactNode; title: string; data: Record<string, string | undefined> }> = ({ icon, title, data }) => {
    const { t } = useTranslation();
    const filteredData = Object.entries(data).filter(([_, value]) => value);

    if (filteredData.length === 0) {
        return null;
    }

    return (
        <div className="glass-panel p-4 rounded-xl border border-white/10">
            <div className="flex items-center gap-3 mb-3">
                <div className="flex-shrink-0 w-8 h-8 bg-accent/20 rounded-md flex items-center justify-center text-accent">
                    {icon}
                </div>
                <h3 className="font-semibold text-text-primary dark:text-d-text-primary">{title}</h3>
            </div>
            <div className="space-y-2 text-sm">
                {filteredData.map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center bg-black/5 dark:bg-white/5 p-2 rounded-md">
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
        
        // Correct initialization for ua-parser-js v2.x
        // We use the named import UAParser as seen in the import map.
        try {
            const parser = new UAParser(userAgent);
            const result = parser.getResult();
            setParsedUa(result as unknown as ParsedUA);
        } catch (e) {
            console.error("UAParser initialization error:", e);
        }
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
        <div className="max-w-screen-xl mx-auto">
            <ToolHeader 
              title={t('tools.userAgentViewer.pageTitle')}
              description={t('tools.userAgentViewer.pageDescription')}
            />
            
            <div className="space-y-8">
                <div>
                    <h3 className="text-xl font-bold text-text-primary dark:text-d-text-primary mb-3 px-2">{t('tools.userAgentViewer.fullString')}</h3>
                    <div className="relative p-6 glass-panel rounded-2xl border border-white/10 font-mono text-sm text-accent break-all leading-relaxed">
                        {uaString}
                        <button
                            onClick={handleCopy}
                            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-text-primary rounded-xl transition-all"
                            title={t('common.copy') as string}
                        >
                            <CopyIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div>
                     <h3 className="text-xl font-bold text-text-primary dark:text-d-text-primary mb-4 px-2">{t('tools.userAgentViewer.parsedDetails')}</h3>
                     {parsedUa ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <InfoCard 
                                icon={<FiChrome className="w-5 h-5" />} 
                                title={t('tools.userAgentViewer.browser')} 
                                data={{ name: parsedUa.browser.name, version: parsedUa.browser.version }}
                            />
                             <InfoCard 
                                icon={<FiHardDrive className="w-5 h-5" />} 
                                title={t('tools.userAgentViewer.os')} 
                                data={{ name: parsedUa.os.name, version: parsedUa.os.version }}
                            />
                             <InfoCard 
                                // FIX: Added generic type any to ReactElement to allow className prop in cloneElement
                                icon={React.cloneElement(getDeviceIcon() as React.ReactElement<any>, { className: "w-5 h-5" })} 
                                title={t('tools.userAgentViewer.device')} 
                                data={{ 
                                    vendor: parsedUa.device.vendor || t('tools.userAgentViewer.unknown'), 
                                    model: parsedUa.device.model,
                                    type: parsedUa.device.type
                                }}
                            />
                             <InfoCard 
                                icon={<FiCpu className="w-5 h-5" />} 
                                title={t('tools.userAgentViewer.cpu')} 
                                data={{ architecture: parsedUa.cpu.architecture }}
                            />
                             <InfoCard 
                                icon={<FiGitMerge className="w-5 h-5" />} 
                                title={t('tools.userAgentViewer.engine')} 
                                data={{ name: parsedUa.engine.name, version: parsedUa.engine.version }}
                            />
                        </div>
                     ) : (
                        <div className="flex justify-center p-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
                        </div>
                     )}
                </div>
            </div>
        </div>
    );
};

export default UserAgentViewer;