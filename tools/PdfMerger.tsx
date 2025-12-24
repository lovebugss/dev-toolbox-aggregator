import React, { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { PDFDocument } from 'pdf-lib';
import { useToolState } from '../contexts/ToolStateContext';
import { useToasts } from '../contexts/ToastContext';
import { ToolHeader } from '../components/ui/ToolHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { PdfFileIcon, DownloadIcon, TrashIcon, DragHandleIcon } from '../components/icons/Icons';

interface PdfFile {
    id: string;
    file: File;
    pageCount: number;
}

const PdfDropzone: React.FC<{ onFiles: (files: FileList) => void, children: React.ReactNode }> = ({ onFiles, children }) => {
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault(); e.stopPropagation();
        if (e.dataTransfer.files) onFiles(e.dataTransfer.files);
    };
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();
    return <div onDrop={handleDrop} onDragOver={handleDragOver} className="h-full">{children}</div>;
};

const PdfMerger: React.FC = () => {
    const { t } = useTranslation();
    const addToast = useToasts();
    
    const [pdfFiles, setPdfFiles] = useState<PdfFile[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [draggedId, setDraggedId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = useCallback(async (files: FileList) => {
        setIsProcessing(true);
        const newFiles: PdfFile[] = [];
        for (const file of Array.from(files)) {
            if (file.type !== 'application/pdf') continue;
            try {
                const arrayBuffer = await file.arrayBuffer();
                const pdfDoc = await PDFDocument.load(arrayBuffer);
                newFiles.push({
                    id: file.name + Date.now(),
                    file,
                    pageCount: pdfDoc.getPageCount(),
                });
            } catch (error) {
                addToast(`Could not load ${file.name}.`, 'error');
            }
        }
        setPdfFiles(prev => [...prev, ...newFiles]);
        setIsProcessing(false);
    }, [addToast]);
    
    const handleMerge = async () => {
        if (pdfFiles.length < 2) {
            addToast('Please upload at least two PDF files to merge.', 'info');
            return;
        }
        setIsProcessing(true);
        try {
            const mergedPdf = await PDFDocument.create();
            for (const pdfFile of pdfFiles) {
                const pdfBytes = await pdfFile.file.arrayBuffer();
                const pdfDoc = await PDFDocument.load(pdfBytes);
                const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
                copiedPages.forEach((page) => mergedPdf.addPage(page));
            }
            const mergedPdfBytes = await mergedPdf.save();
            const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = "merged.pdf";
            link.click();
        } catch(error) {
            addToast(`An error occurred: ${(error as Error).message}`, 'error');
        } finally {
            setIsProcessing(false);
        }
    };
    
    const handleDragStart = (id: string) => setDraggedId(id);
    const handleDragEnter = (id: string) => {
        if (draggedId === null || draggedId === id) return;
        const newFiles = [...pdfFiles];
        const draggedIndex = newFiles.findIndex(f => f.id === draggedId);
        const targetIndex = newFiles.findIndex(f => f.id === id);
        const [draggedItem] = newFiles.splice(draggedIndex, 1);
        newFiles.splice(targetIndex, 0, draggedItem);
        setPdfFiles(newFiles);
    };

    return (
        <div>
            <ToolHeader title={t('tools.pdfMerger.pageTitle')} description={t('tools.pdfMerger.pageDescription')} />
            <input type="file" accept="application/pdf" multiple ref={fileInputRef} onChange={e => e.target.files && handleFileSelect(e.target.files)} className="hidden" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-[calc(100vh-300px)]">
                <PdfDropzone onFiles={handleFileSelect}>
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="cursor-pointer h-full p-6 bg-secondary dark:bg-d-secondary rounded-2xl border-2 border-dashed border-border-color dark:border-d-border-color hover:border-accent dark:hover:border-d-accent transition-colors flex flex-col"
                    >
                        <h3 className="text-lg font-semibold">{t('tools.pdfMerger.uploadedPdfs')} ({pdfFiles.length})</h3>
                        <div className="flex-grow mt-4 overflow-y-auto pr-2 space-y-2">
                            {pdfFiles.length === 0 ? (
                                <EmptyState Icon={PdfFileIcon} message="Drop PDFs here or click to upload"/>
                            ) : (
                                pdfFiles.map(pdf => (
                                    <div 
                                        key={pdf.id}
                                        draggable
                                        onDragStart={() => handleDragStart(pdf.id)}
                                        onDragEnter={() => handleDragEnter(pdf.id)}
                                        onDragEnd={() => setDraggedId(null)}
                                        className={`flex items-center p-2 rounded-md bg-primary dark:bg-d-primary cursor-grab ${draggedId === pdf.id ? 'opacity-50' : ''}`}
                                    >
                                        <DragHandleIcon className="w-5 h-5 text-text-secondary dark:text-d-text-secondary mr-2 flex-shrink-0" />
                                        <div className="flex-grow text-sm truncate">
                                            <p className="font-semibold truncate">{pdf.file.name}</p>
                                            <p className="text-text-secondary dark:text-d-text-secondary">{t('tools.pdfMerger.page_count_plural', { count: pdf.pageCount })}</p>
                                        </div>
                                        <button onClick={() => setPdfFiles(files => files.filter(f => f.id !== pdf.id))} className="p-2 text-red-500 hover:bg-red-500/10 rounded-full flex-shrink-0">
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </PdfDropzone>

                <div className="flex items-center justify-center bg-secondary dark:bg-d-secondary p-6 rounded-2xl border border-border-color dark:border-d-border-color">
                    <button
                        onClick={handleMerge}
                        disabled={pdfFiles.length < 2 || isProcessing}
                        className="w-full max-w-xs py-4 bg-accent text-white font-bold rounded-lg disabled:opacity-50 flex items-center justify-center gap-2 text-lg"
                    >
                        {isProcessing ? (
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                        ) : (
                            <DownloadIcon className="w-6 h-6"/>
                        )}
                        <span>{isProcessing ? 'Merging...' : t('tools.pdfMerger.mergeButton')}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PdfMerger;
