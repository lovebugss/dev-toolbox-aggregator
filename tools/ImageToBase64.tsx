import React, { useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useToolState } from '../contexts/ToolStateContext';
import { useToasts } from '../contexts/ToastContext';
import { ToolHeader } from '../components/ui/ToolHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { ImageIcon } from '../components/icons/Icons';

type Mode = 'toBase64' | 'fromBase64';

interface ImageToBase64State {
    mode: Mode;
    base64: string;
    imagePreview: string;
    fileName: string;
    error: string | null;
}

const ImageToBase64: React.FC = () => {
    const { t } = useTranslation();
    const { state, setState } = useToolState<ImageToBase64State>('image-to-base64', {
        mode: 'toBase64',
        base64: '',
        imagePreview: '',
        fileName: 'download.png',
        error: null,
    });
    const { mode, base64, imagePreview, fileName, error } = state;
    const addToast = useToasts();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setState(s => ({
                    ...s,
                    base64: result,
                    imagePreview: URL.createObjectURL(file),
                    fileName: file.name,
                    error: null,
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(base64).then(() => {
            addToast(t('common.toast.copiedSuccess'), 'success');
        }, () => {
            addToast(t('common.toast.copiedFailed'), 'error');
        });
    };
    
    const handleDownload = () => {
        if (!imagePreview) return;
        const link = document.createElement('a');
        link.href = imagePreview;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      if (mode === 'toBase64' && fileInputRef.current) {
        fileInputRef.current.files = event.dataTransfer.files;
        handleFileChange({ target: fileInputRef.current } as React.ChangeEvent<HTMLInputElement>);
      }
    };

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
    };

    const handleBase64InputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setState(s => ({ ...s, base64: e.target.value }));
    };

    useEffect(() => {
        if (mode === 'fromBase64') {
            if (!base64.trim()) {
                setState(s => ({ ...s, imagePreview: '', error: null }));
                return;
            }
            if (base64.startsWith('data:image/')) {
                const extension = base64.substring("data:image/".length, base64.indexOf(";base64"));
                setState(s => ({ ...s, imagePreview: s.base64, error: null, fileName: `image.${extension}` }));
            } else {
                setState(s => ({ ...s, imagePreview: '', error: t('tools.base64ImageConverter.errorInvalidBase64') }));
            }
        }
    }, [base64, mode, t, setState]);

    const switchMode = (newMode: Mode) => {
        setState(s => ({ ...s, mode: newMode, error: null, base64: '', imagePreview: '' }));
    };

    return (
        <div>
            <ToolHeader 
              title={t('tools.base64ImageConverter.pageTitle')}
              description={t('tools.base64ImageConverter.pageDescription')}
            />

            <div role="tablist" aria-label="Image to Base64 conversion modes" className="flex border-b border-border-color dark:border-d-border-color mb-6">
                <button
                    role="tab"
                    aria-selected={mode === 'toBase64'}
                    aria-controls="to-base64-panel"
                    onClick={() => switchMode('toBase64')}
                    className={`px-4 py-2 text-sm font-semibold transition-colors focus:outline-none ${mode === 'toBase64' ? 'border-b-2 border-accent dark:border-d-accent text-accent dark:text-d-accent' : 'text-text-secondary dark:text-d-text-secondary hover:text-text-primary dark:hover:text-d-text-primary'}`}
                >
                    {t('tools.base64ImageConverter.toBase64Tab')}
                </button>
                <button
                    role="tab"
                    aria-selected={mode === 'fromBase64'}
                    aria-controls="from-base64-panel"
                    onClick={() => switchMode('fromBase64')}
                    className={`px-4 py-2 text-sm font-semibold transition-colors focus:outline-none ${mode === 'fromBase64' ? 'border-b-2 border-accent dark:border-d-accent text-accent dark:text-d-accent' : 'text-text-secondary dark:text-d-text-secondary hover:text-text-primary dark:hover:text-d-text-primary'}`}
                >
                    {t('tools.base64ImageConverter.fromBase64Tab')}
                </button>
            </div>

            {mode === 'toBase64' ? (
                <div id="to-base64-panel" role="tabpanel" className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div 
                        role="button"
                        tabIndex={0}
                        aria-label={t('common.tooltips.uploadImage') as string}
                        onClick={() => fileInputRef.current?.click()}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
                        className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border-color dark:border-d-border-color rounded-2xl h-96 bg-secondary dark:bg-d-secondary hover:border-accent dark:hover:border-d-accent transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                    >
                        <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" ref={fileInputRef}/>
                        {imagePreview ? (
                            <img src={imagePreview} alt="Preview" className="max-h-full max-w-full rounded-lg" />
                        ) : (
                            <div className="text-center">
                                <ImageIcon className="mx-auto h-12 w-12 text-text-secondary dark:text-d-text-secondary" />
                                <p className="mt-2 text-sm text-text-secondary dark:text-d-text-secondary">
                                    <span className="font-semibold text-accent dark:text-d-accent">
                                        {t('tools.base64ImageConverter.uploadButton')}
                                    </span>
                                    {' '}{t('tools.base64ImageConverter.dropzone')}
                                </p>
                                <p className="text-xs text-text-secondary dark:text-d-text-secondary mt-1">{t('tools.base64ImageConverter.fileTypes')}</p>
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col bg-secondary dark:bg-d-secondary p-4 rounded-xl shadow-sm h-96">
                        <label htmlFor="base64-output" className="font-semibold mb-2 text-text-secondary dark:text-d-text-secondary px-2">{t('tools.base64ImageConverter.outputLabel')}</label>
                        <textarea id="base64-output" value={base64} readOnly placeholder={t('tools.base64ImageConverter.outputPlaceholder')} className="flex-grow p-4 bg-primary dark:bg-d-primary border-none ring-1 ring-inset ring-border-color dark:ring-d-border-color rounded-lg text-text-primary dark:text-d-text-primary focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-d-accent font-mono text-xs resize-none"/>
                        {base64 && (
                            <div className="mt-4 relative">
                                <button onClick={handleCopy} className="w-full px-4 py-3 bg-accent dark:bg-d-accent text-white dark:text-d-primary font-semibold rounded-lg hover:opacity-90 transition-opacity duration-200" aria-label={t('common.tooltips.copyOutput')}>
                                    {t('common.copy')}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                 <div id="from-base64-panel" role="tabpanel" className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="flex flex-col bg-secondary dark:bg-d-secondary p-4 rounded-xl shadow-sm h-96">
                        <label htmlFor="base64-input" className="font-semibold mb-2 text-text-secondary dark:text-d-text-secondary px-2">{t('tools.base64ImageConverter.inputLabel')}</label>
                        <textarea id="base64-input" value={base64} onChange={handleBase64InputChange} placeholder={t('tools.base64ImageConverter.pasteBase64Placeholder')} className="flex-grow p-4 bg-primary dark:bg-d-primary border-none ring-1 ring-inset ring-border-color dark:ring-d-border-color rounded-lg text-text-primary dark:text-d-text-primary focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-d-accent font-mono text-xs resize-none"/>
                        {error && <p className="text-red-500 text-xs mt-2 px-2">{error}</p>}
                    </div>

                    <div className="flex flex-col bg-secondary dark:bg-d-secondary p-4 rounded-xl shadow-sm h-96">
                        <label className="font-semibold mb-2 text-text-secondary dark:text-d-text-secondary px-2">{t('tools.base64ImageConverter.imagePreviewLabel')}</label>
                        <div className="flex-grow flex items-center justify-center p-2 bg-primary dark:bg-d-primary ring-1 ring-inset ring-border-color dark:ring-d-border-color rounded-lg">
                           {imagePreview && !error ? (
                                <img src={imagePreview} alt="Preview" className="max-h-full max-w-full rounded-lg" />
                           ) : (
                                <EmptyState Icon={ImageIcon} message={t('tools.base64ImageConverter.imagePreviewPlaceholder')} />
                           )}
                        </div>
                        {imagePreview && !error && (
                            <div className="mt-4 relative">
                                <button onClick={handleDownload} className="w-full px-4 py-3 bg-accent dark:bg-d-accent text-white dark:text-d-primary font-semibold rounded-lg hover:opacity-90 transition-opacity duration-200" aria-label={t('common.tooltips.downloadImage')}>
                                    {t('tools.base64ImageConverter.downloadButton')}
                                </button>
                            </div>
                        )}
                    </div>
                 </div>
            )}
        </div>
    );
};

export default ImageToBase64;