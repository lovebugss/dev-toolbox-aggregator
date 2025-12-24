import React, { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import { useToolState } from '../contexts/ToolStateContext';
import { useToasts } from '../contexts/ToastContext';
import { ToolHeader } from '../components/ui/ToolHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { PdfFileIcon, ScissorsIcon, DownloadIcon } from '../components/icons/Icons';

interface PdfSplitterState {
    mode: 'all' | 'range';
    range: string;
}

const PdfDropzone: React.FC<{ onFile: (file: File) => void, children: React.ReactNode }> = ({ onFile, children }) => {
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault(); e.stopPropagation();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) onFile(e.dataTransfer.files[0]);
    };
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();
    return <div onDrop={handleDrop} onDragOver={handleDragOver}>{children}</div>;
};

const PdfSplitter: React.FC = () => {
    const { t } = useTranslation();
    const addToast = useToasts();
    const { state, setState } = useToolState<PdfSplitterState>('pdf-splitter', {
        mode: 'all',
        range: '',
    });
    const { mode, range } = state;

    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [pageCount, setPageCount] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = useCallback(async (file: File) => {
        if (file.type !== 'application/pdf') {
            addToast('Please select a valid PDF file.', 'error');
            return;
        }
        setPdfFile(file);
        setIsProcessing(true);
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            setPageCount(pdfDoc.getPageCount());
        } catch (error) {
            addToast('Failed to load PDF.', 'error');
            setPdfFile(null);
            setPageCount(0);
        } finally {
            setIsProcessing(false);
        }
    }, [addToast]);

    const parseRange = (rangeStr: string, max: number): number[] => {
        const result = new Set<number>();
        const parts = rangeStr.split(',');
        for (const part of parts) {
            if (part.includes('-')) {
                const [start, end] = part.split('-').map(s => parseInt(s.trim()));
                if (!isNaN(start) && !isNaN(end)) {
                    for (let i = start; i <= end; i++) {
                        if (i >= 1 && i <= max) result.add(i - 1);
                    }
                }
            } else {
                const num = parseInt(part.trim());
                if (!isNaN(num) && num >= 1 && num <= max) result.add(num - 1);
            }
        }
        return Array.from(result);
    };

    const handleSplit = async () => {
        if (!pdfFile) return;
        setIsProcessing(true);
        try {
            const existingPdfBytes = await pdfFile.arrayBuffer();
            const pdfDoc = await PDFDocument.load(existingPdfBytes);

            if (mode === 'all') {
                const zip = new JSZip();
                for (let i = 0; i < pdfDoc.getPageCount(); i++) {
                    const newDoc = await PDFDocument.create();
                    const [copiedPage] = await newDoc.copyPages(pdfDoc, [i]);
                    newDoc.addPage(copiedPage);
                    const pdfBytes = await newDoc.save();
                    zip.file(`page_${i + 1}.pdf`, pdfBytes);
                }
                const zipBlob = await zip.generateAsync({ type: 'blob' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(zipBlob);
                link.download = `${pdfFile.name.replace('.pdf', '')}_pages.zip`;
                link.click();
            } else {
                const pageIndices = parseRange(range, pageCount);
                if (pageIndices.length === 0) {
                    addToast('Invalid or empty page range specified.', 'error');
                    return;
                }
                const newDoc = await PDFDocument.create();
                const copiedPages = await newDoc.copyPages(pdfDoc, pageIndices);
                copiedPages.forEach(page => newDoc.addPage(page));
                const pdfBytes = await newDoc.save();
                const blob = new Blob([pdfBytes], { type: 'application/pdf' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `${pdfFile.name.replace('.pdf', '')}_split.pdf`;
                link.click();
            }
        } catch (error) {
            addToast(`An error occurred: ${(error as Error).message}`, 'error');
        } finally {
            setIsProcessing(false);
        }
    };
    
    return (
        <div>
            <ToolHeader title={t('tools.pdfSplitter.pageTitle')} description={t('tools.pdfSplitter.pageDescription')} />
            <input type="file" accept="application/pdf" ref={fileInputRef} onChange={e => e.target.files && handleFileSelect(e.target.files[0])} className="hidden" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <PdfDropzone onFile={handleFileSelect}>
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className={`cursor-pointer h-full p-6 bg-secondary dark:bg-d-secondary rounded-2xl border-2 border-dashed  hover:border-accent dark:hover:border-d-accent transition-colors
                            ${pdfFile ? 'border-accent dark:border-d-accent' : 'border-border-color dark:border-d-border-color'}`}
                    >
                        {pdfFile ? (
                            <div className="text-center">
                                <PdfFileIcon className="mx-auto h-16 w-16 text-accent dark:text-d-accent" />
                                <p className="mt-2 font-semibold truncate">{pdfFile.name}</p>
                                <p className="text-sm text-text-secondary dark:text-d-text-secondary">{pageCount} pages</p>
                                <p className="text-xs mt-4">{t('tools.base64ImageConverter.dropzone')}</p>
                            </div>
                        ) : (
                            <EmptyState Icon={ScissorsIcon} message={t('tools.pdfToPng.uploadButton')} />
                        )}
                    </div>
                </PdfDropzone>

                <div className="bg-secondary dark:bg-d-secondary p-6 rounded-2xl border border-border-color dark:border-d-border-color space-y-6">
                    <div>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="mode" value="all" checked={mode === 'all'} onChange={() => setState(s => ({...s, mode: 'all'}))} />
                                {t('tools.pdfSplitter.extractAll')}
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="mode" value="range" checked={mode === 'range'} onChange={() => setState(s => ({...s, mode: 'range'}))} />
                                {t('tools.pdfSplitter.extractRange')}
                            </label>
                        </div>
                        {mode === 'range' && (
                            <input
                                type="text"
                                value={range}
                                onChange={e => setState(s => ({...s, range: e.target.value}))}
                                placeholder={t('tools.pdfSplitter.rangePlaceholder') as string}
                                className="w-full mt-2 p-2 bg-primary dark:bg-d-primary rounded-md"
                            />
                        )}
                    </div>
                    <button
                        onClick={handleSplit}
                        disabled={!pdfFile || isProcessing}
                        className="w-full py-3 bg-accent text-white font-bold rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isProcessing ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        ) : (
                            <DownloadIcon />
                        )}
                        <span>{isProcessing ? 'Processing...' : t('tools.pdfSplitter.splitButton')}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PdfSplitter;
