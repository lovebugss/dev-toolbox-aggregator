import React, { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { PDFDocument } from 'pdf-lib';
import { useToasts } from '../contexts/ToastContext';
import { ToolHeader } from '../components/ui/ToolHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { CompressIcon, PdfFileIcon } from '../components/icons/Icons';

declare const window: {
    pdfjsLib: any;
};

type CompressionLevel = 'low' | 'medium' | 'high';

const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const PdfCompressor: React.FC = () => {
    const { t } = useTranslation();
    const addToast = useToasts();

    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [compressionLevel, setCompressionLevel] = useState<CompressionLevel>('medium');
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<{ originalSize: number; compressedSize: number; blob: Blob } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = useCallback((file: File) => {
        if (file.type !== 'application/pdf') {
            addToast('Please select a valid PDF file.', 'error');
            return;
        }
        setPdfFile(file);
        setResult(null);
    }, [addToast]);

    const handleCompress = useCallback(async () => {
        if (!pdfFile) return;
        if (!window.pdfjsLib) {
            addToast('PDF library is not loaded. Please refresh the page.', 'error');
            return;
        }
        setIsProcessing(true);
        setResult(null);
        try {
            const qualityMap = { low: 0.9, medium: 0.7, high: 0.5 };
            const jpegQuality = qualityMap[compressionLevel];

            const arrayBuffer = await pdfFile.arrayBuffer();
            const pdfJsDoc = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            const newPdfDoc = await PDFDocument.create();

            for (let i = 1; i <= pdfJsDoc.numPages; i++) {
                const page = await pdfJsDoc.getPage(i);
                const viewport = page.getViewport({ scale: 1.5 });
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                
                if (context) {
                    await page.render({ canvasContext: context, viewport }).promise;
                    const jpegDataUrl = canvas.toDataURL('image/jpeg', jpegQuality);
                    const jpegBytes = await fetch(jpegDataUrl).then(res => res.arrayBuffer());
                    const jpegImage = await newPdfDoc.embedJpg(jpegBytes);
                    
                    const newPage = newPdfDoc.addPage([viewport.width, viewport.height]);
                    newPage.drawImage(jpegImage, {
                        x: 0,
                        y: 0,
                        width: viewport.width,
                        height: viewport.height,
                    });
                }
            }
            
            const pdfBytes = await newPdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            setResult({
                originalSize: pdfFile.size,
                compressedSize: blob.size,
                blob,
            });

        } catch (error) {
            addToast(`Compression failed: ${(error as Error).message}`, 'error');
        } finally {
            setIsProcessing(false);
        }
    }, [pdfFile, compressionLevel, addToast, t]);

    const reduction = result ? ((result.originalSize - result.compressedSize) / result.originalSize * 100).toFixed(1) : 0;

    return (
        <div>
            <ToolHeader title={t('tools.pdfCompressor.pageTitle')} description={t('tools.pdfCompressor.pageDescription')} />
            <input type="file" accept="application/pdf" ref={fileInputRef} onChange={e => e.target.files && handleFileSelect(e.target.files[0])} className="hidden" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={e => { e.preventDefault(); e.dataTransfer.files && handleFileSelect(e.dataTransfer.files[0])}}
                    onDragOver={e => e.preventDefault()}
                    className="cursor-pointer h-full p-6 bg-secondary dark:bg-d-secondary rounded-2xl border-2 border-dashed border-border-color dark:border-d-border-color hover:border-accent dark:hover:border-d-accent transition-colors"
                >
                    {pdfFile ? (
                        <div className="text-center">
                            <PdfFileIcon className="mx-auto h-16 w-16 text-accent dark:text-d-accent" />
                            <p className="mt-2 font-semibold truncate">{pdfFile.name}</p>
                            <p className="text-sm text-text-secondary dark:text-d-text-secondary">{formatBytes(pdfFile.size)}</p>
                        </div>
                    ) : (
                        <EmptyState Icon={CompressIcon} message="Click or drop a PDF to compress" />
                    )}
                </div>

                <div className="bg-secondary dark:bg-d-secondary p-6 rounded-2xl border border-border-color dark:border-d-border-color space-y-6">
                    <div>
                        <label className="block font-semibold mb-2">{t('tools.pdfCompressor.compressionLevel')}</label>
                        <div className="flex bg-primary dark:bg-d-primary p-1 rounded-md">
                            {(['low', 'medium', 'high'] as CompressionLevel[]).map(level => (
                                <button key={level} onClick={() => setCompressionLevel(level)} className={`w-1/3 py-1 text-xs rounded ${compressionLevel === level ? 'bg-secondary dark:bg-d-secondary shadow' : ''}`}>
                                    {t(`tools.pdfCompressor.level_${level}`)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={handleCompress}
                        disabled={!pdfFile || isProcessing}
                        className="w-full py-3 bg-accent text-white font-bold rounded-lg disabled:opacity-50"
                    >
                        {isProcessing ? 'Compressing...' : t('tools.pdfCompressor.compressButton')}
                    </button>
                    
                    {result && (
                        <div className="space-y-3 pt-4 border-t border-border-color dark:border-d-border-color">
                            <div className="flex justify-between text-sm"><span>{t('tools.pdfCompressor.originalSize')}:</span> <strong>{formatBytes(result.originalSize)}</strong></div>
                            <div className="flex justify-between text-sm"><span>{t('tools.pdfCompressor.compressedSize')}:</span> <strong>{formatBytes(result.compressedSize)}</strong></div>
                            <div className="flex justify-between text-sm text-green-600 dark:text-green-400"><span>{t('tools.pdfCompressor.reduction')}:</span> <strong>{reduction}%</strong></div>
                            <a
                                href={URL.createObjectURL(result.blob)}
                                download={`compressed_${pdfFile?.name}`}
                                className="block w-full text-center mt-4 py-2 bg-green-600 text-white font-bold rounded-lg"
                            >
                                {t('tools.pdfCompressor.download')}
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PdfCompressor;
