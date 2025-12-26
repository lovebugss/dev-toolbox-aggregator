import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import JSZip from 'jszip';
import { useToasts } from '../contexts/ToastContext';
import { ToolHeader } from '../components/ui/ToolHeader';
import { PdfFileIcon, DownloadIcon } from '../components/icons/Icons';

// Access pdf.js from the window object
declare const window: {
    pdfjsLib: any;
};

interface PngImage {
    url: string;      // 使用 Blob URL 替代 Base64
    blob: Blob;       //以此用于下载，避免再次转换
    pageNumber: number;
    width: number;
    height: number;
}

const PdfToPng: React.FC = () => {
    const { t } = useTranslation();
    const addToast = useToasts();

    const [images, setImages] = useState<PngImage[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    // 组件卸载或重置时，清理生成的 Blob URL 以释放内存
    const cleanupImages = useCallback((imgs: PngImage[]) => {
        imgs.forEach(img => URL.revokeObjectURL(img.url));
    }, []);

    useEffect(() => {
        return () => {
            cleanupImages(images);
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const resetState = () => {
        // 取消正在进行的任务
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        cleanupImages(images); // 清理旧内存
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

        // 创建新的 AbortController
        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                if (abortController.signal.aborted) return;

                const arrayBuffer = e.target?.result as ArrayBuffer;

                // 设置 worker 路径（如果需要显式设置）
                // window.pdfjsLib.GlobalWorkerOptions.workerSrc = '...';

                const loadingTask = window.pdfjsLib.getDocument({
                    data: arrayBuffer,
                    cMapUrl: '/dev-toolbox-aggregator/cmaps/',
                    cMapPacked: true,
                });

                const pdf = await loadingTask.promise;

                if (abortController.signal.aborted) return;

                setProgress({ current: 0, total: pdf.numPages });

                for (let i = 1; i <= pdf.numPages; i++) {
                    // 检查取消信号
                    if (abortController.signal.aborted) break;

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

                        // 将 Canvas 转为 Blob (比 Base64 更省内存且更快)
                        const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));

                        if (blob) {
                            const url = URL.createObjectURL(blob);
                            const newImage: PngImage = {
                                url,
                                blob,
                                pageNumber: i,
                                width: viewport.width,
                                height: viewport.height
                            };

                            // 增量更新状态，让用户每处理完一页就能看到
                            setImages(prev => [...prev, newImage]);
                        }
                    }

                    // 更新进度
                    setProgress({ current: i, total: pdf.numPages });

                    // 关键优化：释放主线程，防止 UI 卡死
                    await new Promise(resolve => setTimeout(resolve, 0));
                }
            } catch (error) {
                if (!abortController.signal.aborted) {
                    addToast(`Error processing PDF: ${(error as Error).message}`, 'error');
                }
            } finally {
                if (!abortController.signal.aborted) {
                    setIsProcessing(false);
                    setProgress(null);
                }
            }
        };
        reader.readAsArrayBuffer(file);

    }, [addToast, cleanupImages, images]); // 添加必要的依赖

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
        if (images.length === 0) return;

        try {
            const zip = new JSZip();
            // 直接使用 Blob，速度极快
            images.forEach((image) => {
                zip.file(`page_${image.pageNumber}.png`, image.blob);
            });

            const zipBlob = await zip.generateAsync({ type: 'blob' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(zipBlob);
            link.download = 'pdf-pages.zip';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
        } catch (error) {
            addToast('Error generating ZIP file', 'error');
        }
    };

    return (
        <div>
            <ToolHeader title={t('tools.pdfToPng.pageTitle')} description={t('tools.pdfToPng.pageDescription')} />

            {/* 上传区域：仅在没有图片且不在处理时显示 */}
            {images.length === 0 && !isProcessing && (
                <div
                    className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border-color dark:border-d-border-color rounded-lg h-80 bg-secondary dark:bg-d-secondary hover:border-accent dark:hover:border-d-accent transition-colors cursor-pointer"
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input type="file" accept="application/pdf" onChange={handleFileChange} className="hidden" ref={fileInputRef} />
                    <div className="text-center">
                        <PdfFileIcon className="mx-auto h-16 w-16 text-text-secondary dark:text-d-text-secondary" />
                        <p className="mt-4 text-sm text-text-secondary dark:text-d-text-secondary">
                            <span className="font-semibold text-accent dark:text-d-accent hover:opacity-80">
                                {t('tools.pdfToPng.uploadButton')}
                            </span>
                            {' '}{t('tools.pdfToPng.dropzone')}
                        </p>
                        <p className="text-xs text-text-secondary dark:text-d-text-secondary mt-1">{t('tools.pdfToPng.fileTypes')}</p>
                    </div>
                </div>
            )}

            {/* 处理中状态 或 结果显示区域 */}
            {(isProcessing || images.length > 0) && (
                <div className="space-y-6">
                    {/* 操作栏 */}
                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                        <div className="flex gap-4">
                            <button
                                onClick={handleDownloadAll}
                                disabled={isProcessing || images.length === 0}
                                className="px-6 py-3 bg-accent dark:bg-d-accent text-white dark:text-d-primary font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {t('tools.pdfToPng.downloadAllButton')}
                            </button>
                            <button
                                onClick={resetState}
                                className="px-6 py-3 bg-secondary dark:bg-d-secondary ring-1 ring-inset ring-border-color dark:ring-d-border-color text-text-primary dark:text-d-text-primary font-semibold rounded-lg hover:bg-border-color dark:hover:bg-d-border-color transition-colors"
                            >
                                {isProcessing ? t('tools.pdfToPng.cancel') : t('tools.pdfToPng.reset')}
                            </button>
                        </div>

                        {/* 进度提示 */}
                        {isProcessing && progress && (
                            <div className="flex items-center gap-3 text-sm font-medium text-text-secondary dark:text-d-text-secondary">
                                <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
                                {t('tools.pdfToPng.renderingPage', { currentPage: progress.current, totalPages: progress.total })}
                            </div>
                        )}
                    </div>

                    {/* 图片网格 - 支持增量显示 */}
                    {images.length > 0 && (
                        <div>
                            <h3 className="text-xl font-bold mb-4">{t('tools.pdfToPng.output')} ({images.length})</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                {images.map(image => (
                                    <div key={image.pageNumber} className="group relative bg-secondary dark:bg-d-secondary p-2 rounded-lg border border-border-color dark:border-d-border-color">
                                        <div className="aspect-[1/1.4] overflow-hidden rounded-md bg-gray-100 dark:bg-gray-800 relative">
                                            <img src={image.url} alt={`Page ${image.pageNumber}`} className="w-full h-full object-contain" loading="lazy" />
                                        </div>
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 rounded-lg">
                                            <p className="text-white font-bold text-lg mb-2">Page {image.pageNumber}</p>
                                            <a
                                                href={image.url}
                                                download={`page_${image.pageNumber}.png`}
                                                className="px-3 py-1.5 bg-white text-black text-xs font-semibold rounded-md flex items-center gap-1.5 hover:bg-gray-200 transition-colors"
                                            >
                                                <DownloadIcon className="w-4 h-4" />
                                                {t('tools.pdfToPng.downloadButton', { pageNumber: image.pageNumber })}
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default PdfToPng;
