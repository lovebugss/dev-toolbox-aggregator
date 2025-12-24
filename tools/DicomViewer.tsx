import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useToasts } from '../contexts/ToastContext';
import { ToolHeader } from '../components/ui/ToolHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { DicomFileIcon } from '../components/icons/Icons';
import { LabeledControl } from '../components/ui/LabeledControl';

// dicomParser is loaded from a script tag in index.html
declare const dicomParser: any;

interface DicomTag {
    id: string;
    name: string;
    value: string;
}

const DicomViewer: React.FC = () => {
    const { t } = useTranslation();
    const addToast = useToasts();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [dataSet, setDataSet] = useState<any | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [fileName, setFileName] = useState<string | null>(null);
    
    // Windowing state
    const [windowCenter, setWindowCenter] = useState(50);
    const [windowWidth, setWindowWidth] = useState(400);

    const resetState = () => {
        setDataSet(null);
        setError(null);
        setIsProcessing(false);
        setFileName(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const getTag = useCallback((tagId: string): string => {
        if (!dataSet) return 'N/A';
        try {
            const element = dataSet.elements[tagId];
            return element ? dataSet.string(tagId) : 'N/A';
        } catch (e) {
            return 'N/A';
        }
    }, [dataSet]);

    const dicomTags: DicomTag[] = useMemo(() => [
        { id: 'x00100010', name: t('tools.dicomViewer.patientName'), value: getTag('x00100010') },
        { id: 'x00100020', name: t('tools.dicomViewer.patientID'), value: getTag('x00100020') },
        { id: 'x00080020', name: t('tools.dicomViewer.studyDate'), value: getTag('x00080020') },
        { id: 'x00081030', name: t('tools.dicomViewer.studyDescription'), value: getTag('x00081030') },
        { id: 'x00080060', name: t('tools.dicomViewer.modality'), value: getTag('x00080060') },
        { id: 'x0008103e', name: t('tools.dicomViewer.seriesDescription'), value: getTag('x0008103e') },
    ], [getTag, t]);

    const renderDicomImage = useCallback(() => {
        if (!dataSet || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const pixelDataElement = dataSet.elements.x7fe00010;
        if (!pixelDataElement) return;

        const rows = dataSet.uint16('x00280010');
        const columns = dataSet.uint16('x00280011');
        canvas.width = columns;
        canvas.height = rows;

        const slope = dataSet.floatString('x00281053') || 1;
        const intercept = dataSet.floatString('x00281052') || 0;
        
        const pixelData = new Uint16Array(dataSet.byteArray.buffer, pixelDataElement.dataOffset, pixelDataElement.length / 2);
        
        const imageData = ctx.createImageData(columns, rows);
        
        const low = windowCenter - windowWidth / 2;
        const high = windowCenter + windowWidth / 2;
        
        for (let i = 0; i < pixelData.length; i++) {
            const rawValue = pixelData[i] * slope + intercept;
            
            let intensity = 0;
            if (rawValue <= low) {
                intensity = 0;
            } else if (rawValue > high) {
                intensity = 255;
            } else {
                intensity = ((rawValue - low) / windowWidth) * 255;
            }
            
            const j = i * 4;
            imageData.data[j] = intensity;
            imageData.data[j + 1] = intensity;
            imageData.data[j + 2] = intensity;
            imageData.data[j + 3] = 255; // Alpha
        }

        ctx.putImageData(imageData, 0, 0);
    }, [dataSet, windowCenter, windowWidth]);
    
    useEffect(() => {
        renderDicomImage();
    }, [renderDicomImage]);
    
    const handleFileSelect = useCallback(async (file: File) => {
        if (!file) return;

        resetState();
        setIsProcessing(true);
        setFileName(file.name);

        try {
            const arrayBuffer = await file.arrayBuffer();
            const byteArray = new Uint8Array(arrayBuffer);
            const parsedDataSet = dicomParser.parseDicom(byteArray);
            
            setWindowCenter(parsedDataSet.floatString('x00281050') || 50);
            setWindowWidth(parsedDataSet.floatString('x00281051') || 400);
            setDataSet(parsedDataSet);
        } catch (error) {
            setError((error as Error).message);
            addToast(`Error parsing DICOM file: ${(error as Error).message}`, 'error');
        } finally {
            setIsProcessing(false);
        }
    }, [addToast]);
    
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0]);
    };
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();
    
    const resetWindowing = () => {
        if (dataSet) {
            setWindowCenter(dataSet.floatString('x00281050') || 50);
            setWindowWidth(dataSet.floatString('x00281051') || 400);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <ToolHeader title={t('tools.dicomViewer.pageTitle')} description={t('tools.dicomViewer.pageDescription')} />
            <input type="file" accept=".dcm" ref={fileInputRef} onChange={e => e.target.files && handleFileSelect(e.target.files[0])} className="hidden" />

            <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-6 flex-grow min-h-0">
                {/* Left Panel: File, Tags, Controls */}
                <div className="flex flex-col gap-4">
                    <div onClick={() => fileInputRef.current?.click()} onDrop={handleDrop} onDragOver={handleDragOver} className="cursor-pointer p-4 h-32 bg-secondary dark:bg-d-secondary rounded-lg border-2 border-dashed border-border-color hover:border-accent flex items-center justify-center text-center">
                        {isProcessing ? t('tools.dicomViewer.processing') : fileName ? (
                            <div>
                                <DicomFileIcon className="w-8 h-8 mx-auto text-accent"/>
                                <p className="text-sm font-semibold truncate mt-1">{fileName}</p>
                            </div>
                        ) : (
                            <div>
                                <DicomFileIcon className="w-8 h-8 mx-auto text-text-secondary"/>
                                <p className="text-sm text-text-secondary">{t('tools.dicomViewer.uploadButton')}</p>
                            </div>
                        )}
                    </div>

                    <div className="p-4 bg-secondary dark:bg-d-secondary rounded-lg border border-border-color">
                        <h3 className="font-semibold mb-2">{t('tools.dicomViewer.tags')}</h3>
                        <div className="space-y-1 text-xs">
                            {dicomTags.map(tag => (
                                <div key={tag.id} className="flex justify-between">
                                    <span className="text-text-secondary">{tag.name}:</span>
                                    <span className="font-mono text-text-primary dark:text-d-text-primary">{tag.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="p-4 bg-secondary dark:bg-d-secondary rounded-lg border border-border-color">
                        <h3 className="font-semibold mb-2">{t('tools.dicomViewer.imageControls')}</h3>
                        <div className="space-y-3">
                            <LabeledControl label={t('tools.dicomViewer.windowCenter')} valueDisplay={String(windowCenter)}>
                                <input type="range" min="-1000" max="2000" value={windowCenter} onChange={e => setWindowCenter(parseInt(e.target.value, 10))} className="w-full accent-accent" />
                            </LabeledControl>
                             <LabeledControl label={t('tools.dicomViewer.windowWidth')} valueDisplay={String(windowWidth)}>
                                <input type="range" min="1" max="4000" value={windowWidth} onChange={e => setWindowWidth(parseInt(e.target.value, 10))} className="w-full accent-accent" />
                            </LabeledControl>
                            <button onClick={resetWindowing} className="w-full text-sm py-1.5 bg-primary dark:bg-d-primary rounded-md hover:bg-border-color">{t('tools.dicomViewer.reset')}</button>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Viewer */}
                <div className="bg-black rounded-lg border border-border-color flex items-center justify-center overflow-auto p-2">
                    {dataSet ? (
                        <canvas ref={canvasRef} className="max-w-full max-h-full object-contain" />
                    ) : (
                        <EmptyState Icon={DicomFileIcon} message={t('tools.dicomViewer.noImage')} />
                    )}
                    {error && <p className="text-red-500">{error}</p>}
                </div>
            </div>
        </div>
    );
};

export default DicomViewer;
