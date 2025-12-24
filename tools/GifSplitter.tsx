import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { parseGIF, decompressFrames } from 'gifuct-js';
import JSZip from 'jszip';
import GIF from 'gif.js.optimized';
import { v4 as uuidv4 } from 'uuid';
import * as fabric from 'fabric';
import { 
    DownloadIcon, TrashIcon, ScissorsIcon, RefreshIcon, SlidersIcon, TypeIcon, 
    FiltersIcon, UndoIcon, RedoIcon, ResizeIcon, LayoutIcon 
} from '../components/icons/Icons';
import { ToolHeader } from '../components/ui/ToolHeader';
import { Accordion } from '../components/ui/Accordion';
import { LabeledControl } from '../components/ui/LabeledControl';

// --- TYPES ---
interface FrameData {
    id: string;
    thumbnail: string;
    delay: number;
    canvasState: string;
    history: string[];
    historyIndex: number;
    width: number;
    height: number;
}
interface GifInfo {
    width: number;
    height: number;
}
type PanelType = 'crop' | 'transform' | 'filters' | 'adjustments' | 'text' | 'export' | 'resize';

// --- DEBOUNCE UTILITY ---
const debounce = <F extends (...args: any[]) => void>(func: F, waitFor: number) => {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    return (...args: Parameters<F>): void => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), waitFor);
    };
};

// --- UI SUB-COMPONENTS ---
const ToolbarButton: React.FC<{
  icon: React.ComponentType; label: string; isActive: boolean; onClick: () => void;
}> = ({ icon: Icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    title={label}
    className={`flex flex-col items-center justify-center w-full h-16 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
      isActive
        ? 'bg-accent/10 dark:bg-d-accent/20 text-accent dark:text-d-accent'
        : 'text-text-secondary dark:text-d-text-secondary hover:bg-primary dark:hover:bg-d-primary'
    }`}
  >
    <Icon />
    <span className="text-xs mt-1">{label}</span>
  </button>
);

const PropertiesPanel: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="p-4">
    <h3 className="text-lg font-bold mb-4 px-2 text-text-primary dark:text-d-text-primary">{title}</h3>
    <div className="space-y-4">{children}</div>
  </div>
);

// --- MAIN COMPONENT ---
const GifSplitter: React.FC = () => {
    const { t } = useTranslation();
    const [frames, setFrames] = useState<FrameData[]>([]);
    const [selectedFrameId, setSelectedFrameId] = useState<string | null>(null);
    const [selectedFrameIds, setSelectedFrameIds] = useState<string[]>([]);
    const [gifInfo, setGifInfo] = useState<GifInfo | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [globalDelay, setGlobalDelay] = useState<string>('100');
    const [quality, setQuality] = useState<string>('10');
    
    // Editor State
    const [activePanel, setActivePanel] = useState<PanelType | null>(null);
    const [activeObject, setActiveObject] = useState<fabric.Object | null>(null);
    const [isCropping, setIsCropping] = useState(false);
    const [zoom, setZoom] = useState(1);
    const [resizeValues, setResizeValues] = useState({ width: 0, height: 0 });
    const [adjustments, setAdjustments] = useState({
        brightness: 0, blur: 0, noise: 0, pixelate: 1, hue: 0,
        removeColor: { color: '#000000', distance: 0, enabled: false }
    });
    const [activeFilter, setActiveFilter] = useState<string>('none');
    
    const gifInputRef = useRef<HTMLInputElement>(null);
    const imagesInputRef = useRef<HTMLInputElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
    const imageRef = useRef<fabric.Image | null>(null);
    const cropRectRef = useRef<fabric.Rect | null>(null);

    const selectedFrame = frames.find(f => f.id === selectedFrameId);
    const allSelected = frames.length > 0 && selectedFrameIds.length === frames.length;
    const activeTextObject = activeObject instanceof fabric.IText ? activeObject : null;

    // --- STATE & HISTORY LOGIC ---
    const resetState = useCallback(() => {
        setIsLoading(false);
        setFrames([]);
        setSelectedFrameId(null);
        setSelectedFrameIds([]);
        setGifInfo(null);
        setError(null);
        setPreviewUrl(null);
        setGlobalDelay('100');
        fabricCanvasRef.current?.clear();
        if (gifInputRef.current) gifInputRef.current.value = '';
        if (imagesInputRef.current) imagesInputRef.current.value = '';
        setActivePanel(null);
    }, []);

    const saveState = useCallback(() => {
        const canvas = fabricCanvasRef.current;
        if (!canvas || !selectedFrameId) return;

        const stateToSave = canvas.toJSON();
        const jsonState = JSON.stringify(stateToSave);
        
        setFrames(currentFrames => {
            const frameIndex = currentFrames.findIndex(f => f.id === selectedFrameId);
            if (frameIndex === -1) return currentFrames;

            const frame = currentFrames[frameIndex];
            const newHistory = frame.history.slice(0, frame.historyIndex + 1);
            if (newHistory[newHistory.length - 1] === jsonState) return currentFrames;
            
            newHistory.push(jsonState);

            const updatedFrame = {
                ...frame,
                width: canvas.getWidth(),
                height: canvas.getHeight(),
                canvasState: jsonState,
                thumbnail: canvas.toDataURL({ format: 'png', quality: 0.1, multiplier: 1 }),
                history: newHistory,
                historyIndex: newHistory.length - 1
            };

            const newFrames = [...currentFrames];
            newFrames[frameIndex] = updatedFrame;
            return newFrames;
        });
    }, [selectedFrameId]);
    
    const debouncedSaveState = useMemo(() => debounce(saveState, 500), [saveState]);

    const loadFrameState = useCallback((frame: FrameData) => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;
        try {
            canvas.setWidth(frame.width);
            canvas.setHeight(frame.height);
            canvas.loadFromJSON(frame.canvasState, () => {
                canvas.renderAll();
                imageRef.current = canvas.backgroundImage as fabric.Image;
                setResizeValues({width: canvas.getWidth(), height: canvas.getHeight()});
            });
        } catch(e) {
            console.error("Failed to parse frame state:", e);
        }
    }, []);

    const handleUndo = () => {
        if (!selectedFrame) return;
        if (selectedFrame.historyIndex > 0) {
            const newIndex = selectedFrame.historyIndex - 1;
            const stateToLoad = JSON.parse(selectedFrame.history[newIndex]);
            fabricCanvasRef.current?.loadFromJSON(stateToLoad, () => {
                fabricCanvasRef.current?.renderAll();
                imageRef.current = fabricCanvasRef.current?.backgroundImage as fabric.Image;
            });
            setFrames(frames.map(f => f.id === selectedFrameId ? { ...f, historyIndex: newIndex, canvasState: selectedFrame.history[newIndex] } : f));
        }
    };

    const handleRedo = () => {
        if (!selectedFrame) return;
        if (selectedFrame.historyIndex < selectedFrame.history.length - 1) {
            const newIndex = selectedFrame.historyIndex + 1;
            const stateToLoad = JSON.parse(selectedFrame.history[newIndex]);
            fabricCanvasRef.current?.loadFromJSON(stateToLoad, () => {
                fabricCanvasRef.current?.renderAll();
                imageRef.current = fabricCanvasRef.current?.backgroundImage as fabric.Image;
            });
            setFrames(frames.map(f => f.id === selectedFrameId ? { ...f, historyIndex: newIndex, canvasState: selectedFrame.history[newIndex] } : f));
        }
    };
    
    // --- FILE PROCESSING ---
    const processGifFile = useCallback((file: File) => {
        if (file.type !== 'image/gif') { setError(t('tools.gifCreator.errorNotGif')); return; }
        resetState();
        setIsLoading(true);
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const buffer = e.target?.result as ArrayBuffer;
                const gif = parseGIF(buffer);
                const decompressedFrames = decompressFrames(gif, true);
                const { width, height } = gif.lsd;
                setGifInfo({ width, height });
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = width; tempCanvas.height = height;
                const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
                if (!tempCtx) throw new Error('Could not create canvas context');

                const fabricTempCanvas = new fabric.Canvas(null as any);
                fabricTempCanvas.setWidth(width);
                fabricTempCanvas.setHeight(height);

                let lastFrameImageData: ImageData | null = null;
                const newFrames: FrameData[] = [];

                for (const frame of decompressedFrames) {
                    const { dims, disposalType } = frame;
                    if (lastFrameImageData) {
                        tempCtx.putImageData(lastFrameImageData, 0, 0);
                        if(disposalType === 3) lastFrameImageData = null;
                    }
                    if (disposalType === 3) lastFrameImageData = tempCtx.getImageData(0, 0, width, height);

                    const frameImageData = tempCtx.createImageData(dims.width, dims.height);
                    frameImageData.data.set(frame.patch);
                    tempCtx.putImageData(frameImageData, dims.left, dims.top);
                    
                    const dataURL = tempCanvas.toDataURL('image/png');
                    
                    const img = await fabric.Image.fromURL(dataURL);
                    fabricTempCanvas.backgroundImage = img;
                    fabricTempCanvas.renderAll();
                    const canvasState = JSON.stringify(fabricTempCanvas.toJSON());

                    newFrames.push({
                        id: uuidv4(),
                        thumbnail: dataURL,
                        delay: frame.delay,
                        canvasState,
                        history: [canvasState],
                        historyIndex: 0,
                        width: width,
                        height: height,
                    });
                     if (disposalType === 2) tempCtx.clearRect(0, 0, width, height);
                }
                setFrames(newFrames);
            } catch (err) { setError(t('tools.gifCreator.errorParsing')); } finally { setIsLoading(false); }
        };
        reader.onerror = () => { setError(t('tools.gifCreator.errorReading')); setIsLoading(false); };
        reader.readAsArrayBuffer(file);
    }, [resetState, t]);

    const processImageFiles = useCallback((files: FileList) => {
        resetState();
        setIsLoading(true);
        const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
        if (imageFiles.length === 0) {
            setError(t('tools.gifCreator.errorNoImages'));
            setIsLoading(false);
            return;
        }

        let firstWidth: number, firstHeight: number;
        
        const filePromises = imageFiles.map(file => new Promise<FrameData | null>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    if (!firstWidth) {
                        firstWidth = img.width;
                        firstHeight = img.height;
                        setGifInfo({ width: firstWidth, height: firstHeight });
                    }
                    const fabricTempCanvas = new fabric.Canvas(null as any);
                    fabricTempCanvas.setWidth(img.width);
                    fabricTempCanvas.setHeight(img.height);
                    const fabImg = new fabric.Image(img);
                    fabricTempCanvas.backgroundImage = fabImg;
                    fabricTempCanvas.renderAll();
                    const canvasState = JSON.stringify(fabricTempCanvas.toJSON());

                    resolve({
                        id: uuidv4(),
                        thumbnail: e.target?.result as string,
                        delay: 100,
                        canvasState,
                        history: [canvasState],
                        historyIndex: 0,
                        width: img.width,
                        height: img.height,
                    });
                };
                img.onerror = () => resolve(null);
                img.src = e.target?.result as string;
            };
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(file);
        }));

        Promise.all(filePromises).then(results => {
            const newFrames = results.filter((f): f is FrameData => f !== null);
            if(newFrames.length === 0) setError(t('tools.gifCreator.errorProcessingImages'));
            setFrames(newFrames);
            setIsLoading(false);
        });
    }, [resetState, t]);

    const handleGifUpload = (e: React.ChangeEvent<HTMLInputElement>) => e.target.files?.[0] && processGifFile(e.target.files[0]);
    const handleImagesUpload = (e: React.ChangeEvent<HTMLInputElement>) => e.target.files && processImageFiles(e.target.files);

    const rebuildGif = useCallback(() => {
        if (!frames.length || !gifInfo) return;
        setIsGenerating(true);
        setPreviewUrl(null);

        const gif = new GIF({
            workers: 2,
            quality: parseInt(quality, 10),
            width: gifInfo.width,
            height: gifInfo.height,
            workerScript: '/components/gif.worker.js'
        });

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = gifInfo.width;
        tempCanvas.height = gifInfo.height;

        const addFrameToGif = async (frame: FrameData) => {
            return new Promise<void>(resolve => {
                const img = new Image();
                img.onload = () => {
                    tempCanvas.getContext('2d')?.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
                    tempCanvas.getContext('2d')?.drawImage(img, 0, 0);
                    gif.addFrame(tempCanvas, { copy: true, delay: frame.delay });
                    resolve();
                };
                const tempFabricCanvas = new fabric.Canvas(null);
                tempFabricCanvas.loadFromJSON(frame.canvasState, () => {
                    img.src = tempFabricCanvas.toDataURL();
                    tempFabricCanvas.dispose();
                });
            });
        };

        const processFrames = async () => {
            for (const frame of frames) {
                await addFrameToGif(frame);
            }
            gif.render();
        };

        processFrames();

        gif.on('finished', (blob: Blob) => {
            const url = URL.createObjectURL(blob);
            setPreviewUrl(url);
            setIsGenerating(false);
        });
    }, [frames, gifInfo, quality]);

    const downloadSelectedFrames = useCallback(() => {
        const framesToDownload = frames.filter(f => selectedFrameIds.includes(f.id));
        if (framesToDownload.length === 0) return;

        const zip = new JSZip();
        let processedCount = 0;

        const tempCanvas = document.createElement('canvas');

        framesToDownload.forEach(frame => {
            const tempFabricCanvas = new fabric.Canvas(null);
            tempFabricCanvas.loadFromJSON(frame.canvasState, () => {
                tempCanvas.width = frame.width;
                tempCanvas.height = frame.height;
                const dataURL = tempFabricCanvas.toDataURL();
                const img = new Image();
                img.onload = () => {
                    tempCanvas.getContext('2d')?.drawImage(img, 0, 0);
                    tempCanvas.toBlob((blob: Blob | null) => {
                        if (blob) {
                            zip.file(`frame_${frame.id.substring(0, 8)}.png`, blob);
                            processedCount++;
                            if (processedCount === framesToDownload.length) {
                                zip.generateAsync({ type: 'blob' }).then(content => {
                                    const link = document.createElement('a');
                                    link.href = URL.createObjectURL(content);
                                    link.download = 'frames.zip';
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                    URL.revokeObjectURL(link.href);
                                });
                            }
                        }
                    }, 'image/png');
                };
                img.src = dataURL;
                tempFabricCanvas.dispose();
            });
        });
    }, [frames, selectedFrameIds]);

    const handleSelectAll = () => {
        if (allSelected) {
            setSelectedFrameIds([]);
        } else {
            setSelectedFrameIds(frames.map(f => f.id));
        }
    };
    
    useEffect(() => {
        const canvas = new fabric.Canvas(canvasRef.current, { selection: false, width: 300, height: 300 });
        fabricCanvasRef.current = canvas;
        return () => {
            canvas.dispose();
        };
    }, []);

    const deleteSelected = () => {
        setFrames(frames.filter(f => !selectedFrameIds.includes(f.id)));
        setSelectedFrameIds([]);
        if (selectedFrameId && selectedFrameIds.includes(selectedFrameId)) {
            setSelectedFrameId(null);
            fabricCanvasRef.current?.clear();
        }
    };
    
    const applyDelayToAll = () => {
        const delay = parseInt(globalDelay, 10);
        if(isNaN(delay)) return;
        setFrames(frames.map(f => ({ ...f, delay })));
    };
    
    // Select the first frame when frames are loaded
    useEffect(() => {
        if (frames.length > 0 && !selectedFrameId) {
            setSelectedFrameId(frames[0].id);
        }
    }, [frames, selectedFrameId]);

    // Load frame state into editor canvas when selected frame changes
    useEffect(() => {
        if(selectedFrame) {
            loadFrameState(selectedFrame);
        }
    }, [selectedFrame, loadFrameState]);


    return (
        <div>
            <ToolHeader title={t('tools.gifCreator.pageTitle')} description={t('tools.gifCreator.pageDescription')} />
            {error && <div className="p-4 mb-4 bg-red-900/50 border border-red-700 text-red-300 rounded-md">{error}</div>}
            
            {frames.length === 0 && !isLoading ? (
                <div className="text-center p-8 bg-secondary dark:bg-d-secondary rounded-lg border border-border-color dark:border-d-border-color">
                    <p className="mb-4">{t('tools.gifCreator.initialMessage')}</p>
                    <div className="flex justify-center gap-4">
                        <button onClick={() => gifInputRef.current?.click()} className="px-6 py-2 bg-accent text-white rounded-md">{t('tools.gifCreator.uploadGifButton')}</button>
                        <button onClick={() => imagesInputRef.current?.click()} className="px-6 py-2 bg-accent text-white rounded-md">{t('tools.gifCreator.uploadImagesButton')}</button>
                        <input type="file" ref={gifInputRef} onChange={handleGifUpload} accept="image/gif" className="hidden" />
                        <input type="file" ref={imagesInputRef} onChange={handleImagesUpload} accept="image/*" multiple className="hidden" />
                    </div>
                </div>
            ) : isLoading ? (
                <div className="text-center p-8">{t('tools.gifCreator.loading')}</div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
                    {/* Main Content: Frames Grid & Editor */}
                    <div className="flex flex-col gap-4">
                        <div className="bg-secondary dark:bg-d-secondary rounded-lg border border-border-color dark:border-d-border-color p-4">
                             <div className="flex justify-between items-center mb-2">
                                <h3 className="font-semibold">{t('tools.gifCreator.framesGrid')}</h3>
                                <div className="flex items-center gap-4 text-sm">
                                    <span>{t('tools.gifCreator.frames_selected', { count: selectedFrameIds.length })}</span>
                                    <button onClick={handleSelectAll} className="font-semibold">{allSelected ? t('tools.gifCreator.deselect_all') : t('tools.gifCreator.select_all')}</button>
                                    <button onClick={deleteSelected} disabled={selectedFrameIds.length === 0} className="disabled:opacity-50"><TrashIcon/></button>
                                    <button onClick={downloadSelectedFrames} disabled={selectedFrameIds.length === 0} className="disabled:opacity-50"><DownloadIcon/></button>
                                </div>
                            </div>
                            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-60 overflow-y-auto p-2 bg-primary dark:bg-d-primary rounded">
                                {frames.map(frame => (
                                    <div key={frame.id} className="relative aspect-square cursor-pointer" onClick={() => setSelectedFrameId(frame.id)}>
                                        <img src={frame.thumbnail} alt={`Frame ${frame.id}`} className={`w-full h-full object-contain rounded border-2 ${selectedFrameId === frame.id ? 'border-accent' : 'border-transparent'}`} />
                                        <input type="checkbox" checked={selectedFrameIds.includes(frame.id)} onChange={() => setSelectedFrameIds(ids => ids.includes(frame.id) ? ids.filter(id => id !== frame.id) : [...ids, frame.id])} className="absolute top-1 left-1" />
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="bg-secondary dark:bg-d-secondary rounded-lg border border-border-color dark:border-d-border-color flex-grow p-4 flex items-center justify-center">
                            <canvas ref={canvasRef} />
                        </div>
                    </div>

                    {/* Right Panel: Controls */}
                    <div className="bg-secondary dark:bg-d-secondary rounded-lg border border-border-color dark:border-d-border-color p-4 space-y-4">
                        <h3 className="text-lg font-bold">{t('tools.gifCreator.controlPanelTitle')}</h3>
                         <div>
                            {gifInfo && <p>{t('tools.gifCreator.dimensions')}: {gifInfo.width}x{gifInfo.height}</p>}
                            <p>{t('tools.gifCreator.frameCount')}: {frames.length}</p>
                         </div>
                         <Accordion title={t('tools.gifCreator.timingSettings')}>
                            <LabeledControl label={t('tools.gifCreator.delay_ms')}>
                                <input type="number" value={globalDelay} onChange={e => setGlobalDelay(e.target.value)} className="w-full p-2 bg-primary dark:bg-d-primary rounded" />
                            </LabeledControl>
                            <button onClick={applyDelayToAll} className="w-full py-2 text-sm bg-border-color dark:bg-d-border-color rounded">{t('tools.gifCreator.apply_to_all')}</button>
                         </Accordion>
                         <Accordion title={t('tools.gifCreator.rebuild_gif')} defaultOpen>
                            <LabeledControl label={t('tools.gifCreator.qualityLabel')}>
                                <select value={quality} onChange={e => setQuality(e.target.value)} className="w-full p-2 bg-primary dark:bg-d-primary rounded">
                                    <option value="1">{t('tools.gifCreator.qualityHigh')}</option>
                                    <option value="10">{t('tools.gifCreator.qualityMedium')}</option>
                                    <option value="30">{t('tools.gifCreator.qualityLow')}</option>
                                </select>
                            </LabeledControl>
                            <button onClick={rebuildGif} disabled={isGenerating} className="w-full py-2 bg-accent text-white rounded disabled:opacity-50">
                                {isGenerating ? t('tools.gifCreator.generating_gif') : t('tools.gifCreator.generate_preview')}
                            </button>
                             {previewUrl && (
                                 <div className="space-y-2">
                                    <img src={previewUrl} alt="GIF Preview" className="w-full rounded border border-border-color dark:border-d-border-color"/>
                                    <a href={previewUrl} download="new.gif" className="block w-full text-center py-2 bg-green-600 text-white rounded">{t('tools.gifCreator.download_gif')}</a>
                                 </div>
                             )}
                         </Accordion>
                          <button onClick={resetState} className="w-full py-2 bg-border-color dark:bg-d-border-color rounded">{t('tools.gifCreator.resetEditor')}</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GifSplitter;
