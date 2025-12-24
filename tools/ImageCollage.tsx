import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import * as fabric from 'fabric';
import { parseGIF, decompressFrames } from 'gifuct-js';
import { useToolState } from '../contexts/ToolStateContext';
import { useToasts } from '../contexts/ToastContext';
import { ToolHeader } from '../components/ui/ToolHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { LabeledControl } from '../components/ui/LabeledControl';
import { 
    DownloadIcon, RefreshIcon, TrashIcon, TypeIcon, LayersIcon,
    BringForwardIcon, SendBackwardIcon,
    LockIcon, UnlockIcon, LayoutIcon, SlidersIcon, ShapesIcon,
    SquareIcon, CircleIcon, TriangleIcon, HeartIcon, StarIcon
} from '../components/icons/Icons';

// --- DATA & TYPES ---

interface LayoutCell { x: number; y: number; w: number; h: number; }
interface LayoutTemplate { id: string; cells: LayoutCell[]; }
interface LayoutCategory { title: string; templates: LayoutTemplate[]; }
interface PlacedImage { src: string; zoom: number; offsetX: number; offsetY: number; }
type BackgroundType = 'color' | 'image';
type PanelType = 'layouts' | 'layers' | 'canvas' | 'export';

const layouts: LayoutCategory[] = [
    { title: '2', templates: [
        { id: '2h', cells: [{ x: 0, y: 0, w: 1, h: 0.5 }, { x: 0, y: 0.5, w: 1, h: 0.5 }] },
        { id: '2v', cells: [{ x: 0, y: 0, w: 0.5, h: 1 }, { x: 0.5, y: 0, w: 0.5, h: 1 }] },
    ]},
    { title: '3', templates: [
        { id: '3h', cells: [{ x: 0, y: 0, w: 1, h: 1/3 }, { x: 0, y: 1/3, w: 1, h: 1/3 }, { x: 0, y: 2/3, w: 1, h: 1/3 }] },
        { id: '3v', cells: [{ x: 0, y: 0, w: 1/3, h: 1 }, { x: 1/3, y: 0, w: 1/3, h: 1 }, { x: 2/3, y: 0, w: 1/3, h: 1 }] },
        { id: '1-2h', cells: [{ x: 0, y: 0, w: 1, h: 0.5 }, { x: 0, y: 0.5, w: 0.5, h: 0.5 }, { x: 0.5, y: 0.5, w: 0.5, h: 0.5 }] },
        { id: '1-2v', cells: [{ x: 0, y: 0, w: 0.5, h: 1 }, { x: 0.5, y: 0, w: 0.5, h: 0.5 }, { x: 0.5, y: 0.5, w: 0.5, h: 0.5 }] },
        { id: '2-1v', cells: [{ x: 0, y: 0, w: 0.5, h: 0.5 }, { x: 0, y: 0.5, w: 0.5, h: 0.5 }, { x: 0.5, y: 0, w: 0.5, h: 1 }] },
    ]},
    { title: '4', templates: [
        { id: '2x2', cells: [{ x: 0, y: 0, w: 0.5, h: 0.5 }, { x: 0.5, y: 0, w: 0.5, h: 0.5 }, { x: 0, y: 0.5, w: 0.5, h: 0.5 }, { x: 0.5, y: 0.5, w: 0.5, h: 0.5 }] },
        { id: '4h', cells: [{ x: 0, y: 0, w: 1, h: 0.25 }, { x: 0, y: 0.25, w: 1, h: 0.25 }, { x: 0, y: 0.5, w: 1, h: 0.25 }, { x: 0, y: 0.75, w: 1, h: 0.25 }] },
        { id: '4v', cells: [{ x: 0, y: 0, w: 0.25, h: 1 }, { x: 0.25, y: 0, w: 0.25, h: 1 }, { x: 0.5, y: 0, w: 0.25, h: 1 }, { x: 0.75, y: 0, w: 0.25, h: 1 }] },
        { id: '1-3', cells: [{ x: 0, y: 0, w: 1, h: 0.5 }, { x: 0, y: 0.5, w: 1/3, h: 0.5 }, { x: 1/3, y: 0.5, w: 1/3, h: 0.5 }, { x: 2/3, y: 0.5, w: 1/3, h: 0.5 }] },
        { id: '3-1', cells: [{ x: 0, y: 0, w: 1/3, h: 0.5 }, { x: 1/3, y: 0, w: 1/3, h: 0.5 }, { x: 2/3, y: 0, w: 1/3, h: 0.5 }, { x: 0, y: 0.5, w: 1, h: 0.5 }] },
    ]},
    { title: '5', templates: [
        { id: '2-3', cells: [{ x: 0, y: 0, w: 0.5, h: 0.5 }, { x: 0.5, y: 0, w: 0.5, h: 0.5 }, { x: 0, y: 0.5, w: 1/3, h: 0.5 }, { x: 1/3, y: 0.5, w: 1/3, h: 0.5 }, { x: 2/3, y: 0.5, w: 1/3, h: 0.5 }] },
        { id: '1-4', cells: [{ x: 0, y: 0, w: 0.5, h: 1 }, { x: 0.5, y: 0, w: 0.25, h: 0.5 }, { x: 0.75, y: 0, w: 0.25, h: 0.5 }, { x: 0.5, y: 0.5, w: 0.25, h: 0.5 }, { x: 0.75, y: 0.5, w: 0.25, h: 0.5 }] },
    ]},
    { title: '6', templates: [
        { id: '3x2', cells: [{x:0,y:0,w:1/3,h:0.5},{x:1/3,y:0,w:1/3,h:0.5},{x:2/3,y:0,w:1/3,h:0.5},{x:0,y:0.5,w:1/3,h:0.5},{x:1/3,y:0.5,w:1/3,h:0.5},{x:2/3,y:0.5,w:1/3,h:0.5}] },
        { id: '2x3', cells: [{x:0,y:0,w:0.5,h:1/3},{x:0.5,y:0,w:0.5,h:1/3},{x:0,y:1/3,w:0.5,h:1/3},{x:0.5,y:1/3,w:0.5,h:1/3},{x:0,y:2/3,w:0.5,h:1/3},{x:0.5,y:2/3,w:0.5,h:1/3}] },
        { id: '2-4', cells: [{x:0,y:0,w:0.5,h:0.5},{x:0.5,y:0,w:0.5,h:0.5},{x:0,y:0.5,w:0.25,h:0.5},{x:0.25,y:0.5,w:0.25,h:0.5},{x:0.5,y:0.5,w:0.25,h:0.5},{x:0.75,y:0.5,w:0.25,h:0.5}] },
    ]},
    { title: '7', templates: [
        { id: '3-1-3', cells: [
            {x:0,y:0,w:1/3,h:1/3},{x:1/3,y:0,w:1/3,h:1/3},{x:2/3,y:0,w:1/3,h:1/3},
            {x:0,y:1/3,w:1,h:1/3},
            {x:0,y:2/3,w:1/3,h:1/3},{x:1/3,y:2/3,w:1/3,h:1/3},{x:2/3,y:2/3,w:1/3,h:1/3},
        ]},
        { id: '1-big-left-6', cells: [
            {x:0,y:0,w:0.5,h:1},
            {x:0.5, y:0, w:0.25, h:1/3},{x:0.75, y:0, w:0.25, h:1/3},
            {x:0.5, y:1/3, w:0.25, h:1/3},{x:0.75, y:1/3, w:0.25, h:1/3},
            {x:0.5, y:2/3, w:0.25, h:1/3},{x:0.75, y:2/3, w:0.25, h:1/3},
        ]},
    ]},
    { title: '8', templates: [
        { id: '4x2', cells: Array.from({length: 8}).map((_, i) => ({ x: (i % 4) * 0.25, y: Math.floor(i / 4) * 0.5, w: 0.25, h: 0.5 })) },
        { id: '1-big-7', cells: [
            {x:1/4,y:1/4,w:0.5,h:0.5},
            {x:0,y:0,w:1/4,h:1/4},{x:1/4,y:0,w:0.5,h:1/4},{x:3/4,y:0,w:1/4,h:1/4},
            {x:0,y:1/4,w:1/4,h:0.5},
            {x:3/4,y:1/4,w:1/4,h:0.5},
            {x:0,y:3/4,w:1/4,h:1/4},{x:1/4,y:3/4,w:0.5,h:1/4},{x:3/4,y:3/4,w:1/4,h:1/4},
        ]},
    ]},
    { title: '9', templates: [
        { id: '3x3', cells: Array.from({length: 9}).map((_, i) => ({ x: (i % 3) * (1/3), y: Math.floor(i / 3) * (1/3), w: 1/3, h: 1/3 })) },
    ]},
];

const predefinedBackgrounds = [
  'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=1200',
  'https://images.unsplash.com/photo-1511300636412-01434d189a69?q=80&w=1200',
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200',
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1200',
  'https://images.unsplash.com/photo-1444703686981-a3abbc4d42e2?q=80&w=1200',
  'https://images.unsplash.com/photo-1454372182658-c712e4c5a1db?q=80&w=1200'
];

const fonts = ['Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Verdana', 'Georgia', 'Impact', 'Comic Sans MS'];

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
const ImageCollage: React.FC = () => {
    const { t } = useTranslation();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const singleFileRef = useRef<{ cellIndex: number } | null>(null);
    const canvasContainerRef = useRef<HTMLDivElement>(null);
    const shapeButtonRef = useRef<HTMLButtonElement>(null);
    const shapePopoverRef = useRef<HTMLDivElement>(null);


    const [activePanel, setActivePanel] = useState<PanelType>('layouts');
    const [layers, setLayers] = useState<fabric.Object[]>([]);
    const [activeLayout, setActiveLayout] = useState<LayoutTemplate>(layouts[0].templates[0]);
    const [placedImages, setPlacedImages] = useState<Record<number, PlacedImage>>({});
    const [activeObject, setActiveObject] = useState<fabric.Object | null>(null);
    const [shapePopoverOpen, setShapePopoverOpen] = useState(false);

    const [canvasSettings, setCanvasSettings] = useState({
        width: 1200, height: 1200, backgroundColor: '#FFFFFF', borderColor: '#E5E7EB',
        outerBorder: 25, spacing: 25, cornerRadius: 0,
        backgroundType: 'color' as BackgroundType, backgroundImage: null as string | null,
    });
    const [isRatioLocked, setIsRatioLocked] = useState(true);
    const [fileName, setFileName] = useState('collage');
    const [viewScale, setViewScale] = useState(1);
    
    const activeCellIndex = (activeObject as any)?.isCollageImage ? (activeObject as any).cellIndex : null;
    const activeTextObject = activeObject?.type === 'i-text' ? activeObject as fabric.IText : null;
    const activeShapeObject = (activeObject as any)?.isShape ? activeObject : null;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                shapePopoverOpen &&
                shapeButtonRef.current &&
                !shapeButtonRef.current.contains(event.target as Node) &&
                shapePopoverRef.current &&
                !shapePopoverRef.current.contains(event.target as Node)
            ) {
                setShapePopoverOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [shapePopoverOpen]);

    useEffect(() => {
        const container = canvasContainerRef.current;
        if (!container) return;

        const updateScale = () => {
            const { width: containerWidth, height: containerHeight } = container.getBoundingClientRect();
            const canvasWidth = canvasSettings.width;
            const canvasHeight = canvasSettings.height;
            
            const padding = 32; // 16px on each side
            const availableWidth = containerWidth - padding;
            const availableHeight = containerHeight - padding;

            if (canvasWidth <= 0 || canvasHeight <= 0 || availableWidth <= 0 || availableHeight <= 0) {
                return;
            }

            const scale = Math.min(
                availableWidth / canvasWidth,
                availableHeight / canvasHeight
            );
            
            setViewScale(scale);
        };

        const resizeObserver = new ResizeObserver(updateScale);
        resizeObserver.observe(container);
        updateScale();

        return () => resizeObserver.disconnect();
    }, [canvasSettings.width, canvasSettings.height]);

    const updateLayers = useCallback(() => {
        const canvas = fabricCanvasRef.current;
        if (canvas) {
            const objects = canvas.getObjects().filter(obj => obj.type === 'i-text' || (obj as any).isShape);
            setLayers(objects);
        }
    }, []);
    
    const renderCollageOnCanvas = useCallback(() => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        const currentTextObjects = canvas.getObjects().filter(o => o.type === 'i-text' || (o as any).isShape);
        
        const { outerBorder, spacing, cornerRadius, borderColor } = canvasSettings;
        const totalWidth = canvas.getWidth();
        const totalHeight = canvas.getHeight();
        const gridWidth = totalWidth - outerBorder * 2;
        const gridHeight = totalHeight - outerBorder * 2;

        const imagePromises = (Object.entries(placedImages) as [string, PlacedImage][]).map(([indexStr, placedImage]) => {
            const index = parseInt(indexStr);
            const cell = activeLayout.cells[index];
            if (!cell) return Promise.resolve(null);
            
            const cellLeft = outerBorder + gridWidth * cell.x + (cell.x > 0 ? spacing / 2 : 0);
            const cellTop = outerBorder + gridHeight * cell.y + (cell.y > 0 ? spacing / 2 : 0);
            const cellWidth = gridWidth * cell.w - (cell.x > 0 && cell.x + cell.w < 1 ? spacing : (cell.x === 0 || cell.x + cell.w === 1 ? spacing / 2 : 0));
            const cellHeight = gridHeight * cell.h - (cell.y > 0 && cell.y + cell.h < 1 ? spacing : (cell.y === 0 || cell.y + cell.h === 1 ? spacing / 2 : 0));

            return fabric.Image.fromURL(placedImage.src).then(img => {
                const imgRatio = img.width! / img.height!;
                const cellRatio = cellWidth / cellHeight;
                let scale = (imgRatio > cellRatio ? cellHeight / img.height! : cellWidth / img.width!) * placedImage.zoom;
                img.set({
                    left: cellLeft + cellWidth * placedImage.offsetX,
                    top: cellTop + cellHeight * placedImage.offsetY,
                    scaleX: scale, scaleY: scale,
                    originX: 'center', originY: 'center',
                    clipPath: new fabric.Rect({
                        left: cellLeft, top: cellTop, width: cellWidth, height: cellHeight,
                        rx: cornerRadius, ry: cornerRadius, absolutePositioned: true,
                    }),
                    selectable: true, hasControls: false, hasBorders: true,
                    borderColor: '#4338CA', hoverCursor: 'grab',
                    cellIndex: index, isCollageImage: true,
                } as any);
                return img;
            });
        });

        Promise.all(imagePromises).then(loadedImages => {
            const objectsToKeep = [...currentTextObjects, ...loadedImages.filter(img => img !== null)];
            canvas.remove(...canvas.getObjects());

            // 1. Add border background
            const borderRect = new fabric.Rect({
                left: 0, top: 0, width: totalWidth, height: totalHeight,
                fill: borderColor, selectable: false, evented: false, isBorderRect: true,
            } as any);
            canvas.add(borderRect);

            // 2. Add loaded images
            objectsToKeep.filter(o => (o as any).isCollageImage).forEach(img => canvas.add(img!));

            // 3. Add placeholders
            activeLayout.cells.forEach((cell, index) => {
                if (!placedImages[index]) {
                    const cellLeft = outerBorder + gridWidth * cell.x + (cell.x > 0 ? spacing / 2 : 0);
                    const cellTop = outerBorder + gridHeight * cell.y + (cell.y > 0 ? spacing / 2 : 0);
                    const cellWidth = gridWidth * cell.w - (cell.x > 0 && cell.x + cell.w < 1 ? spacing : (cell.x === 0 || cell.x + cell.w === 1 ? spacing / 2 : 0));
                    const cellHeight = gridHeight * cell.h - (cell.y > 0 && cell.y + cell.h < 1 ? spacing : (cell.y === 0 || cell.y + cell.h === 1 ? spacing / 2 : 0));
                    
                    const placeholder = new fabric.Rect({
                        left: cellLeft, top: cellTop, width: cellWidth, height: cellHeight,
                        fill: '#FFFFFF', stroke: '#E5E7EB', strokeWidth: 1, rx: cornerRadius, ry: cornerRadius,
                        selectable: false, hoverCursor: 'pointer',
                    });
                    const plusSign = new fabric.Text('+', {
                        fontSize: Math.min(cellWidth, cellHeight) / 4, fill: '#9CA3AF',
                        left: placeholder.left! + cellWidth / 2, top: placeholder.top! + cellHeight / 2,
                        originX: 'center', originY: 'center', selectable: false,
                    });
                    const group = new fabric.Group([placeholder, plusSign], {
                        selectable: false, hoverCursor: 'pointer', isPlaceholderGroup: true, cellIndex: index,
                    } as any);
                    canvas.add(group);
                }
            });

            // 4. Add text objects back on top
            objectsToKeep.filter(o => o.type === 'i-text' || (o as any).isShape).forEach(obj => canvas.add(obj));

            canvas.renderAll();
            updateLayers();
        });

    }, [activeLayout, canvasSettings, placedImages, updateLayers]);

    useEffect(() => {
        const canvas: any = new fabric.Canvas(canvasRef.current, {
            width: canvasSettings.width, height: canvasSettings.height,
        });
        fabricCanvasRef.current = canvas;

        const handleMouseDown = (opt: fabric.TPointerEventInfo<any>) => {
            const target = opt.target as any;
            const effectiveTarget = (target?.group && (target.group as any).isPlaceholderGroup) ? target.group : target;
        
            if (effectiveTarget?.isPlaceholderGroup) {
                singleFileRef.current = { cellIndex: effectiveTarget.cellIndex };
                fileInputRef.current?.removeAttribute('multiple');
                fileInputRef.current?.click();
            } else if (target?.isCollageImage) {
                target.set('hoverCursor', 'grabbing');
            }
        };
        const handleMouseUp = (opt: fabric.TPointerEventInfo<any>) => {
            const target = opt.target as any;
            if (target?.isCollageImage) target.set('hoverCursor', 'grab');
        };

       const handleSelection = (opt: any) => setActiveObject(opt.selected[0]);
       const handleSelectionCleared = () => setActiveObject(null);
       const handleObjectModified = (opt: any) => {
            const obj = opt.target;
            if((obj as any).isCollageImage) {
                const img = obj as fabric.Image;
                const clipPath = img.clipPath as fabric.Rect;
                const { width: cellWidth, height: cellHeight, left: cellLeft, top: cellTop } = clipPath;
                const offsetX = (img.left! - cellLeft!) / cellWidth!;
                const offsetY = (img.top! - cellTop!) / cellHeight!;
                setPlacedImages(prev => {
                    const cellIndex = (img as any).cellIndex;
                    const existingData = prev[cellIndex];
                    if (existingData) {
                        return {
                            ...prev,
                            [cellIndex]: {
                                ...existingData,
                                offsetX,
                                offsetY,
                            },
                        };
                    }
                    return prev;
                });
            }
            updateLayers();
        };

        canvas.on('mouse:down', handleMouseDown);
        canvas.on('mouse:up', handleMouseUp);
        canvas.on('selection:created', handleSelection);
        canvas.on('selection:updated', handleSelection);
        canvas.on('selection:cleared', handleSelectionCleared);
        canvas.on('object:modified', handleObjectModified);
        canvas.on('object:added', updateLayers);
        canvas.on('object:removed', updateLayers);

        return () => { canvas.dispose(); };
    }, [updateLayers, canvasSettings.width, canvasSettings.height]);
    
    useEffect(() => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        const updateBackground = async () => {
            if (canvasSettings.backgroundType === 'image' && canvasSettings.backgroundImage) {
                canvas.backgroundColor = '#FFFFFF';
                try {
                    const img = await fabric.Image.fromURL(canvasSettings.backgroundImage, { crossOrigin: 'anonymous' });

                    if (!img.width || !img.height) return;
                    const canvasWidth = canvas.getWidth();
                    const canvasHeight = canvas.getHeight();
                    const canvasAspect = canvasWidth / canvasHeight;
                    const imgAspect = img.width / img.height;
                    let scaleX, scaleY;
                    if (imgAspect >= canvasAspect) {
                        scaleY = canvasHeight / img.height; scaleX = scaleY;
                    } else {
                        scaleX = canvasWidth / img.width; scaleY = scaleX;
                    }

                    img.set({
                        scaleX, scaleY, originX: 'center', originY: 'center',
                        left: canvasWidth / 2, top: canvasHeight / 2,
                    });
                    canvas.backgroundImage = img;
                    canvas.renderAll();
                } catch (e) {
                    console.error("Error loading background image", e);
                }
            } else {
                canvas.backgroundImage = null;
                canvas.backgroundColor = canvasSettings.backgroundColor;
                canvas.renderAll();
            }
        };

        updateBackground();

    }, [canvasSettings.backgroundType, canvasSettings.backgroundImage, canvasSettings.backgroundColor]);

    useEffect(() => {
        const canvas = fabricCanvasRef.current;
        if (canvas) {
            canvas.setWidth(canvasSettings.width);
            canvas.setHeight(canvasSettings.height);
            renderCollageOnCanvas();
        }
    }, [canvasSettings.width, canvasSettings.height, renderCollageOnCanvas]);

    useEffect(() => { renderCollageOnCanvas(); }, [renderCollageOnCanvas]);
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        const currentFileRef = singleFileRef.current; 

        if (currentFileRef) {
            const { cellIndex } = currentFileRef; 
            const file = files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => setPlacedImages(prev => ({ ...prev, [cellIndex]: { src: event.target?.result as string, zoom: 1, offsetX: 0.5, offsetY: 0.5 }}));
                reader.readAsDataURL(file);
            }
        } else {
            const canvas = fabricCanvasRef.current;
            if(!canvas) return;
            const availableSlots = activeLayout.cells.map((_, i) => i).filter(i => !placedImages[i]);
            
            let newImages = {...placedImages};
            let filesAdded = 0;
            const fileList = Array.from(files);
            fileList.slice(0, availableSlots.length).forEach((file, i) => {
                const reader = new FileReader();
                reader.onload = (event) => {
                    newImages[availableSlots[i]] = { src: event.target?.result as string, zoom: 1, offsetX: 0.5, offsetY: 0.5 };
                    filesAdded++;
                    if (filesAdded === Math.min(fileList.length, availableSlots.length)) {
                        setPlacedImages(newImages);
                    }
                };
                reader.readAsDataURL(file);
            });
        }
        e.target.value = '';
        singleFileRef.current = null;
    };
    
    const handleDownload = () => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;
        
        const currentVpt = canvas.viewportTransform;
        
        canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
        canvas.discardActiveObject();
        canvas.renderAll();

        const link = document.createElement('a');
        link.download = `${fileName}.png`;
        link.href = canvas.toDataURL({ format: 'png', quality: 1, multiplier: 1 });
        link.click();

        canvas.setViewportTransform(currentVpt || [1, 0, 0, 1, 0, 0]);
        canvas.renderAll();
    };

    const handlePanelSelect = (panel: PanelType) => {
        setActivePanel(p => p === panel ? null : panel);
        fabricCanvasRef.current?.discardActiveObject();
        fabricCanvasRef.current?.renderAll();
    };

    const handleAddImages = () => {
        const input = fileInputRef.current;
        if (input) {
            input.setAttribute('multiple', 'true');
            input.click();
        }
    };
    
    const handleAddText = () => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;
        const text = new fabric.IText('Your Text', {
            left: canvas.getWidth() / 2, top: canvas.getHeight() / 2,
            originX: 'center', originY: 'center', fontFamily: 'Arial',
            fontSize: 50, fill: '#333333',
        });
        canvas.add(text);
        canvas.setActiveObject(text);
        canvas.renderAll();
    };

    const handleAddShape = useCallback((type: string) => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;
    
        let shape;
        const commonOptions: any = {
            left: canvas.getWidth() / 2,
            top: canvas.getHeight() / 2,
            originX: 'center',
            originY: 'center',
            fill: '#A855F7',
            isShape: true,
        };
    
        switch (type) {
            case 'rect':
                shape = new fabric.Rect({ ...commonOptions, width: 150, height: 100 });
                break;
            case 'circle':
                shape = new fabric.Circle({ ...commonOptions, radius: 75 });
                break;
            case 'triangle':
                shape = new fabric.Triangle({ ...commonOptions, width: 150, height: 120 });
                break;
            case 'star':
                const createStarPoints = (outerRadius: number, innerRadius: number) => {
                    const points = [];
                    const angle = Math.PI / 5;
                    for (let i = 0; i < 10; i++) {
                        const radius = i % 2 === 0 ? outerRadius : innerRadius;
                        const x = radius * Math.sin(i * angle);
                        const y = -radius * Math.cos(i * angle);
                        points.push({ x, y });
                    }
                    return points;
                };
                shape = new fabric.Polygon(createStarPoints(80, 40), { ...commonOptions });
                break;
            case 'heart':
                const heartPath = 'M 272.70141,238.71731 C 206.46141,238.71731 152.70146,292.47726 152.70146,358.71725 C 152.70146,493.47288 272.70141,528.71725 272.70141,528.71725 C 272.70141,528.71725 392.70135,493.47288 392.70135,358.71725 C 392.70135,292.47726 338.94141,238.71731 272.70141,238.71731 Z';
                shape = new fabric.Path(heartPath, { ...commonOptions });
                shape.scaleToWidth(150);
                break;
        }
    
        if (shape) {
            canvas.add(shape);
            canvas.setActiveObject(shape);
            canvas.renderAll();
        }
        setShapePopoverOpen(false);
    }, []);
    
    const RightPanelContent = () => {
        if (activeObject) {
            if ((activeObject as any).isCollageImage) {
                return <ImageSettingsPanel activeCellIndex={activeCellIndex} placedImages={placedImages} setPlacedImages={setPlacedImages} />;
            }
            if (activeObject.type === 'i-text') {
                return <TextSettingsPanel textObject={activeTextObject!} canvas={fabricCanvasRef.current!} />;
            }
            if ((activeObject as any).isShape) {
                return <ShapeSettingsPanel shape={activeShapeObject!} canvas={fabricCanvasRef.current!} />;
            }
        }
        
        switch(activePanel) {
            case 'layouts': return <LayoutsPanel activeLayout={activeLayout} setActiveLayout={setActiveLayout} placedImages={placedImages} />;
            case 'layers': return <LayersPanel layers={layers} canvas={fabricCanvasRef.current} />;
            case 'canvas': return <CanvasSettingsPanel settings={canvasSettings} setSettings={setCanvasSettings} isRatioLocked={isRatioLocked} setIsRatioLocked={setIsRatioLocked} />;
            case 'export': return <ExportPanel fileName={fileName} setFileName={setFileName} />;
            default:
                return <CanvasSettingsPanel settings={canvasSettings} setSettings={setCanvasSettings} isRatioLocked={isRatioLocked} setIsRatioLocked={setIsRatioLocked} />;
        }
    };
    
    const toolbarItems: { id: PanelType, icon: React.ComponentType, label: string }[] = [
        { id: 'layouts', icon: LayoutIcon, label: t('tools.imageCollage.layouts')},
        { id: 'layers', icon: LayersIcon, label: t('tools.imageCollage.layers')},
        { id: 'canvas', icon: SlidersIcon, label: t('tools.imageCollage.canvas') },
        { id: 'export', icon: DownloadIcon, label: t('tools.imageCollage.export') },
    ];
    
    const shapeOptions = [
        { type: 'rect', icon: SquareIcon, label: 'Rectangle' },
        { type: 'circle', icon: CircleIcon, label: 'Circle' },
        { type: 'triangle', icon: TriangleIcon, label: 'Triangle' },
        { type: 'star', icon: StarIcon, label: 'Star' },
        { type: 'heart', icon: HeartIcon, label: 'Heart' },
    ];

    return (
        <div>
            <ToolHeader title={t('tools.imageCollage.pageTitle')} description={t('tools.imageCollage.pageDescription')} />
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
            
            <div className="bg-secondary dark:bg-d-secondary rounded-xl border border-border-color dark:border-d-border-color shadow-lg">
                <div className="flex items-center gap-2 md:gap-4 p-2 border-b border-border-color dark:border-d-border-color">
                    <button onClick={handleAddImages} className="px-3 py-2 text-sm bg-accent/90 dark:bg-d-accent/90 text-white dark:text-d-primary font-semibold rounded-lg hover:bg-accent dark:hover:bg-d-accent transition-colors flex-shrink-0">{t('tools.imageCollage.addImages')}</button>
                    <button onClick={handleAddText} className="px-3 py-2 text-sm bg-primary dark:bg-d-primary font-semibold rounded-lg hover:bg-border-color dark:hover:bg-d-border-color transition-colors flex-shrink-0">{t('tools.imageCollage.addText')}</button>
                    <div className="relative">
                        <button ref={shapeButtonRef} onClick={() => setShapePopoverOpen(p => !p)} className="px-3 py-2 text-sm bg-primary dark:bg-d-primary font-semibold rounded-lg hover:bg-border-color dark:hover:bg-d-border-color transition-colors flex-shrink-0 flex items-center gap-2">
                           <ShapesIcon className="w-4 h-4" /> 
                           <span>{t('tools.imageCollage.addShapes')}</span>
                        </button>
                        {shapePopoverOpen && (
                            <div ref={shapePopoverRef} className="absolute top-full mt-2 w-48 bg-secondary dark:bg-d-secondary rounded-lg shadow-xl border border-border-color dark:border-d-border-color p-2 z-10">
                                {shapeOptions.map(shape => (
                                    <button key={shape.type} onClick={() => handleAddShape(shape.type)} className="w-full flex items-center gap-3 p-2 text-sm rounded-md hover:bg-primary dark:hover:bg-d-primary">
                                        <shape.icon className="w-5 h-5" />
                                        <span>{shape.label}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="flex-grow"></div>
                    <button onClick={handleDownload} className="flex items-center gap-2 px-3 py-2 text-sm bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors flex-shrink-0">
                        <DownloadIcon />
                        <span className="hidden md:inline">{t('tools.imageCollage.download')}</span>
                    </button>
                </div>
                <div className="flex flex-col xl:flex-row min-h-[65vh] max-h-[65vh]">
                    <div className="w-full xl:w-20 flex-shrink-0 border-b xl:border-b-0 xl:border-r border-border-color dark:border-d-border-color py-2 xl:py-0">
                       <div className="flex xl:flex-col">
                         {toolbarItems.map(item => (
                            <ToolbarButton 
                                key={item.id} 
                                icon={item.icon} 
                                label={item.label} 
                                isActive={activePanel === item.id && activeObject === null} 
                                onClick={() => handlePanelSelect(item.id)}
                            />
                        ))}
                       </div>
                    </div>

                    <div ref={canvasContainerRef} className="flex-grow flex items-center justify-center p-4 bg-primary dark:bg-d-primary relative overflow-auto group">
                         <div style={{ transform: `scale(${viewScale})`, transformOrigin: 'center' }}>
                            <div className="shadow-lg bg-white">
                                <canvas ref={canvasRef} />
                            </div>
                        </div>
                    </div>

                    <div className="w-full xl:w-80 flex-shrink-0 border-t xl:border-t-0 xl:border-l border-border-color dark:border-d-border-color overflow-y-auto">
                        <RightPanelContent/>
                    </div>
                </div>
            </div>
        </div>
    );
};


// --- PANEL SUB-COMPONENTS ---
const LayoutsPanel: React.FC<{
    activeLayout: LayoutTemplate; setActiveLayout: (layout: LayoutTemplate) => void;
    placedImages: Record<number, PlacedImage>;
}> = ({ activeLayout, setActiveLayout, placedImages }) => {
    const { t } = useTranslation();
    const handleRandomLayout = () => {
        const numImages = Object.keys(placedImages).length;
        if (numImages === 0) return;
        const category = layouts.find(cat => cat.templates.some(t => t.cells.length === numImages));
        if (category) {
            const validTemplates = category.templates.filter(t => t.cells.length === numImages && t.id !== activeLayout.id);
            if(validTemplates.length > 0) {
                const randomTemplate = validTemplates[Math.floor(Math.random() * validTemplates.length)];
                setActiveLayout(randomTemplate);
            }
        }
    };
    return (
        <PropertiesPanel title={t('tools.imageCollage.layouts')}>
            <button onClick={handleRandomLayout} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary dark:bg-d-primary rounded-lg hover:bg-border-color dark:hover:bg-d-border-color"><RefreshIcon className="w-4 h-4" /> {t('tools.imageCollage.randomLayout')}</button>
            <div className="space-y-4">
                {layouts.map(category => (
                    <div key={category.title}>
                        <h4 className="font-semibold text-text-secondary dark:text-d-text-secondary mb-2">{category.title}</h4>
                        <div className="grid grid-cols-3 gap-3">
                            {category.templates.map(template => (
                                <button key={template.id} onClick={() => setActiveLayout(template)} className={`w-full aspect-square bg-primary dark:bg-d-primary p-1.5 rounded-lg hover:ring-2 ring-accent dark:ring-d-accent transition-all ${activeLayout.id === template.id ? 'ring-2 ring-accent dark:ring-d-accent bg-accent/10 dark:bg-d-accent/10' : ''}`}>
                                    <div className="relative w-full h-full">
                                        {template.cells.map((cell, i) => (
                                            <div key={i} className="absolute" style={{
                                                left: `${cell.x * 100}%`, top: `${cell.y * 100}%`,
                                                width: `${cell.w * 100}%`, height: `${cell.h * 100}%`,
                                                padding: '1px',
                                            }}>
                                                    <div className="w-full h-full bg-border-color dark:bg-d-border-color rounded-sm" />
                                            </div>
                                        ))}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </PropertiesPanel>
    );
};

const LayersPanel: React.FC<{ layers: fabric.Object[]; canvas: fabric.Canvas | null }> = ({ layers, canvas }) => {
    const { t } = useTranslation();
    if (!canvas) return null;
    
    const sortedLayers = layers.slice().reverse();

    const handleSelect = (obj: fabric.Object) => { canvas.setActiveObject(obj); canvas.renderAll(); };
    const handleAction = (action: 'bringForward' | 'sendBackwards' | 'remove', obj: fabric.Object) => {
        if (!canvas) return;
        if(action === 'bringForward') (canvas as any).bringForward(obj);
        if(action === 'sendBackwards') (canvas as any).sendBackwards(obj);
        if(action === 'remove') canvas.remove(obj);
        canvas.renderAll();
    };

    return (
        <PropertiesPanel title={t('tools.imageCollage.layers')}>
            <div className="space-y-2">
                {sortedLayers.map((obj, i) => {
                    const isShape = (obj as any).isShape;
                    const isText = obj.type === 'i-text';
                    const label = isText ? (obj as fabric.IText).text?.substring(0, 15) || `Text ${i}` : isShape ? `Shape ${i}` : `Layer ${i}`;
                    const Icon = isText ? TypeIcon : isShape ? SquareIcon : LayersIcon;
                    return (
                        <div key={(obj as any)._id || i} className="group p-2 bg-primary dark:bg-d-primary rounded-md flex items-center justify-between hover:bg-border-color/50 dark:hover:bg-d-border-color/50">
                            <button onClick={() => handleSelect(obj)} className="flex-grow text-left flex items-center gap-2 text-sm">
                                <Icon className="w-4 h-4" />
                                <span className="truncate">{label}</span>
                            </button>
                            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleAction('bringForward', obj)} title={t('tools.imageCollage.bringForward')} className="p-1 hover:bg-white/50 dark:hover:bg-black/20 rounded"><BringForwardIcon className="w-4 h-4" /></button>
                                <button onClick={() => handleAction('sendBackwards', obj)} title={t('tools.imageCollage.sendBackward')} className="p-1 hover:bg-white/50 dark:hover:bg-black/20 rounded"><SendBackwardIcon className="w-4 h-4" /></button>
                                <button onClick={() => handleAction('remove', obj)} title={t('tools.imageCollage.delete')} className="p-1 hover:bg-white/50 dark:hover:bg-black/20 rounded"><TrashIcon className="w-4 h-4" /></button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </PropertiesPanel>
    );
};

const CanvasSettingsPanel: React.FC<{settings: any, setSettings: any, isRatioLocked: boolean, setIsRatioLocked: any}> = ({settings, setSettings, isRatioLocked, setIsRatioLocked}) => {
    const { t } = useTranslation();
    const aspectRatio = useRef(settings.width / settings.height);
    const bgFileInputRef = useRef<HTMLInputElement>(null);
    const [bgTab, setBgTab] = useState<BackgroundType>('color');

    const handleWidthChange = (newWidth: number) => {
        if(isRatioLocked) setSettings((s: any) => ({ ...s, width: newWidth, height: Math.round(newWidth / aspectRatio.current) }));
        else setSettings((s: any) => ({ ...s, width: newWidth }));
    };
    const handleHeightChange = (newHeight: number) => {
        if(isRatioLocked) setSettings((s: any) => ({ ...s, height: newHeight, width: Math.round(newHeight * aspectRatio.current) }));
        else setSettings((s: any) => ({ ...s, height: newHeight }));
    };
    const toggleLock = () => {
        if (!isRatioLocked) aspectRatio.current = settings.width / settings.height;
        setIsRatioLocked(!isRatioLocked);
    };
    const applyPreset = (w: number, h: number) => {
        setSettings((s: any) => ({ ...s, width: w, height: h }));
        aspectRatio.current = w / h;
    };
    
    const handleBgFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const result = event.target?.result;
                if (typeof result === 'string') {
                    setSettings((s: any) => ({...s, backgroundImage: result, backgroundType: 'image'}));
                }
            };
            // FIX: Cast file to Blob to resolve TypeScript error where 'file' might be inferred as unknown or {}.
            reader.readAsDataURL(file as Blob);
        }
        e.target.value = '';
    };

    return (
        <PropertiesPanel title={t('tools.imageCollage.canvasSettings')}>
            <input type="file" ref={bgFileInputRef} onChange={handleBgFileChange} accept="image/*" className="hidden" />
            <LabeledControl label={t('tools.imageCollage.canvasPresets')}>
                <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => applyPreset(1200, 1200)} className="p-2 bg-primary dark:bg-d-primary rounded-md text-sm">{t('tools.imageCollage.presetSquare')}</button>
                    <button onClick={() => applyPreset(1080, 1350)} className="p-2 bg-primary dark:bg-d-primary rounded-md text-sm">{t('tools.imageCollage.presetPortrait')}</button>
                    <button onClick={() => applyPreset(1080, 1920)} className="p-2 bg-primary dark:bg-d-primary rounded-md text-sm">{t('tools.imageCollage.presetStory')}</button>
                </div>
            </LabeledControl>
            <LabeledControl label={t('tools.imageCollage.canvasSize')}>
                <div className="flex gap-2 items-center">
                    <input type="number" value={settings.width} onChange={e => handleWidthChange(parseInt(e.target.value, 10) || 100)} className="w-full p-2 text-center bg-primary dark:bg-d-primary rounded-md" />
                    <button onClick={toggleLock} title={t('tools.imageCollage.aspectRatioLock') as string} className="p-2 rounded-md hover:bg-primary dark:hover:bg-d-border-color">{isRatioLocked ? <LockIcon className="w-4 h-4"/> : <UnlockIcon className="w-4 h-4"/>}</button>
                    <input type="number" value={settings.height} onChange={e => handleHeightChange(parseInt(e.target.value, 10) || 100)} className="w-full p-2 text-center bg-primary dark:bg-d-primary rounded-md" />
                </div>
            </LabeledControl>
            <LabeledControl label={t('tools.imageCollage.outerBorder')} valueDisplay={`${settings.outerBorder}px`}>
                <input type="range" min="0" max="100" value={settings.outerBorder} onChange={e => setSettings((s: any) => ({...s, outerBorder: parseInt(e.target.value, 10)}))} className="w-full accent-accent dark:accent-d-accent" />
            </LabeledControl>
            <LabeledControl label={t('tools.imageCollage.spacing')} valueDisplay={`${settings.spacing}px`}>
                <input type="range" min="0" max="100" value={settings.spacing} onChange={e => setSettings((s: any) => ({...s, spacing: parseInt(e.target.value, 10)}))} className="w-full accent-accent dark:accent-d-accent" />
            </LabeledControl>
            <LabeledControl label={t('tools.imageCollage.cornerRadius')} valueDisplay={`${settings.cornerRadius}px`}>
                <input type="range" min="0" max="100" value={settings.cornerRadius} onChange={e => setSettings((s: any) => ({...s, cornerRadius: parseInt(e.target.value, 10)}))} className="w-full accent-accent dark:accent-d-accent" />
            </LabeledControl>
            <LabeledControl label={t('tools.imageCollage.borderColor')}>
                <input type="color" value={settings.borderColor} onChange={e => setSettings((s: any) => ({...s, borderColor: e.target.value}))} className="w-full h-10 p-1 bg-primary dark:bg-d-primary border-none rounded-md cursor-pointer" />
            </LabeledControl>
            <div className="pt-2 border-t border-border-color dark:border-d-border-color">
                <LabeledControl label={t('tools.imageCollage.canvasBackground')}>
                    <div className="flex bg-primary dark:bg-d-primary p-1 rounded-md border border-border-color dark:border-d-border-color">
                        <button onClick={() => setBgTab('color')} className={`w-1/2 py-1 text-xs rounded ${bgTab === 'color' ? 'bg-secondary dark:bg-d-secondary shadow' : ''}`}>{t('tools.imageCollage.color')}</button>
                        <button onClick={() => setBgTab('image')} className={`w-1/2 py-1 text-xs rounded ${bgTab === 'image' ? 'bg-secondary dark:bg-d-secondary shadow' : ''}`}>{t('tools.imageCollage.image')}</button>
                    </div>
                </LabeledControl>
                {bgTab === 'color' ? (
                    <input type="color" value={settings.backgroundColor} onChange={e => setSettings((s: any) => ({...s, backgroundColor: e.target.value, backgroundType: 'color'}))} className="w-full h-10 p-1 mt-2 bg-primary dark:bg-d-primary border-none rounded-md cursor-pointer" />
                ) : (
                    <div className="space-y-2 mt-2">
                        <div className="grid grid-cols-3 gap-2 h-40 overflow-y-auto">
                            {predefinedBackgrounds.map(url => (
                                <img key={url} src={url} onClick={() => setSettings((s:any) => ({...s, backgroundImage: url, backgroundType: 'image'}))} className="w-full h-20 object-cover rounded-md cursor-pointer hover:ring-2 ring-accent dark:ring-d-accent"/>
                            ))}
                        </div>
                        <button onClick={() => bgFileInputRef.current?.click()} className="w-full py-2 text-sm bg-primary dark:bg-d-primary rounded-md">{t('tools.imageCollage.uploadCustomBackground')}</button>
                        <button onClick={() => setSettings((s:any) => ({...s, backgroundImage: null, backgroundType: 'color'}))} className="w-full py-2 text-sm bg-primary dark:bg-d-primary rounded-md">{t('tools.imageCollage.resetBackground')}</button>
                    </div>
                )}
            </div>
        </PropertiesPanel>
    );
};

const ImageSettingsPanel: React.FC<{activeCellIndex: number, placedImages: Record<number, PlacedImage>, setPlacedImages: React.Dispatch<React.SetStateAction<Record<number, PlacedImage>>>}> = ({ activeCellIndex, placedImages, setPlacedImages }) => {
    const { t } = useTranslation();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const singleFileRef = useRef<{ cellIndex: number } | null>(null);

    const updateActiveImageData = (data: Partial<PlacedImage>) => {
        setPlacedImages((prev: Record<number, PlacedImage>) => {
            const existing = prev[activeCellIndex];
            if (!existing) return prev;
            return {
                ...prev,
                [activeCellIndex]: { ...existing, ...data }
            };
        });
    };
    const handleRemoveImage = () => {
        setPlacedImages((prev: Record<number, PlacedImage>) => {
            const newImages = { ...prev };
            delete newImages[activeCellIndex];
            return newImages;
        });
    };
    const handleReplaceImage = () => { singleFileRef.current = { cellIndex: activeCellIndex }; fileInputRef.current?.click(); };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files[0] && singleFileRef.current) {
            const file = files[0];
            const reader = new FileReader();
            reader.onload = (event) => setPlacedImages((prev: Record<number, PlacedImage>) => ({ ...prev, [singleFileRef.current!.cellIndex]: { src: event.target?.result as string, zoom: 1, offsetX: 0.5, offsetY: 0.5 }}));
            reader.readAsDataURL(file);
        }
        e.target.value = ''; singleFileRef.current = null;
    };

    return (
        <PropertiesPanel title={t('tools.imageCollage.imageSettings')}>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
            <div className="space-y-4">
                <LabeledControl label={t('tools.imageCollage.zoom')} valueDisplay={`${Math.round((placedImages[activeCellIndex]?.zoom || 0) * 100)}%`}>
                    <input type="range" min="0.5" max="3" step="0.01" value={placedImages[activeCellIndex]?.zoom || 1} onChange={e => updateActiveImageData({ zoom: parseFloat(e.target.value)})} className="w-full accent-accent dark:accent-d-accent" />
                </LabeledControl>
                <div className="grid grid-cols-2 gap-2 pt-2">
                    <button onClick={handleReplaceImage} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary dark:bg-d-primary rounded-lg hover:bg-border-color dark:hover:bg-d-border-color"><RefreshIcon className="w-4 h-4" />{t('tools.imageCollage.replaceImage')}</button>
                    <button onClick={handleRemoveImage} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 text-red-600 rounded-lg hover:bg-red-500/20"><TrashIcon className="w-4 h-4" />{t('tools.imageCollage.removeImage')}</button>
                </div>
            </div>
        </PropertiesPanel>
    );
};

const TextSettingsPanel: React.FC<{textObject: fabric.IText, canvas: fabric.Canvas}> = ({ textObject, canvas }) => {
    const { t } = useTranslation();
    const [text, setText] = useState(textObject.text || '');

    useEffect(() => { setText(textObject.text || ''); }, [textObject]);
    
    const updateProp = (prop: keyof fabric.IText, value: any) => { textObject.set(prop, value); canvas.renderAll(); };
    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => { setText(e.target.value); updateProp('text', e.target.value); };
    const handleDelete = () => { canvas.remove(textObject); canvas.discardActiveObject(); canvas.renderAll(); };

    return (
        <PropertiesPanel title={t('tools.imageCollage.textSettings')}>
            <div className="space-y-4">
                <textarea value={text} onChange={handleTextChange} className="w-full h-20 p-2 bg-primary dark:bg-d-primary rounded-md" />
                <LabeledControl label={t('tools.imageCollage.fontFamily')}>
                    <select value={textObject.fontFamily} onChange={e => updateProp('fontFamily', e.target.value)} className="w-full p-2 bg-primary dark:bg-d-primary rounded-md">
                        {fonts.map(font => <option key={font} value={font}>{font}</option>)}
                    </select>
                </LabeledControl>
                <div className="grid grid-cols-2 gap-4">
                    <LabeledControl label={t('tools.imageCollage.fontSize')}>
                        <input type="number" value={textObject.fontSize} onChange={e => updateProp('fontSize', parseInt(e.target.value, 10))} className="w-full p-2 bg-primary dark:bg-d-primary rounded-md" />
                    </LabeledControl>
                    <LabeledControl label={t('tools.imageCollage.color')}>
                        <input type="color" value={textObject.fill as string} onChange={e => updateProp('fill', e.target.value)} className="w-full h-10 p-1 bg-primary dark:bg-d-primary border-none rounded-md cursor-pointer" />
                    </LabeledControl>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => updateProp('fontWeight', textObject.fontWeight === 'bold' ? 'normal' : 'bold')} className={`flex-1 py-2 rounded-md ${textObject.fontWeight === 'bold' ? 'bg-accent text-white' : 'bg-primary dark:bg-d-primary'}`}>{t('tools.imageCollage.bold')}</button>
                    <button onClick={() => updateProp('fontStyle', textObject.fontStyle === 'italic' ? 'normal' : 'italic')} className={`flex-1 py-2 rounded-md ${textObject.fontStyle === 'italic' ? 'bg-accent text-white' : 'bg-primary dark:bg-d-primary'}`}>{t('tools.imageCollage.italic')}</button>
                </div>
                <LabeledControl label={t('tools.imageCollage.textAlign')}>
                    <div className="flex bg-primary dark:bg-d-primary p-1 rounded-md">
                        {['left', 'center', 'right'].map(align => (
                            <button key={align} onClick={() => updateProp('textAlign', align)} className={`w-1/3 py-1 text-xs rounded ${textObject.textAlign === align ? 'bg-secondary dark:bg-d-secondary shadow' : ''}`}>{align}</button>
                        ))}
                    </div>
                </LabeledControl>
                <button onClick={handleDelete} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 text-red-600 rounded-lg hover:bg-red-500/20"><TrashIcon className="w-4 h-4" />{t('tools.imageCollage.deleteText')}</button>
            </div>
        </PropertiesPanel>
    );
};

const ShapeSettingsPanel: React.FC<{shape: fabric.Object, canvas: fabric.Canvas}> = ({ shape, canvas }) => {
    const { t } = useTranslation();
    
    // Local state to manage UI and trigger re-renders
    const [localState, setLocalState] = useState({
        fillColor: '#A855F7',
        fillAlpha: 1,
        strokeColor: '#000000',
        strokeAlpha: 1,
        strokeWidth: 1,
    });
    
    // Sync local state when the selected shape changes
    useEffect(() => {
        const fill = shape.get('fill');
        const stroke = shape.get('stroke');
        const strokeWidth = shape.get('strokeWidth') || 1;

        let newFillColor = '#A855F7', newFillAlpha = 1;
        if (typeof fill === 'string') {
            const color = new fabric.Color(fill);
            newFillColor = '#' + color.toHex();
            newFillAlpha = color.getAlpha();
        }

        let newStrokeColor = '#000000', newStrokeAlpha = 1;
        if (typeof stroke === 'string') {
            const color = new fabric.Color(stroke);
            newStrokeColor = '#' + color.toHex();
            newStrokeAlpha = color.getAlpha();
        }
        
        setLocalState({
            fillColor: newFillColor,
            fillAlpha: newFillAlpha,
            strokeColor: newStrokeColor,
            strokeAlpha: newStrokeAlpha,
            strokeWidth: strokeWidth
        });
    }, [shape]);

    const handleFillColorChange = (newHex: string) => {
        setLocalState(s => ({ ...s, fillColor: newHex }));
        const color = new fabric.Color(newHex);
        color.setAlpha(localState.fillAlpha);
        shape.set('fill', color.toRgba());
        canvas.renderAll();
    };

    const handleFillOpacityChange = (newAlpha: number) => {
        setLocalState(s => ({ ...s, fillAlpha: newAlpha }));
        const color = new fabric.Color(localState.fillColor);
        color.setAlpha(newAlpha);
        shape.set('fill', color.toRgba());
        canvas.renderAll();
    };
    
    const handleStrokeColorChange = (newHex: string) => {
        setLocalState(s => ({ ...s, strokeColor: newHex }));
        const color = new fabric.Color(localState.strokeColor);
        color.setAlpha(localState.strokeAlpha);
        shape.set('stroke', color.toRgba());
        canvas.renderAll();
    };

    const handleStrokeOpacityChange = (newAlpha: number) => {
        setLocalState(s => ({ ...s, strokeAlpha: newAlpha }));
        const color = new fabric.Color(localState.strokeColor);
        color.setAlpha(newAlpha);
        shape.set('stroke', color.toRgba());
        canvas.renderAll();
    };

    const handleStrokeWidthChange = (newWidth: number) => {
        setLocalState(s => ({ ...s, strokeWidth: newWidth }));
        shape.set('strokeWidth', newWidth);
        canvas.renderAll();
    };

    const handleDelete = () => { canvas.remove(shape); canvas.discardActiveObject(); canvas.renderAll(); };

    return (
        <PropertiesPanel title={t('tools.imageCollage.shapeSettings')}>
            <div className="space-y-4">
                <LabeledControl label={t('tools.imageCollage.fill')}>
                    <input type="color" value={localState.fillColor} onChange={e => handleFillColorChange(e.target.value)} className="w-full h-10 p-1 bg-primary dark:bg-d-primary border-none rounded-md cursor-pointer" />
                </LabeledControl>
                 <LabeledControl label={`${t('tools.imageCollage.fill')} ${t('tools.imageCollage.opacity')}`} valueDisplay={`${Math.round(localState.fillAlpha * 100)}%`}>
                    <input type="range" min="0" max="1" step="0.01" value={localState.fillAlpha} onChange={e => handleFillOpacityChange(parseFloat(e.target.value))} className="w-full accent-accent dark:accent-d-accent" />
                </LabeledControl>
                 <div className="pt-2 border-t border-border-color dark:border-d-border-color">
                    <LabeledControl label={t('tools.imageCollage.stroke')}>
                        <input type="color" value={localState.strokeColor} onChange={e => handleStrokeColorChange(e.target.value)} className="w-full h-10 p-1 bg-primary dark:bg-d-primary border-none rounded-md cursor-pointer" />
                    </LabeledControl>
                    <LabeledControl label={`${t('tools.imageCollage.stroke')} ${t('tools.imageCollage.opacity')}`} valueDisplay={`${Math.round(localState.strokeAlpha * 100)}%`}>
                        <input type="range" min="0" max="1" step="0.01" value={localState.strokeAlpha} onChange={e => handleStrokeOpacityChange(parseFloat(e.target.value))} className="w-full accent-accent dark:accent-d-accent" />
                    </LabeledControl>
                    <LabeledControl label={t('tools.imageCollage.strokeWidth')} valueDisplay={`${localState.strokeWidth}px`}>
                        <input type="range" min="0" max="50" value={localState.strokeWidth} onChange={e => handleStrokeWidthChange(parseInt(e.target.value, 10))} className="w-full accent-accent dark:accent-d-accent" />
                    </LabeledControl>
                 </div>
                <button onClick={handleDelete} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 text-red-600 rounded-lg hover:bg-red-500/20"><TrashIcon className="w-4 h-4" />{t('tools.imageCollage.deleteText')}</button>
            </div>
        </PropertiesPanel>
    );
};

const ExportPanel: React.FC<{ fileName: string, setFileName: (name: string) => void }> = ({ fileName, setFileName }) => {
    const { t } = useTranslation();
    return (
        <PropertiesPanel title={t('tools.imageCollage.exportSettings')}>
            <LabeledControl label={t('tools.imageCollage.fileName')}>
                <input type="text" value={fileName} onChange={e => setFileName(e.target.value)} className="w-full p-2 bg-primary dark:bg-d-primary rounded-md" />
            </LabeledControl>
             <LabeledControl label={t('tools.imageCollage.format')}>
                <input type="text" value="PNG" disabled className="w-full p-2 bg-primary dark:bg-d-primary rounded-md opacity-70" />
            </LabeledControl>
        </PropertiesPanel>
    )
}

export default ImageCollage;