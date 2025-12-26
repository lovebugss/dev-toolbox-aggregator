import React, { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import JSZip from 'jszip';
import { useToasts } from '../contexts/ToastContext';
import { ToolHeader } from '../components/ui/ToolHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { PdfFileIcon, DownloadIcon } from '../components/icons/Icons';

// Access pdf.js from the window object
declare const window: {
    pdfjsLib: any;
};

interface PngImage {
    src: string;
    pageNumber: number;
}

const PdfToPng: React.FC = () => {
    const { t } = useTranslation();
    const addToast = useToasts();
    
    const [images, setImages] = useState<PngImage[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const resetState = () => {
        setImages([]);
        setIsProcessing(false);
        setProgress(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const processPdf = useCallback(async (file: File) => {
        if (!file || file.type !== 'application/pdf') {
            addToast('Please select a valid PDF file.', 'error');
            return;
        }
        if (!window.pdfjsLib) {
            addToast('PDF library is not loaded. Please refresh the page.', 'error');
            return;
        }

        resetState();
        setIsProcessing(true);
        setProgress({ current: 0, total: 0 });
        
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const arrayBuffer = e.target?.result as ArrayBuffer;
                // FIX: Added cMapUrl and cMapPacked to correctly load character maps for fonts (like CJK fonts).
                const loadingTask = window.pdfjsLib.getDocument({ 
                    data: arrayBuffer,
                    cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
                    cMapPacked: true,
                });
                const pdf = await loadingTask.promise;
                
                setProgress({ current: 0, total: pdf.numPages });

                const newImages: PngImage[] = [];
                for (let i = 1; i <= pdf.numPages; i++) {
                    setProgress({ current: i, total: pdf.numPages });
                    const page = await pdf.getPage(i);
                    const viewport = page.getViewport({ scale: 2.0 }); // High resolution
                    
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;

                    if (context) {
                        const renderContext = {
                            canvasContext: context,
                            viewport: viewport,
                        };
                        await page.render(renderContext).promise;
                        newImages.push({ src: canvas.toDataURL('image/png'), pageNumber: i });
                    }
                }
                setImages(newImages);
            } catch (error) {
                addToast(`Error processing PDF: ${(error as Error).message}`, 'error');
            } finally {
                setIsProcessing(false);
                setProgress(null);
            }
        };
        reader.readAsArrayBuffer(file);

    }, [addToast]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processPdf(file);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        const file = e.dataTransfer.files?.[0];
        if (file) processPdf(file);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();

    const handleDownloadAll = async () => {
        const zip = new JSZip();
        images.forEach((image, index) => {
            const imgData = image.src.split(',')[1];
            zip.file(`page_${index + 1}.png`, imgData, { base64: true });
        });
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(zipBlob);
        link.download = 'pdf-pages.zip';
        link.click();
        URL.revokeObjectURL(link.href);
    };

    if (isProcessing) {
        return (
            <div>
                <ToolHeader title={t('tools.pdfToPng.pageTitle')} description={t('tools.pdfToPng.pageDescription')} />
                <div className="flex flex-col items-center justify-center h-64 bg-secondary dark:bg-d-secondary rounded-lg border border-border-color dark:border-d-border-color">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent dark:border-d-accent"></div>
                    <p className="mt-4 font-semibold text-text-primary dark:text-d-text-primary">
                        {progress?.total ? t('tools.pdfToPng.renderingPage', { currentPage: progress.current, totalPages: progress.total }) : t('tools.pdfToPng.processing')}
                    </p>
                </div>
            </div>
        );
    }
    
    if (images.length > 0) {
        return (
             <div>
                <ToolHeader title={t('tools.pdfToPng.pageTitle')} description={t('tools.pdfToPng.pageDescription')} />
                 <div className="mb-6 flex flex-col sm:flex-row gap-4">
                    <button onClick={handleDownloadAll} className="px-6 py-3 bg-accent dark:bg-d-accent text-white dark:text-d-primary font-semibold rounded-lg hover:opacity-90 transition-opacity">
                        {t('tools.pdfToPng.downloadAllButton')}
                    </button>
                    <button onClick={resetState} className="px-6 py-3 bg-secondary dark:bg-d-secondary ring-1 ring-inset ring-border-color dark:ring-d-border-color text-text-primary dark:text-d-text-primary font-semibold rounded-lg hover:bg-border-color dark:hover:bg-d-border-color transition-colors">
                        {t('tools.pdfToPng.reset')}
                    </button>
                </div>
                <h3 className="text-xl font-bold mb-4">{t('tools.pdfToPng.output')} ({images.length})</h3>
                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {images.map(image => (
                        <div key={image.pageNumber} className="group relative bg-secondary dark:bg-d-secondary p-2 rounded-lg border border-border-color dark:border-d-border-color">
                            <img src={image.src} alt={`Page ${image.pageNumber}`} className="w-full h-auto rounded-md" />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2">
                                <p className="text-white font-bold text-lg">Page {image.pageNumber}</p>
                                <a href={image.src} download={`page_${image.pageNumber}.png`} className="mt-2 px-3 py-1.5 bg-white text-black text-xs font-semibold rounded-md flex items-center gap-1.5">
                                    <DownloadIcon className="w-4 h-4" />
                                    {t('tools.pdfToPng.downloadButton', { pageNumber: image.pageNumber })}
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div>
            <ToolHeader title={t('tools.pdfToPng.pageTitle')} description={t('tools.pdfToPng.pageDescription')} />
            <div
                className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border-color dark:border-d-border-color rounded-lg h-80 bg-secondary dark:bg-d-secondary hover:border-accent dark:hover:border-d-accent transition-colors"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
            >
                <input type="file" accept="application/pdf" onChange={handleFileChange} className="hidden" ref={fileInputRef} />
                <div className="text-center">
                    <PdfFileIcon className="mx-auto h-16 w-16 text-text-secondary dark:text-d-text-secondary" />
                    <p className="mt-4 text-sm text-text-secondary dark:text-d-text-secondary">
                        <button onClick={() => fileInputRef.current?.click()} className="font-semibold text-accent dark:text-d-accent hover:opacity-80">
                            {t('tools.pdfToPng.uploadButton')}
                        </button>
                        {' '}{t('tools.pdfToPng.dropzone')}
                    </p>
                    <p className="text-xs text-text-secondary dark:text-d-text-secondary mt-1">{t('tools.pdfToPng.fileTypes')}</p>
                </div>
            </div>
        </div>
    );
};

export default PdfToPng;
