import React, { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';
import { useToolState } from '../contexts/ToolStateContext';
import { useToasts } from '../contexts/ToastContext';
import { ToolHeader } from '../components/ui/ToolHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { LabeledControl } from '../components/ui/LabeledControl';
import { ImageIcon, TrashIcon, DragHandleIcon, LayersIcon } from '../components/icons/Icons';

// Types
interface StitcherImage {
    id: string;
    file: File;
    previewUrl: string;
    width: number;
    height: number;
}
interface StitcherSettings {
    direction: 'vertical' | 'horizontal';
    quality: number;
    format: 'jpeg' | 'png' | 'webp';
}

const LongImageStitcher: React.FC = () => {
    const { t } = useTranslation();
    const addToast = useToasts();
    
    // Persisted state for settings
    const { state: settings, setState: setSettings } = useToolState<StitcherSettings>('long-image-stitcher', {
        direction: 'vertical',
        quality: 0.9,
        format: 'jpeg',
    });

    // Local state for this session
    const [images, setImages] = useState<StitcherImage[]>([]);
    const [outputUrl, setOutputUrl] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [draggedId, setDraggedId] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // File handling
    const processFiles = (files: FileList | null) => {
        if (!files) return;

        const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
        if (imageFiles.length === 0) return;

        const newImagesPromises = imageFiles.map(file => {
            return new Promise<StitcherImage>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = e => {
                    const img = new Image();
                    img.onload = () => {
                        resolve({
                            id: uuidv4(),
                            file,
                            previewUrl: e.target?.result as string,
                            width: img.width,
                            height: img.height,
                        });
                    };
                    img.onerror = reject;
                    img.src = e.target?.result as string;
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        });

        Promise.all(newImagesPromises)
            .then(newImages => setImages(prev => [...prev, ...newImages]))
            .catch(() => addToast(t('tools.longImageStitcher.errorProcessing'), 'error'));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => processFiles(e.target.files);
    const handleDropZone = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        processFiles(e.dataTransfer.files);
    };
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();

    // Drag and Drop for reordering
    const handleDragStart = (id: string) => setDraggedId(id);
    const handleDragEnter = (id: string) => {
        if (draggedId === null || draggedId === id) return;
        
        const newImages = [...images];
        const draggedIndex = newImages.findIndex(img => img.id === draggedId);
        const targetIndex = newImages.findIndex(img => img.id === id);

        const [draggedItem] = newImages.splice(draggedIndex, 1);
        newImages.splice(targetIndex, 0, draggedItem);
        
        setImages(newImages);
    };

    // Stitching logic
    const handleGenerate = async () => {
        if (images.length < 2) {
            addToast('Please upload at least two images.', 'info');
            return;
        }

        setIsProcessing(true);
        setOutputUrl(null);

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            setIsProcessing(false);
            return;
        }
        
        const { direction } = settings;
        let totalWidth = 0;
        let totalHeight = 0;

        if (direction === 'vertical') {
            totalWidth = Math.max(...images.map(img => img.width));
            totalHeight = images.reduce((sum, img) => sum + img.height, 0);
        } else {
            totalWidth = images.reduce((sum, img) => sum + img.width, 0);
            totalHeight = Math.max(...images.map(img => img.height));
        }

        canvas.width = totalWidth;
        canvas.height = totalHeight;

        let currentOffset = 0;
        for (const image of images) {
            const img = new Image();
            img.src = image.previewUrl;
            await new Promise(resolve => img.onload = resolve);

            if (direction === 'vertical') {
                ctx.drawImage(img, 0, currentOffset);
                currentOffset += img.height;
            } else {
                ctx.drawImage(img, currentOffset, 0);
                currentOffset += img.width;
            }
        }
        
        const mimeType = `image/${settings.format}`;
        const dataUrl = canvas.toDataURL(mimeType, settings.quality);
        setOutputUrl(dataUrl);
        setIsProcessing(false);
    };

    const setSetting = <K extends keyof StitcherSettings>(key: K, value: StitcherSettings[K]) => {
        setSettings(s => ({ ...s, [key]: value }));
    };

    return (
        <div className="flex flex-col h-full">
            <ToolHeader title={t('tools.longImageStitcher.pageTitle')} description={t('tools.longImageStitcher.pageDescription')} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-grow min-h-0">
                {/* Left Panel: Upload and Controls */}
                <div className="flex flex-col gap-6">
                    <div
                        className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border-color dark:border-d-border-color rounded-2xl bg-secondary dark:bg-d-secondary hover:border-accent dark:hover:border-d-accent transition-colors"
                        onDrop={handleDropZone} onDragOver={handleDragOver}
                    >
                        <input type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" ref={fileInputRef} />
                        <ImageIcon className="mx-auto h-12 w-12 text-text-secondary dark:text-d-text-secondary" />
                        <p className="mt-2 text-sm text-text-secondary dark:text-d-text-secondary">
                            <button onClick={() => fileInputRef.current?.click()} className="font-semibold text-accent dark:text-d-accent">
                                {t('tools.longImageStitcher.uploadButton')}
                            </button>
                            {' '}{t('tools.longImageStitcher.dropzone')}
                        </p>
                    </div>

                    <div className="flex-grow flex flex-col bg-secondary dark:bg-d-secondary rounded-2xl border border-border-color dark:border-d-border-color min-h-[200px]">
                        <div className="flex justify-between items-center p-3 border-b border-border-color dark:border-d-border-color">
                            <h3 className="font-semibold">{t('tools.longImageStitcher.uploadedImages')} ({images.length})</h3>
                            {images.length > 0 && (
                                <button onClick={() => setImages([])} className="text-xs px-2 py-1 bg-primary dark:bg-d-primary rounded-md">{t('tools.longImageStitcher.clearAll')}</button>
                            )}
                        </div>
                        <div className="flex-grow p-3 overflow-y-auto space-y-2">
                            {images.length === 0 ? (
                                <p className="text-center text-sm text-text-secondary dark:text-d-text-secondary pt-10">{t('common.tooltips.uploadImage')}</p>
                            ) : (
                                images.map((image) => (
                                    <div
                                        key={image.id}
                                        draggable
                                        onDragStart={() => handleDragStart(image.id)}
                                        onDragEnter={() => handleDragEnter(image.id)}
                                        onDragEnd={() => setDraggedId(null)}
                                        className={`flex items-center p-2 rounded-md bg-primary dark:bg-d-primary cursor-grab ${draggedId === image.id ? 'opacity-50' : ''}`}
                                    >
                                        <DragHandleIcon className="w-5 h-5 text-text-secondary dark:text-d-text-secondary mr-2" />
                                        <img src={image.previewUrl} alt={image.file.name} className="w-12 h-12 object-cover rounded-md" />
                                        <div className="ml-3 flex-grow text-sm truncate">
                                            <p className="font-semibold truncate">{image.file.name}</p>
                                            <p className="text-text-secondary dark:text-d-text-secondary">{image.width} x {image.height}</p>
                                        </div>
                                        <button onClick={() => setImages(imgs => imgs.filter(i => i.id !== image.id))} className="p-2 text-red-500 hover:bg-red-500/10 rounded-full">
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="bg-secondary dark:bg-d-secondary p-4 rounded-2xl border border-border-color dark:border-d-border-color space-y-4">
                        <h3 className="font-semibold">{t('tools.longImageStitcher.options')}</h3>
                        <LabeledControl label={t('tools.longImageStitcher.direction')}>
                            <div className="flex bg-primary dark:bg-d-primary p-1 rounded-md">
                                <button onClick={() => setSetting('direction', 'vertical')} className={`w-1/2 py-1 text-sm rounded ${settings.direction === 'vertical' ? 'bg-secondary dark:bg-d-secondary shadow' : ''}`}>{t('tools.longImageStitcher.vertical')}</button>
                                <button onClick={() => setSetting('direction', 'horizontal')} className={`w-1/2 py-1 text-sm rounded ${settings.direction === 'horizontal' ? 'bg-secondary dark:bg-d-secondary shadow' : ''}`}>{t('tools.longImageStitcher.horizontal')}</button>
                            </div>
                        </LabeledControl>
                        <div className="grid grid-cols-2 gap-4">
                            <LabeledControl label={t('tools.longImageStitcher.format')}>
                                <select value={settings.format} onChange={e => setSetting('format', e.target.value as StitcherSettings['format'])} className="w-full p-2 bg-primary dark:bg-d-primary rounded-md">
                                    <option value="jpeg">JPEG</option>
                                    <option value="png">PNG</option>
                                    <option value="webp">WEBP</option>
                                </select>
                            </LabeledControl>
                             <LabeledControl label={t('tools.longImageStitcher.quality')} valueDisplay={`${Math.round(settings.quality * 100)}%`}>
                                <input type="range" min="0.1" max="1" step="0.05" value={settings.quality} onChange={e => setSetting('quality', parseFloat(e.target.value))} className="w-full accent-accent dark:accent-d-accent" disabled={settings.format === 'png'}/>
                            </LabeledControl>
                        </div>
                         <button onClick={handleGenerate} disabled={isProcessing || images.length < 2} className="w-full py-3 bg-accent text-white font-bold rounded-lg disabled:opacity-50">
                            {isProcessing ? t('tools.longImageStitcher.generating') : t('tools.longImageStitcher.generate')}
                        </button>
                    </div>
                </div>

                {/* Right Panel: Output */}
                <div className="flex flex-col gap-4">
                     <div className="flex justify-between items-center">
                        <h3 className="text-xl font-semibold">{t('tools.longImageStitcher.output')}</h3>
                        {outputUrl && (
                            <a href={outputUrl} download={`stitched-image.${settings.format}`} className="px-4 py-2 bg-accent text-white font-semibold rounded-lg text-sm">{t('tools.longImageStitcher.download')}</a>
                        )}
                    </div>
                     <div className="flex-grow p-4 bg-secondary dark:bg-d-secondary rounded-2xl border border-border-color dark:border-d-border-color overflow-auto">
                        {isProcessing ? (
                             <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div></div>
                        ) : outputUrl ? (
                            <img src={outputUrl} alt="Stitched Result" className="max-w-full h-auto mx-auto" />
                        ) : (
                            <EmptyState Icon={LayersIcon} message={t('tools.longImageStitcher.outputPlaceholder')} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LongImageStitcher;