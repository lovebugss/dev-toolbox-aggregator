import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import QRCodeStyling, { type Options as QRCodeStylingOptions, type FileExtension } from 'qr-code-styling';
import { useToolState } from '../contexts/ToolStateContext';
import { ToolHeader } from '../components/ui/ToolHeader';
import { Accordion } from '../components/ui/Accordion';
import { LabeledControl } from '../components/ui/LabeledControl';

type DotType = 'square' | 'dots' | 'rounded';
type CornerSquareType = 'square' | 'dot' | 'extra-rounded';
type CornerDotType = 'square' | 'dot';

interface QrCodeState {
    text: string;
    size: number;
    fileExt: FileExtension;
    options: QRCodeStylingOptions;
}

const ColorInput: React.FC<{ value: string; onChange: (color: string) => void }> = ({ value, onChange }) => (
    <div className="relative w-full h-10">
        <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="w-full h-full bg-primary dark:bg-d-primary ring-1 ring-inset ring-border-color dark:ring-d-border-color rounded-lg flex items-center px-3" style={{ backgroundColor: value }}>
            <span className="font-mono text-sm mix-blend-difference text-white">{value.toUpperCase()}</span>
        </div>
    </div>
);

const StyleSelector: React.FC<{ options: { value: string, label: string }[]; value: string; onChange: (value: any) => void }> = ({ options, value, onChange }) => (
    <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-2 bg-primary dark:bg-d-primary border-none ring-1 ring-inset ring-border-color dark:ring-d-border-color rounded-lg text-text-primary dark:text-d-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-d-accent"
    >
        {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
    </select>
);

const QrCodeGenerator: React.FC = () => {
    const { t } = useTranslation();
    const { state, setState } = useToolState<QrCodeState>('qr-code-generator', {
        text: 'https://react.dev',
        size: 300,
        fileExt: 'png',
        options: {
            margin: 10,
            dotsOptions: { color: '#111827', type: 'rounded' },
            backgroundOptions: { color: '#FFFFFF' },
            cornersSquareOptions: { color: '#111827', type: 'extra-rounded' },
            cornersDotOptions: { color: '#111827', type: 'square' },
            imageOptions: { hideBackgroundDots: true, imageSize: 0.4, margin: 8, crossOrigin: 'anonymous' }
        }
    });
    const { text, size, fileExt, options } = state;
    const [logo, setLogo] = useState<string | undefined>(undefined);
    
    const qrRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const qrCodeStylingRef = useRef<QRCodeStyling | null>(null);
    
    const setOption = (key: keyof QrCodeState) => (value: any) => setState(s => ({ ...s, [key]: value }));

    // Convert Unicode string to a Latin-1 byte string so QR library encodes bytes as UTF-8
    const encodeUtf8 = (input: string): string => {
        const bytes = new TextEncoder().encode(input);
        let latin1 = '';
        for (let i = 0; i < bytes.length; i++) {
            latin1 += String.fromCharCode(bytes[i]);
        }
        return latin1;
    };

    useEffect(() => {
        if (!qrRef.current) return;
        const qrOptions = { ...options, width: size, height: size, data: encodeUtf8(text), image: logo };
        if (!qrCodeStylingRef.current) {
            qrCodeStylingRef.current = new QRCodeStyling(qrOptions);
            qrCodeStylingRef.current.append(qrRef.current);
        } else {
            qrCodeStylingRef.current.update(qrOptions);
        }
    }, [text, size, logo, options]);
    
    const handleOptionChange = <K extends keyof QRCodeStylingOptions>(key: K, value: QRCodeStylingOptions[K]) => {
      setState(prev => ({...prev, options: { ...(prev.options || {}), [key]: {...(prev.options?.[key] as object), ...(value as object)}}}));
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setLogo(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleDownload = () => qrCodeStylingRef.current?.download({ name: 'qrcode', extension: fileExt });

    return (
        <div>
            <ToolHeader 
              title={t('tools.qrCodeGenerator.pageTitle')}
              description={t('tools.qrCodeGenerator.pageDescription')}
            />

            <div className="flex flex-col lg:flex-row gap-8">
                <div className="lg:w-2/3 bg-secondary dark:bg-d-secondary rounded-2xl shadow-sm border border-border-color dark:border-d-border-color">
                    <Accordion title={t('tools.qrCodeGenerator.data')} defaultOpen>
                        <textarea value={text} onChange={(e) => setOption('text')(e.target.value)} placeholder={t('tools.qrCodeGenerator.dataPlaceholder')} className="w-full h-24 p-3 bg-primary dark:bg-d-primary border-none ring-1 ring-inset ring-border-color dark:ring-d-border-color rounded-lg text-text-primary dark:text-d-text-primary focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-d-accent"/>
                    </Accordion>
                    
                    <Accordion title={t('tools.qrCodeGenerator.dotsOptions')}>
                        <LabeledControl label={t('tools.qrCodeGenerator.color')}>
                             <ColorInput value={options.dotsOptions?.color || '#000000'} onChange={color => handleOptionChange('dotsOptions', { color })} />
                        </LabeledControl>
                        <LabeledControl label={t('tools.qrCodeGenerator.style')}>
                            <StyleSelector value={options.dotsOptions?.type || 'square'} onChange={type => handleOptionChange('dotsOptions', { type: type as DotType })} options={[{value: 'square', label: t('tools.qrCodeGenerator.square')}, {value: 'dots', label: t('tools.qrCodeGenerator.dots')}, {value: 'rounded', label: t('tools.qrCodeGenerator.rounded')}]} />
                        </LabeledControl>
                    </Accordion>

                    <Accordion title={t('tools.qrCodeGenerator.cornerOptions')}>
                        <LabeledControl label={`${t('tools.qrCodeGenerator.cornerSquare')} ${t('tools.qrCodeGenerator.color')}`}>
                             <ColorInput value={options.cornersSquareOptions?.color || '#000000'} onChange={color => handleOptionChange('cornersSquareOptions', { color })} />
                        </LabeledControl>
                        <LabeledControl label={`${t('tools.qrCodeGenerator.cornerSquare')} ${t('tools.qrCodeGenerator.style')}`}>
                            <StyleSelector value={options.cornersSquareOptions?.type || 'square'} onChange={type => handleOptionChange('cornersSquareOptions', { type: type as CornerSquareType })} options={[{value: 'square', label: t('tools.qrCodeGenerator.square')}, {value: 'dot', label: t('tools.qrCodeGenerator.dots')}, {value: 'extra-rounded', label: t('tools.qrCodeGenerator.rounded')}]} />
                        </LabeledControl>
                         <LabeledControl label={`${t('tools.qrCodeGenerator.cornerDot')} ${t('tools.qrCodeGenerator.color')}`}>
                             <ColorInput value={options.cornersDotOptions?.color || '#000000'} onChange={color => handleOptionChange('cornersDotOptions', { color })} />
                        </LabeledControl>
                        <LabeledControl label={`${t('tools.qrCodeGenerator.cornerDot')} ${t('tools.qrCodeGenerator.style')}`}>
                            <StyleSelector value={options.cornersDotOptions?.type || 'square'} onChange={type => handleOptionChange('cornersDotOptions', { type: type as CornerDotType })} options={[{value: 'square', label: t('tools.qrCodeGenerator.square')}, {value: 'dot', label: t('tools.qrCodeGenerator.dots')}]} />
                        </LabeledControl>
                    </Accordion>
                    
                    <Accordion title={t('tools.qrCodeGenerator.logoOptions')}>
                        <div className="grid grid-cols-2 gap-3">
                             <button onClick={() => fileInputRef.current?.click()} className="w-full px-4 py-2 text-sm bg-primary dark:bg-d-primary ring-1 ring-inset ring-border-color dark:ring-d-border-color text-text-primary dark:text-d-text-primary font-semibold rounded-lg hover:bg-border-color/50 dark:hover:bg-d-border-color/50 transition-colors">{t('tools.qrCodeGenerator.uploadLogo')}</button>
                             <button onClick={() => setLogo(undefined)} disabled={!logo} className="w-full px-4 py-2 text-sm bg-primary dark:bg-d-primary ring-1 ring-inset ring-border-color dark:ring-d-border-color text-text-primary dark:text-d-text-primary font-semibold rounded-lg hover:bg-border-color/50 dark:hover:bg-d-border-color/50 disabled:opacity-50 transition-colors">{t('tools.qrCodeGenerator.removeLogo')}</button>
                             <input type="file" ref={fileInputRef} onChange={handleLogoUpload} accept="image/png, image/jpeg, image/svg+xml" className="hidden"/>
                        </div>
                        <LabeledControl label={t('tools.qrCodeGenerator.logoMargin')}>
                             <input type="range" min="0" max="20" value={options.imageOptions?.margin} onChange={e => handleOptionChange('imageOptions', { margin: parseInt(e.target.value, 10) })} className="w-full accent-accent dark:accent-d-accent" />
                        </LabeledControl>
                    </Accordion>
                </div>

                <div className="lg:w-1/3 flex flex-col items-center gap-6">
                    <div className="p-4 bg-secondary dark:bg-d-secondary rounded-2xl shadow-sm w-full">
                        <div ref={qrRef} role="img" aria-label={`QR Code for: ${text}`} className="mx-auto" style={{width: '100%', height: 'auto', aspectRatio: '1/1'}}/>
                    </div>
                    <div className="w-full p-6 bg-secondary dark:bg-d-secondary rounded-2xl shadow-sm space-y-4">
                        <LabeledControl label={t('tools.qrCodeGenerator.size')}>
                            <input type="number" value={size} onChange={(e) => setOption('size')(parseInt(e.target.value, 10))} className="w-full p-2 bg-primary dark:bg-d-primary border-none ring-1 ring-inset ring-border-color dark:ring-d-border-color rounded-lg text-text-primary dark:text-d-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-d-accent" />
                        </LabeledControl>
                        <LabeledControl label={t('tools.qrCodeGenerator.downloadAs')}>
                             <StyleSelector value={fileExt} onChange={setOption('fileExt')} options={[{value: 'png', label: t('tools.qrCodeGenerator.png')}, {value: 'jpeg', label: t('tools.qrCodeGenerator.jpeg')}, {value: 'webp', label: t('tools.qrCodeGenerator.webp')}, {value: 'svg', label: t('tools.qrCodeGenerator.svg')}]} />
                        </LabeledControl>
                        <button onClick={handleDownload} aria-label={t('common.tooltips.downloadQr', { ext: fileExt })} className="w-full px-6 py-3 bg-accent dark:bg-d-accent text-white dark:text-d-primary font-semibold rounded-lg hover:opacity-90 transition-opacity duration-200 shadow-md">
                            {t('tools.qrCodeGenerator.download')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QrCodeGenerator;