import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import JSZip from 'jszip';
import { useToolState } from '../contexts/ToolStateContext';
import { ToolHeader } from '../components/ui/ToolHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { ScissorsIcon } from '../components/icons/Icons';

interface ImageGridSplitterState {
    rows: number;
    cols: number;
}

export const ImageGridSplitter: React.FC = () => {
    const { t } = useTranslation();
    const { state, setState } = useToolState<ImageGridSplitterState>('image-grid-splitter', {
        rows: 3,
        cols: 3,
    });
    const { rows, cols } = state;
    const [sourceImage, setSourceImage] = useState<string | null>(null);
    const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
    const [gridTiles, setGridTiles] = useState<string[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const processFile = (file: File) => {
        if (!file.type.startsWith('image/')) {
            setError(t('tools.imageGridSplitter.errorInvalidImage'));
            return;
        }
        setError(null);
        setGridTiles([]);
        setImageDimensions(null);
        const reader = new FileReader();
        reader.onload = (e) => {
            const imgSrc = e.target?.result as string;
            const img = new Image();
            img.onload = () => {
                setImageDimensions({ width: img.width, height: img.height });
                setSourceImage(imgSrc);
            };
            img.src = imgSrc;
        };
        reader.readAsDataURL(file);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => e.target.files?.[0] && processFile(e.target.files[0]);
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.files?.[0] && processFile(e.dataTransfer.files[0]);
    };
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();
    
    const handleSplitImage = () => {
        if (!sourceImage) return;

        setIsProcessing(true);
        setGridTiles([]);

        const img = new Image();
        img.onload = () => {
            const tileWidth = Math.floor(img.width / cols);
            const tileHeight = Math.floor(img.height / rows);
            const tiles: string[] = [];

            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const canvas = document.createElement('canvas');
                    canvas.width = tileWidth;
                    canvas.height = tileHeight;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) continue;

                    const sx = c * tileWidth;
                    const sy = r * tileHeight;

                    ctx.drawImage(img, sx, sy, tileWidth, tileHeight, 0, 0, tileWidth, tileHeight);
                    tiles.push(canvas.toDataURL('image/png'));
                }
            }
            setGridTiles(tiles);
            setIsProcessing(false);
        };
        img.src = sourceImage;
    };

    const handleDownloadZip = async () => {
        if (gridTiles.length === 0) return;

        const zip = new JSZip();
        gridTiles.forEach((tile, index) => {
            const row = Math.floor(index / cols) + 1;
            const col = (index % cols) + 1;
            zip.file(`tile_${row}_${col}.png`, tile.split(',')[1], { base64: true });
        });

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(zipBlob);
        link.download = 'image_tiles.zip';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    };
    
    const setRows = (value: number) => setState(s => ({ ...s, rows: Math.max(1, value || 1) }));
    const setCols = (value: number) => setState(s => ({ ...s, cols: Math.max(1, value || 1) }));

    const gridLines = Array.from({ length: cols - 1 }).map((_, i) => (
        <div key={`v-${i}`} className="absolute bg-white/50" style={{ left: `${((i + 1) / cols) * 100}%`, top: 0, bottom: 0, width: '1px' }}></div>
    )).concat(Array.from({ length: rows - 1 }).map((_, i) => (
        <div key={`h-${i}`} className="absolute bg-white/50" style={{ top: `${((i + 1) / rows) * 100}%`, left: 0, right: 0, height: '1px' }}></div>
    )));

    return (
        <div className="flex flex-col h-full">
            <ToolHeader 
              title={t('tools.imageGridSplitter.pageTitle')}
              description={t('tools.imageGridSplitter.pageDescription')}
            />

            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-0">
                {/* Left Panel: Upload and Options */}
                <div className="flex flex-col gap-6">
                    {!sourceImage ? (
                        <div
                            className="flex-grow flex flex-col items-center justify-center p-6 border-2 border-dashed border-border-color dark:border-d-border-color rounded-2xl bg-secondary dark:bg-d-secondary hover:border-accent dark:hover:border-d-accent transition-colors"
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                        >
                            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" ref={fileInputRef} />
                            <div className="text-center">
                                <svg className="mx-auto h-12 w-12 text-text-secondary dark:text-d-text-secondary" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                <p className="mt-2 text-sm text-text-secondary dark:text-d-text-secondary">
                                    <button onClick={() => fileInputRef.current?.click()} className="font-semibold text-accent dark:text-d-accent hover:opacity-80" title={t('common.tooltips.uploadImage')}>
                                        {t('tools.imageGridSplitter.uploadButton')}
                                    </button>
                                    {' '}{t('tools.base64ImageConverter.dropzone')}
                                </p>
                                <p className="text-xs text-text-secondary dark:text-d-text-secondary mt-1">{t('tools.imageGridSplitter.fileTypes')}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 bg-secondary dark:bg-d-secondary rounded-2xl border border-border-color dark:border-d-border-color flex items-center justify-center">
                            {imageDimensions &&
                                <div
                                    className="relative max-w-full max-h-[40vh]"
                                    style={{ aspectRatio: `${imageDimensions.width} / ${imageDimensions.height}` }}
                                >
                                    <img src={sourceImage} alt="Preview" className="block w-full h-full object-contain rounded-lg" />
                                    {gridLines}
                                </div>
                            }
                        </div>
                    )}

                    <div className="bg-secondary dark:bg-d-secondary p-6 rounded-2xl border border-border-color dark:border-d-border-color">
                        <h3 className="text-xl font-semibold mb-4 text-text-primary dark:text-d-text-primary">{t('tools.imageGridSplitter.options')}</h3>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-text-secondary dark:text-d-text-secondary mb-1">{t('tools.imageGridSplitter.rows')}</label>
                                <input type="number" value={rows} onChange={(e) => setRows(parseInt(e.target.value))} className="w-full p-2 bg-primary dark:bg-d-primary border-none ring-1 ring-inset ring-border-color dark:ring-d-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-d-accent" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-secondary dark:text-d-text-secondary mb-1">{t('tools.imageGridSplitter.columns')}</label>
                                <input type="number" value={cols} onChange={(e) => setCols(parseInt(e.target.value))} className="w-full p-2 bg-primary dark:bg-d-primary border-none ring-1 ring-inset ring-border-color dark:ring-d-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-d-accent" />
                            </div>
                        </div>
                        <button
                            onClick={handleSplitImage}
                            disabled={!sourceImage || isProcessing}
                            className="w-full px-6 py-3 bg-accent dark:bg-d-accent text-white dark:text-d-primary font-semibold rounded-lg hover:bg-blue-700 dark:hover:bg-blue-500 transition-colors duration-200 shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
                            title={t('common.tooltips.splitImage')}
                        >
                            {isProcessing ? t('tools.imageGridSplitter.processing') : t('tools.imageGridSplitter.splitButton')}
                        </button>
                    </div>
                </div>

                {/* Right Panel: Output */}
                <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-semibold text-text-primary dark:text-d-text-primary">{t('tools.imageGridSplitter.output')}</h3>
                        {gridTiles.length > 0 && (
                            <button
                                onClick={handleDownloadZip}
                                className="px-4 py-2 bg-accent dark:bg-d-accent text-white dark:text-d-primary font-semibold rounded-lg hover:bg-blue-700 dark:hover:bg-blue-500 transition-colors"
                                title={t('common.tooltips.downloadZip')}
                            >
                                {t('tools.imageGridSplitter.downloadButton')}
                            </button>
                        )}
                    </div>
                    <div className="flex-grow p-4 bg-secondary dark:bg-d-secondary rounded-2xl border border-border-color dark:border-d-border-color overflow-auto">
                        {gridTiles.length > 0 ? (
                            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
                                {gridTiles.map((tile, index) => (
                                    <img key={index} src={tile} alt={`Tile ${index + 1}`} className="w-full h-auto rounded-lg" />
                                ))}
                            </div>
                        ) : (
                            <EmptyState Icon={ScissorsIcon} message={t('tools.imageGridSplitter.outputPlaceholder')} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
