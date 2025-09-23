import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import * as fabric from 'fabric';
import { ToolHeader } from '../components/ui/ToolHeader';
import { LabeledControl } from '../components/ui/LabeledControl';
import { CropIcon, RefreshIcon, SlidersIcon, TypeIcon, DownloadIcon, FiltersIcon, TrashIcon, UndoIcon, RedoIcon, ResizeIcon } from '../components/icons/Icons';

type PanelType = 'crop' | 'transform' | 'filters' | 'adjustments' | 'text' | 'export' | 'resize';
const btnClass = "w-full text-left px-3 py-2 text-sm rounded-md transition-colors ";

// Simple debounce utility
// Fix: Use ReturnType<typeof setTimeout> for browser compatibility instead of NodeJS.Timeout.
const debounce = <F extends (...args: any[]) => void>(func: F, waitFor: number) => {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    return (...args: Parameters<F>): void => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), waitFor);
    };
};


// --- Sub-components ---
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


// --- Main Component ---
const ImageEditor: React.FC = () => {
    const { t } = useTranslation();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
    const imageRef = useRef<fabric.Image | null>(null);
    const cropRectRef = useRef<fabric.Rect | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [hasImage, setHasImage] = useState(false);
    const [isCropping, setIsCropping] = useState(false);
    const [fileName, setFileName] = useState('edited-image');
    const [fileFormat, setFileFormat] = useState<'png' | 'jpeg' | 'webp'>('png');
    const [exportQuality, setExportQuality] = useState(0.9);
    const [activePanel, setActivePanel] = useState<PanelType | null>(null);
    const [activeObject, setActiveObject] = useState<fabric.Object | null>(null);
    const [zoom, setZoom] = useState(1);
    const [history, setHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [resizeValues, setResizeValues] = useState({ width: 0, height: 0 });


    const [adjustments, setAdjustments] = useState({
        brightness: 0, blur: 0, noise: 0, pixelate: 1, hue: 0,
        removeColor: { color: '#000000', distance: 0, enabled: false }
    });
    const [activeFilter, setActiveFilter] = useState<string>('none');
    
    const fonts = ['Impact', 'Arial', 'Helvetica', 'Comic Sans MS', 'Times New Roman', 'Courier New', 'Verdana', 'Georgia'];

    const saveState = useCallback(() => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;
        const json = JSON.stringify(canvas.toJSON());
        
        // If we are undoing, we don't want to create a new branch
        const newHistory = history.slice(0, historyIndex + 1);
        
        // Prevent saving identical subsequent states
        if (newHistory[newHistory.length - 1] === json) return;
        
        newHistory.push(json);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    }, [history, historyIndex]);

    const debouncedSaveState = useMemo(() => debounce(saveState, 500), [saveState]);

    const loadState = (stateString: string) => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;
        canvas.loadFromJSON(stateString, () => {
            canvas.renderAll();
            imageRef.current = canvas.backgroundImage as fabric.Image;
            setHasImage(!!canvas.backgroundImage);
            setResizeValues({width: canvas.getWidth(), height: canvas.getHeight()});
        });
    };

    const handleUndo = () => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            loadState(history[newIndex]);
        }
    };
    
    const handleRedo = () => {
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            loadState(history[newIndex]);
        }
    };

    const applyFiltersAndAdjustments = useCallback(() => {
        const image = imageRef.current;
        if (!image) return;
        image.filters = [];
        if (adjustments.brightness !== 0) image.filters.push(new fabric.filters.Brightness({ brightness: adjustments.brightness }));
        if (adjustments.blur > 0) image.filters.push(new fabric.filters.Blur({ blur: adjustments.blur }));
        if (adjustments.noise > 0) image.filters.push(new fabric.filters.Noise({ noise: adjustments.noise }));
        if (adjustments.pixelate > 1) image.filters.push(new fabric.filters.Pixelate({ blocksize: adjustments.pixelate }));
        if (adjustments.hue !== 0) image.filters.push(new fabric.filters.HueRotation({ rotation: adjustments.hue }));
        if (adjustments.removeColor.enabled && adjustments.removeColor.distance > 0) {
            image.filters.push(new fabric.filters.RemoveColor({ color: adjustments.removeColor.color, distance: adjustments.removeColor.distance }));
        }
        if (activeFilter === 'grayscale') image.filters.push(new fabric.filters.Grayscale());
        if (activeFilter === 'invert') image.filters.push(new fabric.filters.Invert());
        if (activeFilter === 'sepia') image.filters.push(new fabric.filters.Sepia());
        if (activeFilter === 'sharpen') image.filters.push(new fabric.filters.Convolute({ matrix: [0, -1, 0, -1, 5, -1, 0, -1, 0] }));
        if (activeFilter === 'emboss') image.filters.push(new fabric.filters.Convolute({ matrix: [1, 1, 1, 1, 0.7, -1, -1, -1, -1] }));
        image.applyFilters();
        fabricCanvasRef.current?.renderAll();
    }, [adjustments, activeFilter]);
    
    useEffect(() => {
        applyFiltersAndAdjustments();
    }, [adjustments, activeFilter, applyFiltersAndAdjustments]);
    
    const handleAdjustmentChange = <K extends keyof typeof adjustments>(key: K, value: (typeof adjustments)[K]) => {
        setAdjustments(prev => ({...prev, [key]: value}));
        debouncedSaveState();
    };

    const initCanvas = (img: HTMLImageElement) => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        const canvasWidth = img.width;
        const canvasHeight = img.height;
        
        canvas.setWidth(canvasWidth);
        canvas.setHeight(canvasHeight);
        setResizeValues({ width: canvasWidth, height: canvasHeight });
        canvas.setZoom(1);
        canvas.viewportTransform = [1, 0, 0, 1, 0, 0];
        canvas.clear();

        fabric.Image.fromURL(img.src).then((fabImg) => {
            imageRef.current = fabImg;
            canvas.backgroundImage = fabImg;
            canvas.renderAll();
            setHasImage(true);
            setZoom(1);
            setActivePanel('adjustments');
            setHistory([]);
            setHistoryIndex(-1);
            // Wait a moment for canvas to be fully ready before saving initial state
            setTimeout(saveState, 100);
        });
    };
    
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
        const canvas = new fabric.Canvas(canvasRef.current, { selection: false });
        fabricCanvasRef.current = canvas;
        
        canvas.on('mouse:wheel', (opt) => {
            const delta = opt.e.deltaY;
            let newZoom = canvas.getZoom();
            newZoom *= 0.999 ** delta;
            if (newZoom > 20) newZoom = 20;
            if (newZoom < 0.1) newZoom = 0.1;
            canvas.zoomToPoint(new fabric.Point(opt.e.offsetX, opt.e.offsetY), newZoom);
            setZoom(newZoom);
            opt.e.preventDefault();
            opt.e.stopPropagation();
        });
        
        let isDragging = false, lastPosX = 0, lastPosY = 0;
        canvas.on('mouse:down', (opt) => {
            const e = opt.e;
            if (e.altKey === true) {
                isDragging = true;
                canvas.selection = false;
                if ('touches' in e && e.touches && e.touches.length > 0) {
                    lastPosX = e.touches[0].clientX;
                    lastPosY = e.touches[0].clientY;
                } else if ('clientX' in e) {
                    lastPosX = e.clientX;
                    lastPosY = e.clientY;
                }
            }
        });
        canvas.on('mouse:move', (opt) => {
            if (isDragging) {
                const e = opt.e;
                const vpt = canvas.viewportTransform;
                if(vpt) {
                    let currentX: number | undefined, currentY: number | undefined;
                    if ('touches' in e && e.touches && e.touches.length > 0) {
                        currentX = e.touches[0].clientX;
                        currentY = e.touches[0].clientY;
                    } else if ('clientX' in e) {
                        currentX = e.clientX;
                        currentY = e.clientY;
                    }
                    if (currentX !== undefined && currentY !== undefined) {
                        vpt[4] += currentX - lastPosX;
                        vpt[5] += currentY - lastPosY;
                        canvas.requestRenderAll();
                        lastPosX = currentX;
                        lastPosY = currentY;
                    }
                }
            }
        });
        canvas.on('mouse:up', () => {
            if (isDragging) {
                canvas.setViewportTransform(canvas.viewportTransform || [1, 0, 0, 1, 0, 0]);
                isDragging = false;
                canvas.selection = true;
            }
        });

        const updateActiveObject = () => {
          const activeObj = canvas.getActiveObject();
          setActiveObject(activeObj ? activeObj : null);
          if (activeObj?.type === 'i-text') {
            setActivePanel('text');
          }
        };

        canvas.on('selection:created', updateActiveObject);
        canvas.on('selection:updated', updateActiveObject);
        canvas.on('selection:cleared', () => setActiveObject(null));
        canvas.on('object:modified', saveState);

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Delete' || e.key === 'Backspace') {
                deleteActiveObject();
            }
        };
        window.addEventListener('keydown', handleKeyDown);

        return () => { 
            canvas.dispose(); 
            fabricCanvasRef.current = null;
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [deleteActiveObject, saveState]);

    const processFile = (file: File) => {
        setFileName(file.name.split('.').slice(0, -1).join('.'));
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => initCanvas(img);
            img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => e.target.files?.[0] && processFile(e.target.files[0]);
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); e.dataTransfer.files?.[0] && processFile(e.dataTransfer.files[0]); };
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();
    
    const handleTransform = (type: 'flipX' | 'flipY' | 'rotate') => {
        const canvas = fabricCanvasRef.current;
        const image = canvas?.backgroundImage as fabric.Image;
        if (!canvas || !image) return;

        if (type === 'flipX') image.flipX = !image.flipX;
        if (type === 'flipY') image.flipY = !image.flipY;
        if (type === 'rotate') {
            const angle = image.angle || 0;
            image.set('angle', (angle + 90) % 360);
    
            const w = canvas.getWidth();
            const h = canvas.getHeight();
    
            const container = canvasRef.current?.parentElement;
            if (!container) return;
            
            canvas.setWidth(h);
            canvas.setHeight(w);
            
            image.scaleToWidth(h);
            // FIX: Property 'center' does not exist on type 'FabricImage'. Manually center the image.
            const center = canvas.getCenter();
            image.set({
                left: center.left,
                top: center.top,
                originX: 'center',
                originY: 'center'
            });
    
            // FIX: Property 'center' does not exist on type 'FabricObject'. Manually center objects.
            canvas.forEachObject(obj => {
                const center = canvas.getCenter();
                obj.set({
                    left: center.left,
                    top: center.top,
                    originX: 'center',
                    originY: 'center'
                });
                obj.setCoords();
            });
        }
        canvas?.renderAll();
        saveState();
    };

    const handleCancelCrop = useCallback(() => {
        const canvas = fabricCanvasRef.current;
        if (cropRectRef.current && canvas) canvas.remove(cropRectRef.current);
        cropRectRef.current = null;
        setIsCropping(false);
        if(activePanel === 'crop') setActivePanel(null);
    }, [activePanel]);

    const handlePanelSelect = (panel: PanelType) => {
        if (isCropping) handleCancelCrop();
        if (panel === 'resize' && fabricCanvasRef.current) {
            setResizeValues({
                width: fabricCanvasRef.current.getWidth(),
                height: fabricCanvasRef.current.getHeight(),
            });
        }
        setActivePanel(p => p === panel ? null : panel);
    };

    const toggleCrop = () => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;
        if (!isCropping) {
            setActivePanel('crop');
            const cropRect = new fabric.Rect({
                left: 50, top: 50, width: 200, height: 150,
                fill: 'rgba(0,0,0,0.3)', stroke: '#4F46E5', strokeWidth: 2,
                cornerColor: '#4F46E5', cornerStyle: 'circle', transparentCorners: false,
            });
            canvas.add(cropRect);
            canvas.setActiveObject(cropRect);
            cropRectRef.current = cropRect;
            setIsCropping(true);
        } else {
            handleCancelCrop();
        }
    };

    const applyCrop = () => {
        const canvas = fabricCanvasRef.current;
        const cropRect = cropRectRef.current;
        if (!canvas || !cropRect || !cropRect.left || !cropRect.top) return;

        const dataUrl = canvas.toDataURL({
            left: cropRect.left, top: cropRect.top,
            width: cropRect.getScaledWidth(), height: cropRect.getScaledHeight(),
            multiplier: 1
        });

        const img = new Image();
        img.onload = () => initCanvas(img);
        img.src = dataUrl;
        
        handleCancelCrop();
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
        setActivePanel('text');
        saveState();
    };

    const handleDownload = () => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;
        const link = document.createElement('a');
        link.download = `${fileName}.${fileFormat}`;
        canvas.discardActiveObject();
        canvas.renderAll();
        const currentZoom = canvas.getZoom();
        canvas.setZoom(1);
        link.href = canvas.toDataURL({ 
            format: fileFormat, 
            quality: exportQuality, 
            multiplier: 1 
        });
        canvas.setZoom(currentZoom);
        link.click();
    };
    
    const handleApplyResize = () => {
        const canvas = fabricCanvasRef.current;
        const image = canvas?.backgroundImage as fabric.Image;
        if (!canvas) return;

        const newWidth = resizeValues.width;
        const newHeight = resizeValues.height;

        canvas.setWidth(newWidth);
        canvas.setHeight(newHeight);

        if (image) {
            image.scaleToWidth(newWidth);
            // FIX: Property 'center' does not exist on type 'FabricImage'. Manually center the image.
            const center = canvas.getCenter();
            image.set({
                left: center.left,
                top: center.top,
                originX: 'center',
                originY: 'center'
            });
        }
        canvas.renderAll();
        saveState();
    };
    
    const updateActiveTextObject = (prop: string, value: any) => {
        const obj = fabricCanvasRef.current?.getActiveObject();
        if (obj && obj.type === 'i-text') {
            obj.set(prop as keyof fabric.IText, value);
            fabricCanvasRef.current?.requestRenderAll();
        }
    };

    const handleZoomUI = (factor: number) => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;
        const newZoom = canvas.getZoom() * factor;
        canvas.setZoom(newZoom);
        setZoom(newZoom);
    };

    const handleResetZoom = () => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;
        canvas.setZoom(1);
        canvas.viewportTransform = [1, 0, 0, 1, 0, 0];
        setZoom(1);
    };

    const toolbarItems = [
        { id: 'resize', icon: ResizeIcon, label: t('tools.imageEditor.resize'), action: () => handlePanelSelect('resize')},
        { id: 'crop', icon: CropIcon, label: t('tools.imageEditor.cropping'), action: toggleCrop },
        { id: 'transform', icon: RefreshIcon, label: t('tools.imageEditor.transform'), action: () => handlePanelSelect('transform') },
        { id: 'filters', icon: FiltersIcon, label: t('tools.imageEditor.filters'), action: () => handlePanelSelect('filters') },
        { id: 'adjustments', icon: SlidersIcon, label: t('tools.imageEditor.adjustments'), action: () => handlePanelSelect('adjustments') },
        { id: 'text', icon: TypeIcon, label: t('tools.imageEditor.text'), action: () => handlePanelSelect('text')},
        { id: 'export', icon: DownloadIcon, label: t('tools.imageEditor.export'), action: () => handlePanelSelect('export') },
    ];
    
    const activeTextObject = activeObject instanceof fabric.IText ? activeObject : null;

    return (
        <div>
            <ToolHeader 
              title={t('tools.imageEditor.pageTitle')}
              description={t('tools.imageEditor.pageDescription')}
            />
            <div className="bg-secondary dark:bg-d-secondary rounded-xl border border-border-color dark:border-d-border-color shadow-lg">
                <div className="flex items-center gap-4 p-2 border-b border-border-color dark:border-d-border-color">
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                    <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 text-sm bg-accent/90 dark:bg-d-accent/90 text-white dark:text-d-primary font-semibold rounded-lg hover:bg-accent dark:hover:bg-d-accent transition-colors">
                        {hasImage ? t('tools.imageEditor.changeImage') : t('tools.imageEditor.uploadButton')}
                    </button>
                     <div className="flex items-center gap-1">
                        <button onClick={handleUndo} disabled={historyIndex <= 0} title={t('tools.imageEditor.undo')} className="p-2 text-text-secondary dark:text-d-text-secondary rounded-lg hover:bg-primary dark:hover:bg-d-primary disabled:opacity-30 disabled:cursor-not-allowed"><UndoIcon/></button>
                        <button onClick={handleRedo} disabled={historyIndex >= history.length - 1} title={t('tools.imageEditor.redo')} className="p-2 text-text-secondary dark:text-d-text-secondary rounded-lg hover:bg-primary dark:hover:bg-d-primary disabled:opacity-30 disabled:cursor-not-allowed"><RedoIcon/></button>
                    </div>
                    <div className="flex-grow"></div>
                    <button onClick={handleDownload} disabled={!hasImage} className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed">
                        <DownloadIcon />
                        {t('tools.imageEditor.download')}
                    </button>
                </div>

                <div className="flex min-h-[65vh] max-h-[65vh]">
                    <div className="w-20 flex-shrink-0 border-r border-border-color dark:border-d-border-color py-2" aria-label="Editor Toolbar">
                        {toolbarItems.map(item => (
                            <ToolbarButton 
                                key={item.id} 
                                icon={item.icon} 
                                label={item.label} 
                                isActive={activePanel === item.id || (item.id === 'crop' && isCropping)} 
                                onClick={item.action} 
                            />
                        ))}
                    </div>

                    <div className="flex-grow flex items-center justify-center p-4 bg-primary dark:bg-d-primary relative overflow-auto group">
                        <canvas ref={canvasRef} />
                        {!hasImage && (
                            <div className="absolute inset-2 flex flex-col items-center justify-center p-6 border-4 border-dashed border-border-color dark:border-d-border-color rounded-xl text-center cursor-pointer hover:border-accent dark:hover:border-d-accent transition-colors" onDrop={handleDrop} onDragOver={handleDragOver} onClick={() => fileInputRef.current?.click()}>
                                <svg className="mx-auto h-16 w-16 text-text-secondary dark:text-d-text-secondary" stroke="currentColor" fill="none" viewBox="0 0 48 48"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                <p className="mt-4 text-lg font-semibold">{t('tools.imageEditor.uploadButton')}</p>
                                <p className="mt-1 text-sm text-text-secondary dark:text-d-text-secondary">{t('tools.imageEditor.dropzone')}</p>
                            </div>
                        )}
                        {hasImage && <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-secondary dark:bg-d-secondary p-1.5 rounded-lg border border-border-color dark:border-d-border-color text-text-secondary dark:text-d-text-secondary shadow-md">
                            <button onClick={() => handleZoomUI(0.8)} title={t('tools.imageEditor.canvasControls.zoomOut')} className="p-1 hover:bg-primary dark:hover:bg-d-primary rounded-md"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6" /></svg></button>
                            <button onClick={handleResetZoom} title={t('tools.imageEditor.canvasControls.resetZoom')} className="px-2 text-xs font-semibold hover:bg-primary dark:hover:bg-d-primary rounded-md">{(zoom * 100).toFixed(0)}%</button>
                            <button onClick={() => handleZoomUI(1.25)} title={t('tools.imageEditor.canvasControls.zoomIn')} className="p-1 hover:bg-primary dark:hover:bg-d-primary rounded-md"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" /></svg></button>
                        </div>}
                        {hasImage && <div className="absolute bottom-2 left-2 text-xs bg-black/50 text-white px-2 py-1 rounded">{t('tools.imageEditor.canvasControls.panHint')}</div>}
                    </div>

                    <div className={`w-80 flex-shrink-0 border-l border-border-color dark:border-d-border-color overflow-y-auto transition-all ${!hasImage || activePanel === null ? 'opacity-50 pointer-events-none' : ''}`}>
                        {activePanel === 'resize' && (
                            <PropertiesPanel title={t('tools.imageEditor.resize')}>
                                <LabeledControl label={t('tools.imageEditor.width')}>
                                    <input type="number" value={Math.round(resizeValues.width)} onChange={e => setResizeValues(s => ({...s, width: parseInt(e.target.value, 10) || 0}))} className="w-full p-2 bg-primary dark:bg-d-primary border-none ring-1 ring-inset ring-border-color dark:ring-d-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-d-accent" />
                                </LabeledControl>
                                <LabeledControl label={t('tools.imageEditor.height')}>
                                    <input type="number" value={Math.round(resizeValues.height)} onChange={e => setResizeValues(s => ({...s, height: parseInt(e.target.value, 10) || 0}))} className="w-full p-2 bg-primary dark:bg-d-primary border-none ring-1 ring-inset ring-border-color dark:ring-d-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-d-accent" />
                                </LabeledControl>
                                <button onClick={handleApplyResize} className={`${btnClass} bg-accent text-white dark:bg-d-accent dark:text-d-primary text-center`}>{t('tools.imageEditor.apply')}</button>
                            </PropertiesPanel>
                        )}
                        {activePanel === 'crop' && (
                            <PropertiesPanel title={t('tools.imageEditor.cropping')}>
                                 <button onClick={applyCrop} className={`${btnClass} bg-green-500 text-white text-center`}>{t('tools.imageEditor.applyCrop')}</button>
                                 <button onClick={handleCancelCrop} className={`${btnClass} bg-red-500 text-white text-center`}>{t('tools.imageEditor.cancelCrop')}</button>
                            </PropertiesPanel>
                        )}
                        {activePanel === 'transform' && (
                            <PropertiesPanel title={t('tools.imageEditor.transform')}>
                                <div className="grid grid-cols-2 gap-2">
                                    <button onClick={() => handleTransform('flipX')} className={`${btnClass} bg-primary dark:bg-d-primary text-center`}>{t('tools.imageEditor.flipX')}</button>
                                    <button onClick={() => handleTransform('flipY')} className={`${btnClass} bg-primary dark:bg-d-primary text-center`}>{t('tools.imageEditor.flipY')}</button>
                                    <button onClick={() => handleTransform('rotate')} className={`${btnClass} bg-primary dark:bg-d-primary col-span-2 text-center`}>{t('tools.imageEditor.rotate')}</button>
                                </div>
                            </PropertiesPanel>
                        )}
                        {activePanel === 'filters' && (
                            <PropertiesPanel title={t('tools.imageEditor.filters')}>
                                <div className="grid grid-cols-2 gap-2">
                                    {['none', 'grayscale', 'invert', 'sepia', 'sharpen', 'emboss'].map(filter => (
                                        <button key={filter} onClick={() => {setActiveFilter(filter); saveState();}} className={`${btnClass} text-center ${activeFilter === filter ? 'bg-accent text-white dark:bg-d-accent dark:text-d-primary' : 'bg-primary dark:bg-d-primary'}`}>
                                            {t(`tools.imageEditor.${filter}`)}
                                        </button>
                                    ))}
                                </div>
                            </PropertiesPanel>
                        )}
                         {activePanel === 'adjustments' && (
                            <PropertiesPanel title={t('tools.imageEditor.adjustments')}>
                                <LabeledControl label={t('tools.imageEditor.brightness')} valueDisplay={adjustments.brightness.toFixed(2)}>
                                    <input type="range" min="-1" max="1" step="0.01" value={adjustments.brightness} onChange={e => handleAdjustmentChange('brightness', parseFloat(e.target.value))} className="w-full accent-accent dark:accent-d-accent" />
                                </LabeledControl>
                                <LabeledControl label={t('tools.imageEditor.blur')} valueDisplay={adjustments.blur.toFixed(2)}>
                                    <input type="range" min="0" max="1" step="0.01" value={adjustments.blur} onChange={e => handleAdjustmentChange('blur', parseFloat(e.target.value))} className="w-full accent-accent dark:accent-d-accent" />
                                </LabeledControl>
                                <LabeledControl label={t('tools.imageEditor.noise')} valueDisplay={String(adjustments.noise)}>
                                    <input type="range" min="0" max="1000" step="10" value={adjustments.noise} onChange={e => handleAdjustmentChange('noise', parseInt(e.target.value))} className="w-full accent-accent dark:accent-d-accent" />
                                </LabeledControl>
                                <LabeledControl label={t('tools.imageEditor.pixelate')} valueDisplay={String(adjustments.pixelate)}>
                                    <input type="range" min="1" max="50" step="1" value={adjustments.pixelate} onChange={e => handleAdjustmentChange('pixelate', parseInt(e.target.value))} className="w-full accent-accent dark:accent-d-accent" />
                                </LabeledControl>
                                <LabeledControl label={t('tools.imageEditor.hue')} valueDisplay={adjustments.hue.toFixed(2)}>
                                    <input type="range" min="-1" max="1" step="0.01" value={adjustments.hue} onChange={e => handleAdjustmentChange('hue', parseFloat(e.target.value))} className="w-full accent-accent dark:accent-d-accent" />
                                </LabeledControl>
                                <div className="pt-2 mt-2 border-t border-border-color dark:border-d-border-color">
                                    <label className="flex items-center gap-2 text-sm font-medium cursor-pointer"><input type="checkbox" checked={adjustments.removeColor.enabled} onChange={e => handleAdjustmentChange('removeColor', {...adjustments.removeColor, enabled: e.target.checked})} />{t('tools.imageEditor.removeColor')}</label>
                                    <LabeledControl label={t('tools.imageEditor.colorToRemove')}>
                                        <input type="color" value={adjustments.removeColor.color} onChange={e => handleAdjustmentChange('removeColor', {...adjustments.removeColor, color: e.target.value})} className="w-full h-8 p-0 border-none rounded-md" />
                                    </LabeledControl>
                                    <LabeledControl label={t('tools.imageEditor.distance')} valueDisplay={adjustments.removeColor.distance.toFixed(2)}>
                                        <input type="range" min="0" max="1" step="0.01" value={adjustments.removeColor.distance} onChange={e => handleAdjustmentChange('removeColor', {...adjustments.removeColor, distance: parseFloat(e.target.value)})} className="w-full accent-accent dark:accent-d-accent" />
                                    </LabeledControl>
                                </div>
                            </PropertiesPanel>
                        )}
                        {activePanel === 'text' && (
                             <PropertiesPanel title={t('tools.imageEditor.text')}>
                                {activeTextObject ? (
                                    <>
                                        <LabeledControl label={t('tools.imageEditor.fontFamily')}>
                                            <select value={activeTextObject.fontFamily} onChange={e => updateActiveTextObject('fontFamily', e.target.value)} className="w-full p-2 bg-primary dark:bg-d-primary border-none ring-1 ring-inset ring-border-color dark:ring-d-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-d-accent">
                                                {fonts.map(font => <option key={font} value={font}>{font}</option>)}
                                            </select>
                                        </LabeledControl>
                                        <div className="grid grid-cols-3 gap-2">
                                            <LabeledControl label={t('tools.imageEditor.color')}>
                                                <input type="color" value={typeof activeTextObject.fill === 'string' ? activeTextObject.fill : '#FFFFFF'} onChange={e => updateActiveTextObject('fill', e.target.value)} className="w-full h-8 p-0 border-none rounded-md" />
                                            </LabeledControl>
                                            <LabeledControl label={t('tools.imageEditor.outline')}>
                                                <input type="color" value={typeof activeTextObject.stroke === 'string' ? activeTextObject.stroke : '#000000'} onChange={e => updateActiveTextObject('stroke', e.target.value)} className="w-full h-8 p-0 border-none rounded-md" />
                                            </LabeledControl>
                                            <LabeledControl label={t('tools.imageEditor.fontSize')}>
                                                <input type="number" value={activeTextObject.fontSize} onChange={e => updateActiveTextObject('fontSize', parseInt(e.target.value, 10))} className="w-full p-1 text-center bg-primary dark:bg-d-primary border-none ring-1 ring-inset ring-border-color dark:ring-d-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-d-accent" />
                                            </LabeledControl>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => updateActiveTextObject('fontWeight', activeTextObject.fontWeight === 'bold' ? 'normal' : 'bold')} className={`${btnClass} flex-1 text-center ${activeTextObject.fontWeight === 'bold' ? 'bg-accent text-white' : 'bg-primary dark:bg-d-primary'}`}>B</button>
                                            <button onClick={() => updateActiveTextObject('fontStyle', activeTextObject.fontStyle === 'italic' ? 'normal' : 'italic')} className={`${btnClass} flex-1 text-center ${activeTextObject.fontStyle === 'italic' ? 'bg-accent text-white' : 'bg-primary dark:bg-d-primary'}`}>I</button>
                                            <button onClick={() => updateActiveTextObject('underline', !activeTextObject.underline)} className={`${btnClass} flex-1 text-center ${activeTextObject.underline ? 'bg-accent text-white' : 'bg-primary dark:bg-d-primary'}`}>U</button>
                                        </div>
                                        <LabeledControl label={t('tools.imageEditor.letterSpacing')} valueDisplay={String(activeTextObject.charSpacing)}>
                                            <input type="range" min="-200" max="800" value={activeTextObject.charSpacing} onChange={e => updateActiveTextObject('charSpacing', parseInt(e.target.value))} className="w-full accent-accent dark:accent-d-accent" />
                                        </LabeledControl>
                                         <LabeledControl label={t('tools.imageEditor.lineHeight')} valueDisplay={String(activeTextObject.lineHeight)}>
                                            <input type="range" min="0.5" max="2.5" step="0.1" value={activeTextObject.lineHeight} onChange={e => updateActiveTextObject('lineHeight', parseFloat(e.target.value))} className="w-full accent-accent dark:accent-d-accent" />
                                        </LabeledControl>
                                        <button onClick={deleteActiveObject} className="w-full flex items-center justify-center gap-2 mt-4 px-4 py-2 text-sm bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors">
                                            <TrashIcon />
                                            {t('tools.imageEditor.deleteLayer')}
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button onClick={handleAddText} className={`${btnClass} bg-primary dark:bg-d-primary text-center`}>{t('tools.imageEditor.addText')}</button>
                                        <p className="text-xs text-text-secondary dark:text-d-text-secondary text-center px-2 mt-2">{t('tools.imageEditor.selectTextToEdit')}</p>
                                    </>
                                )}
                            </PropertiesPanel>
                        )}
                        {activePanel === 'export' && (
                             <PropertiesPanel title={t('tools.imageEditor.export')}>
                                 <LabeledControl label={t('tools.imageEditor.fileName')}>
                                    <input type="text" value={fileName} onChange={e => setFileName(e.target.value)} className="w-full p-2 bg-primary dark:bg-d-primary border-none ring-1 ring-inset ring-border-color dark:ring-d-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-d-accent" />
                                </LabeledControl>
                                <LabeledControl label={t('tools.imageEditor.format')}>
                                    <select value={fileFormat} onChange={e => setFileFormat(e.target.value as any)} className="w-full p-2 bg-primary dark:bg-d-primary border-none ring-1 ring-inset ring-border-color dark:ring-d-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-d-accent">
                                        <option value="png">PNG</option>
                                        <option value="jpeg">JPEG</option>
                                        <option value="webp">WEBP</option>
                                    </select>
                                </LabeledControl>
                                {(fileFormat === 'jpeg' || fileFormat === 'webp') && (
                                    <LabeledControl label={t('tools.imageEditor.quality')} valueDisplay={`${Math.round(exportQuality * 100)}`}>
                                        <input 
                                            type="range" 
                                            min="0.1" 
                                            max="1" 
                                            step="0.05" 
                                            value={exportQuality} 
                                            onChange={e => setExportQuality(parseFloat(e.target.value))} 
                                            className="w-full accent-accent dark:accent-d-accent" 
                                        />
                                    </LabeledControl>
                                )}
                             </PropertiesPanel>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImageEditor;