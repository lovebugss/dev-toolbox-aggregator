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

    const processImageFiles = useCallback(async (files: FileList) => {
        const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
        if (imageFiles.length === 0) { setError(t('tools.gifCreator.errorNoImages')); return; }
        resetState();
        setIsLoading(true);
        try {
            const loadImage = (file: File): Promise<{ dataUrl: string; width: number; height: number; }> => new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const dataUrl = e.target?.result as string;
                    const img = new Image();
                    img.onload = () => resolve({ dataUrl, width: img.width, height: img.height });
                    img.onerror = reject;
                    img.src = dataUrl;
                };
                reader.onerror = reject; reader.readAsDataURL(file);
            });
            const loadedImages = await Promise.all(imageFiles.map(loadImage));
            if (loadedImages.length > 0) {
                const firstImage = loadedImages[0];
                const { width, height } = firstImage;
                setGifInfo({ width, height });

                const fabricTempCanvas = new fabric.Canvas(null as any, { width, height });

                const newFrames: FrameData[] = [];
                for(const imgData of loadedImages) {
                    const img = await fabric.Image.fromURL(imgData.dataUrl);
                    fabricTempCanvas.backgroundImage = img;
                    fabricTempCanvas.renderAll();
                    const canvasState = JSON.stringify(fabricTempCanvas.toJSON());
                    newFrames.push({
                        id: uuidv4(),
                        thumbnail: imgData.dataUrl,
                        delay: 200,
                        canvasState,
                        history: [canvasState],
                        historyIndex: 0,
                        width: imgData.width,
                        height: imgData.height
                    });
                }
                setFrames(newFrames);
                setGlobalDelay('200');
            }
        } catch (err) { setError(t('tools.gifCreator.errorProcessingImages')); } finally { setIsLoading(false); }
    }, [resetState, t]);

    // --- CANVAS & EDITOR LOGIC ---
    const deleteActiveObject = useCallback(() => {
        const canvas = fabricCanvasRef.current;
        const activeObj = canvas?.getActiveObject();
        if (activeObj) {
            canvas?.remove(activeObj);
            canvas?.discardActiveObject();
            canvas?.renderAll();
            saveState();
        }
    }, [saveState]);

    useEffect(() => {
        const canvas = new fabric.Canvas(canvasRef.current, { selection: true });
        fabricCanvasRef.current = canvas;

        const updateActiveObject = () => {
            const activeObj = canvas.getActiveObject();
            setActiveObject(activeObj || null);
            if (activeObj?.type === 'i-text') setActivePanel('text');
        };

        canvas.on('selection:created', updateActiveObject);
        canvas.on('selection:updated', updateActiveObject);
        canvas.on('selection:cleared', () => setActiveObject(null));
        canvas.on('object:modified', saveState);

        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.key === 'Delete' || e.key === 'Backspace') && canvas.getActiveObject()) {
                deleteActiveObject();
            }
        };
        window.addEventListener('keydown', handleKeyDown);

        return () => { canvas.dispose(); window.removeEventListener('keydown', handleKeyDown); };
    }, [deleteActiveObject, saveState]);

    useEffect(() => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return; // canvas not ready

        if (!selectedFrameId) {
            // No frame selected, show placeholder
            canvas.clear();
            canvas.setWidth(500);
            canvas.setHeight(500);
            canvas.backgroundColor = '#e5e7eb';
            canvas.renderAll();
            setActiveObject(null);
            return;
        }

        if (selectedFrame) {
            // A frame is selected, load its state.
            loadFrameState(selectedFrame);
        }
    }, [selectedFrameId, selectedFrame, loadFrameState]);

    const handlePanelSelect = (panel: PanelType) => {
        setActivePanel(p => p === panel ? null : panel);
    };

    const applyCrop = () => {
      // Cropping logic is complex to merge in this context. For now, we will omit it.
      // A full implementation would require re-rendering all objects onto a new, smaller canvas.
    };
    
    const handleAddText = () => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;
        const text = new fabric.IText('Your Text', {
            left: canvas.getWidth() / 2, top: canvas.getHeight() / 2,
            fontFamily: 'Impact', fill: '#FFFFFF', fontSize: 50,
            stroke: '#000000', strokeWidth: 2,
            originX: 'center', originY: 'center', cornerColor: '#4F46E5',
            cornerStyle: 'circle', transparentCorners: false,
        });
        canvas.add(text);
        canvas.setActiveObject(text);
        saveState();
    };

    const updateActiveTextObject = (prop: string, value: any) => {
        if (activeTextObject) {
            activeTextObject.set(prop as keyof fabric.IText, value);
            fabricCanvasRef.current?.requestRenderAll();
            debouncedSaveState();
        }
    };

    // --- GIF GENERATION ---
    const generateGif = async () => {
        if (frames.length === 0) return;
        setIsGenerating(true);
        setPreviewUrl(null);

        let maxWidth = 0;
        let maxHeight = 0;
        frames.forEach(frame => {
            if (frame.width > maxWidth) maxWidth = frame.width;
            if (frame.height > maxHeight) maxHeight = frame.height;
        });

        if (maxWidth === 0 || maxHeight === 0) {
            maxWidth = gifInfo?.width || 500;
            maxHeight = gifInfo?.height || 500;
        }

        const gif = new GIF({ workers: 2, quality: parseInt(quality, 10), width: maxWidth, height: maxHeight, workerScript: 'components/gif.worker.js' });
        
        const targetCanvasEl = document.createElement('canvas');
        targetCanvasEl.width = maxWidth;
        targetCanvasEl.height = maxHeight;
        const targetCtx = targetCanvasEl.getContext('2d');
        if(!targetCtx) {
            setIsGenerating(false);
            return;
        }

        const tempCanvasEl = document.createElement('canvas');
        const tempFabricCanvas = new fabric.Canvas(tempCanvasEl);
        const loadImage = (src: string): Promise<HTMLImageElement> => new Promise((resolve, reject) => { const img = new Image(); img.onload = () => resolve(img); img.onerror = reject; img.src = src; });

        for (const frame of frames) {
            await new Promise<void>(resolve => {
                try {
                    tempFabricCanvas.setWidth(frame.width);
                    tempFabricCanvas.setHeight(frame.height);
                    tempFabricCanvas.loadFromJSON(frame.canvasState, () => {
                        tempFabricCanvas.renderAll();
                        resolve();
                    });
                } catch(e) {
                    resolve();
                }
            });

            targetCtx.clearRect(0, 0, maxWidth, maxHeight);
            const frameWidth = tempFabricCanvas.getWidth();
            const frameHeight = tempFabricCanvas.getHeight();
            const imgDataUrl = tempFabricCanvas.toDataURL({ format: 'png', multiplier: 1 });
            const imgElement = await loadImage(imgDataUrl);
            
            const dx = (maxWidth - frameWidth) / 2;
            const dy = (maxHeight - frameHeight) / 2;
            targetCtx.drawImage(imgElement, dx, dy);

            gif.addFrame(targetCanvasEl, { copy: true, delay: frame.delay });
        }
        
        gif.on('finished', (blob: any) => { setPreviewUrl(URL.createObjectURL(blob)); setIsGenerating(false); });
        gif.render();
    };
    
    // --- EVENT HANDLERS ---
    const handleGifFileChange = (e: React.ChangeEvent<HTMLInputElement>) => e.target.files?.[0] && processGifFile(e.target.files[0]);
    const handleImagesFileChange = (e: React.ChangeEvent<HTMLInputElement>) => e.target.files && processImageFiles(e.target.files);
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); const files = e.dataTransfer.files; if (!files || files.length === 0) return; if (files.length === 1 && files[0].type === 'image/gif') { processGifFile(files[0]); } else { processImageFiles(files); } };
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();
    const handleDelayChange = (id: string, delay: string) => setFrames(frames.map(f => f.id === id ? { ...f, delay: parseInt(delay, 10) || 0 } : f));
    const handleApplyGlobalDelay = () => { const delay = parseInt(globalDelay, 10); if (!isNaN(delay)) { setFrames(frames.map(f => ({ ...f, delay }))); } };
    const handleToggleSelect = (id: string) => setSelectedFrameIds(prev => prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]);
    const handleSelectAll = () => allSelected ? setSelectedFrameIds([]) : setSelectedFrameIds(frames.map(f => f.id));
    const handleDeleteSelected = () => {
        setFrames(prev => prev.filter(f => !selectedFrameIds.includes(f.id)));
        if (selectedFrameId && selectedFrameIds.includes(selectedFrameId)) setSelectedFrameId(null);
        setSelectedFrameIds([]);
    };
    const handleDownloadSelected = async () => {
        if (selectedFrameIds.length === 0) return;
        const zip = new JSZip();
        for (const frameId of selectedFrameIds) {
            const frame = frames.find(f => f.id === frameId);
            if(frame) {
                const base64Data = frame.thumbnail.split(',')[1];
                zip.file(`frame_${frames.indexOf(frame) + 1}.png`, base64Data, { base64: true });
            }
        }
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(zipBlob);
        link.download = 'frames.zip';
        link.click();
        URL.revokeObjectURL(link.href);
    };

    const toolbarItems = [
        { id: 'resize', icon: ResizeIcon, label: t('tools.imageEditor.resize')},
        { id: 'crop', icon: ScissorsIcon, label: t('tools.imageEditor.cropping')},
        { id: 'transform', icon: RefreshIcon, label: t('tools.imageEditor.transform')},
        { id: 'filters', icon: FiltersIcon, label: t('tools.imageEditor.filters')},
        { id: 'adjustments', icon: SlidersIcon, label: t('tools.imageEditor.adjustments') },
        { id: 'text', icon: TypeIcon, label: t('tools.imageEditor.text')},
    ];

    if (!frames.length) { /* Initial upload view */
        return (
            <div>
                <ToolHeader title={t('tools.gifCreator.pageTitle')} description={t('tools.gifCreator.pageDescription')} />
                {isLoading && <p className="text-center mt-6">{t('tools.gifCreator.loading')}</p>}
                {error && <p className="text-center mt-6 text-red-500">{error}</p>}
                <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border-color dark:border-d-border-color rounded-lg h-60 bg-secondary dark:bg-d-secondary hover:border-accent dark:hover:border-d-accent transition-colors" onDrop={handleDrop} onDragOver={handleDragOver}>
                    <input type="file" accept="image/gif" onChange={handleGifFileChange} className="hidden" ref={gifInputRef}/>
                    <input type="file" accept="image/*" multiple onChange={handleImagesFileChange} className="hidden" ref={imagesInputRef} />
                    <div className="text-center"><LayoutIcon className="mx-auto h-12 w-12 text-text-secondary dark:text-d-text-secondary" />
                        <p className="mt-2 text-sm text-text-secondary dark:text-d-text-secondary max-w-md">{t('tools.gifCreator.initialMessage')}</p>
                        <div className="flex gap-4 mt-4 justify-center">
                            <button onClick={() => gifInputRef.current?.click()} className="px-4 py-2 bg-accent dark:bg-d-accent text-white dark:text-d-primary font-semibold rounded-lg hover:opacity-90 transition-opacity">{t('tools.gifCreator.uploadGifButton')}</button>
                            <button onClick={() => imagesInputRef.current?.click()} className="px-4 py-2 bg-accent dark:bg-d-accent text-white dark:text-d-primary font-semibold rounded-lg hover:opacity-90 transition-opacity">{t('tools.gifCreator.uploadImagesButton')}</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <ToolHeader title={t('tools.gifCreator.pageTitle')} description={t('tools.gifCreator.pageDescription')} />
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-[250px_1fr_320px] gap-4 min-h-0">
                {/* Left Column: Frame List */}
                <div className="flex flex-col bg-secondary dark:bg-d-secondary rounded-lg border border-border-color dark:border-d-border-color min-h-0">
                    <div className="p-2 border-b border-border-color dark:border-d-border-color flex-shrink-0 space-y-2">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-text-primary dark:text-d-text-primary">{t('tools.gifCreator.framesGrid')}</h3>
                            <button onClick={handleSelectAll} className="px-2 py-1 text-xs font-medium bg-border-color dark:bg-d-border-color rounded-md">{allSelected ? t('tools.gifCreator.deselect_all') : t('tools.gifCreator.select_all')}</button>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={handleDeleteSelected} disabled={selectedFrameIds.length === 0} className="w-full text-xs flex items-center justify-center gap-1 py-1 bg-primary dark:bg-d-primary rounded disabled:opacity-50"><TrashIcon className="w-3.5 h-3.5" />{t('tools.gifCreator.deleteSelected')}</button>
                            <button onClick={handleDownloadSelected} disabled={selectedFrameIds.length === 0} className="w-full text-xs flex items-center justify-center gap-1 py-1 bg-primary dark:bg-d-primary rounded disabled:opacity-50"><DownloadIcon className="w-3.5 h-3.5" />{t('tools.gifCreator.download_selected')}</button>
                        </div>
                    </div>
                    <div className="flex-grow p-2 space-y-2 overflow-y-auto min-h-0">
                        {frames.map((frame, index) => (
                            <div key={frame.id}>
                                <div onClick={() => setSelectedFrameId(frame.id)} className={`group relative p-2 rounded-lg cursor-pointer ${selectedFrameId === frame.id ? 'bg-accent/10 dark:bg-d-accent/10 ring-2 ring-accent' : (selectedFrameIds.includes(frame.id) ? 'bg-blue-500/10' : 'bg-primary dark:bg-d-primary hover:bg-border-color/50')}`}>
                                    <div className="flex items-center gap-3">
                                        <input type="checkbox" checked={selectedFrameIds.includes(frame.id)} onChange={() => handleToggleSelect(frame.id)} onClick={e => e.stopPropagation()} className="form-checkbox h-4 w-4 rounded text-accent dark:text-d-accent bg-secondary dark:bg-d-secondary focus:ring-accent dark:focus:ring-d-accent"/>
                                        <img src={frame.thumbnail} alt={`Frame ${index + 1}`} className="w-12 h-12 object-contain rounded-md border border-border-color dark:border-d-border-color bg-white dark:bg-black" />
                                        <div className="flex-grow">
                                            <p className="font-mono text-xs text-text-secondary dark:text-d-text-secondary">#{index + 1}</p>
                                            <input type="number" value={frame.delay} onClick={(e) => e.stopPropagation()} onChange={(e) => handleDelayChange(frame.id, e.target.value)} className="w-full mt-1 bg-secondary dark:bg-d-secondary text-sm p-1 rounded border border-border-color dark:border-d-border-color focus:ring-1 focus:ring-accent" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Center Column: Editor */}
                 <div className="flex-grow flex items-center justify-center p-4 bg-primary dark:bg-d-primary relative overflow-auto group rounded-lg border border-border-color dark:border-d-border-color">
                    <canvas ref={canvasRef} />
                </div>

                {/* Right Column: Controls */}
                <div className="flex flex-col bg-secondary dark:bg-d-secondary rounded-lg border border-border-color dark:border-d-border-color">
                   <div className="flex items-center gap-2 p-2 border-b border-border-color dark:border-d-border-color">
                        <button onClick={handleUndo} disabled={!selectedFrame || selectedFrame.historyIndex <= 0} title={t('tools.imageEditor.undo')} className="p-2 text-text-secondary dark:text-d-text-secondary rounded-lg hover:bg-primary dark:hover:bg-d-primary disabled:opacity-30"><UndoIcon/></button>
                        <button onClick={handleRedo} disabled={!selectedFrame || selectedFrame.historyIndex >= selectedFrame.history.length - 1} title={t('tools.imageEditor.redo')} className="p-2 text-text-secondary dark:text-d-text-secondary rounded-lg hover:bg-primary dark:hover:bg-d-primary disabled:opacity-30"><RedoIcon/></button>
                   </div>
                   <div className="flex-grow min-h-0 overflow-y-auto">
                        {activeTextObject ? (
                             <PropertiesPanel title={t('tools.imageEditor.text')}>
                                 <LabeledControl label={t('tools.imageEditor.fontFamily')}>
                                    <select value={activeTextObject.fontFamily} onChange={e => updateActiveTextObject('fontFamily', e.target.value)} className="w-full p-2 bg-primary dark:bg-d-primary rounded">
                                         <option>Impact</option><option>Arial</option><option>Helvetica</option>
                                     </select>
                                 </LabeledControl>
                                 <div className="grid grid-cols-2 gap-2">
                                     <LabeledControl label={t('tools.imageEditor.color')}><input type="color" value={activeTextObject.fill as string} onChange={e => updateActiveTextObject('fill', e.target.value)} className="w-full h-8 p-0" /></LabeledControl>
                                     <LabeledControl label={t('tools.imageEditor.fontSize')}><input type="number" value={activeTextObject.fontSize} onChange={e => updateActiveTextObject('fontSize', parseInt(e.target.value, 10))} className="w-full p-1 bg-primary dark:bg-d-primary rounded"/></LabeledControl>
                                 </div>
                                 <button onClick={deleteActiveObject} className="w-full text-sm text-red-500 flex items-center justify-center gap-2 py-1 hover:bg-red-500/10 rounded"><TrashIcon className="w-4 h-4" /> {t('tools.imageEditor.deleteLayer')}</button>
                             </PropertiesPanel>
                        ) : (
                             <PropertiesPanel title={t('common.settings')}>
                                <button onClick={handleAddText} className="w-full text-sm flex items-center justify-center gap-2 py-2 bg-primary dark:bg-d-primary rounded-lg hover:bg-border-color dark:hover:bg-d-border-color"><TypeIcon/> {t('tools.imageEditor.addText')}</button>
                                <Accordion title={t('tools.gifCreator.timingSettings')} defaultOpen>
                                    <LabeledControl label={t('tools.gifCreator.delay_ms')}>
                                        <div className="flex items-center gap-2">
                                            <input type="number" value={globalDelay} onChange={(e) => setGlobalDelay(e.target.value)} className="w-full p-2 bg-primary dark:bg-d-primary rounded"/>
                                            <button onClick={handleApplyGlobalDelay} className="px-3 py-2 text-sm bg-border-color dark:bg-d-border-color rounded whitespace-nowrap">{t('tools.gifCreator.apply_to_all')}</button>
                                        </div>
                                    </LabeledControl>
                                </Accordion>
                                <Accordion title={t('tools.gifCreator.rebuild_gif')} defaultOpen>
                                    <LabeledControl label={t('tools.gifCreator.qualityLabel')}>
                                        <select value={quality} onChange={(e) => setQuality(e.target.value)} className="w-full p-2 bg-primary dark:bg-d-primary rounded">
                                            <option value="1">{t('tools.gifCreator.qualityHigh')}</option>
                                            <option value="10">{t('tools.gifCreator.qualityMedium')}</option>
                                            <option value="30">{t('tools.gifCreator.qualityLow')}</option>
                                        </select>
                                    </LabeledControl>
                                    <button onClick={generateGif} disabled={isGenerating} className="w-full mt-2 px-4 py-2 text-sm bg-accent text-white rounded-md hover:opacity-90 disabled:opacity-50">
                                        {isGenerating ? t('tools.gifCreator.generating_gif') : t('tools.gifCreator.generate_preview')}
                                    </button>
                                    {previewUrl && <>
                                        <img src={previewUrl} alt="Preview" className="w-full rounded-md border mt-2" />
                                        <a href={previewUrl} download="edited.gif" className="w-full text-center block mt-2 px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700">{t('tools.gifCreator.download_gif')}</a>
                                    </>}
                                </Accordion>
                            </PropertiesPanel>
                        )}
                   </div>
                   <div className="p-4 border-t border-border-color dark:border-d-border-color">
                        <button onClick={resetState} className="w-full text-sm py-2 bg-border-color dark:bg-d-border-color rounded">{t('tools.gifCreator.resetEditor')}</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GifSplitter;
