import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import * as fabric from 'fabric';
import { useToolState } from '../contexts/ToolStateContext';
import { ToolHeader } from '../components/ui/ToolHeader';
import { Accordion } from '../components/ui/Accordion';
import { LabeledControl } from '../components/ui/LabeledControl';

interface MemeState {
    topText: string;
    bottomText: string;
    fontFamily: string;
    textColor: string;
    outlineColor: string;
    fontSize: number;
    outlineWidth: number;
    topTextRotation: number;
    bottomTextRotation: number;
}

const MemeGenerator: React.FC = () => {
    const { t } = useTranslation();
    const { state, setState } = useToolState<MemeState>('meme-generator', {
        topText: 'TOP TEXT',
        bottomText: 'BOTTOM TEXT',
        fontFamily: 'Impact',
        textColor: '#FFFFFF',
        outlineColor: '#000000',
        fontSize: 50,
        outlineWidth: 2,
        topTextRotation: 0,
        bottomTextRotation: 0,
    });
    const { topText, bottomText, fontFamily, textColor, outlineColor, fontSize, outlineWidth, topTextRotation, bottomTextRotation } = state;

    const [hasImage, setHasImage] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
    const topTextRef = useRef<fabric.IText | null>(null);
    const bottomTextRef = useRef<fabric.IText | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fonts = ['Impact', 'Arial', 'Helvetica', 'Comic Sans MS', 'Times New Roman', 'Courier New'];

    const addTextToCanvas = useCallback(() => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        if (topTextRef.current) canvas.remove(topTextRef.current);
        if (bottomTextRef.current) canvas.remove(bottomTextRef.current);

        const canvasWidth = canvas.getWidth();
        const canvasHeight = canvas.getHeight();

        const commonTextOptions = {
            fontFamily,
            fill: textColor,
            stroke: outlineColor,
            strokeWidth: outlineWidth,
            textAlign: 'center' as const,
            originX: 'center' as const,
            padding: 10,
            cornerColor: '#4F46E5',
            cornerStyle: 'circle' as const,
            transparentCorners: false,
        };

        const newTopText = new fabric.IText(topText, {
            ...commonTextOptions,
            top: 20,
            left: canvasWidth / 2,
            width: canvasWidth * 0.9,
            fontSize: fontSize,
            angle: topTextRotation,
            originY: 'top' as const,
        });

        const newBottomText = new fabric.IText(bottomText, {
            ...commonTextOptions,
            top: canvasHeight - 20,
            left: canvasWidth / 2,
            width: canvasWidth * 0.9,
            fontSize: fontSize,
            angle: bottomTextRotation,
            originY: 'bottom' as const,
        });
        
        const syncState = (obj: fabric.IText, isTop: boolean) => {
            const angle = Math.round(obj.angle || 0);
            const newFontSize = Math.round(obj.fontSize || 0);
            const newState: Partial<MemeState> = { fontSize: newFontSize };
            if (isTop) {
                newState.topTextRotation = angle;
            } else {
                newState.bottomTextRotation = angle;
            }
            setState(s => ({ ...s, ...newState }));
        };
        
        newTopText.on('modified', () => syncState(newTopText, true));
        newBottomText.on('modified', () => syncState(newBottomText, false));

        canvas.add(newTopText, newBottomText);
        topTextRef.current = newTopText;
        bottomTextRef.current = newBottomText;
    }, [fontFamily, textColor, outlineColor, topText, bottomText, topTextRotation, bottomTextRotation, fontSize, outlineWidth, setState]);

    const updateCanvasImage = (img: HTMLImageElement) => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        const container = canvasRef.current?.parentElement;
        if (!container) return;

        const maxContainerWidth = container.clientWidth;
        const scale = Math.min(1, maxContainerWidth / img.width);
        const canvasWidth = img.width * scale;
        const canvasHeight = img.height * scale;

        canvas.setWidth(canvasWidth);
        canvas.setHeight(canvasHeight);

        const fabImage = new fabric.Image(img, {
            scaleX: scale,
            scaleY: scale,
            selectable: false,
            evented: false,
        });
        canvas.backgroundImage = fabImage;
        canvas.renderAll();

        const initialFontSize = Math.round(canvasWidth / 10);
        const initialOutlineWidth = Math.round(canvasWidth / 300);
        
        setState(s => ({ ...s, fontSize: initialFontSize, outlineWidth: initialOutlineWidth }));
        setHasImage(true);
    };
    
    useEffect(() => {
        if(hasImage){
            addTextToCanvas();
        }
    }, [hasImage, addTextToCanvas]);

    const processFile = (file: File) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => updateCanvasImage(img);
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    useEffect(() => { topTextRef.current?.set('text', topText); fabricCanvasRef.current?.renderAll(); }, [topText]);
    useEffect(() => { bottomTextRef.current?.set('text', bottomText); fabricCanvasRef.current?.renderAll(); }, [bottomText]);
    useEffect(() => {
        const objects = [topTextRef.current, bottomTextRef.current];
        objects.forEach(obj => obj?.set({ fontFamily, fill: textColor, stroke: outlineColor, strokeWidth: outlineWidth, fontSize: fontSize }));
        fabricCanvasRef.current?.renderAll();
    }, [fontFamily, textColor, outlineColor, fontSize, outlineWidth]);
    useEffect(() => { topTextRef.current?.set('angle', topTextRotation); fabricCanvasRef.current?.renderAll(); }, [topTextRotation]);
    useEffect(() => { bottomTextRef.current?.set('angle', bottomTextRotation); fabricCanvasRef.current?.renderAll(); }, [bottomTextRotation]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => e.target.files?.[0] && processFile(e.target.files[0]);
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); e.dataTransfer.files?.[0] && processFile(e.dataTransfer.files[0]); };
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();

    const handleDownload = () => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;
        const link = document.createElement('a');
        link.download = 'meme.jpg';
        canvas.discardActiveObject();
        canvas.renderAll();
        link.href = canvas.toDataURL({ format: 'jpeg', quality: 0.9, multiplier: 1 });
        link.click();
    };

    const handleReset = () => {
        const canvas = fabricCanvasRef.current;
        if(!canvas) return;

        const canvasWidth = canvas.getWidth();
        const initialFontSize = Math.round(canvasWidth / 10);
        const initialOutlineWidth = Math.round(canvasWidth / 300);

        setState({
            topText: 'TOP TEXT',
            bottomText: 'BOTTOM TEXT',
            fontFamily: 'Impact',
            textColor: '#FFFFFF',
            outlineColor: '#000000',
            fontSize: initialFontSize,
            outlineWidth: initialOutlineWidth,
            topTextRotation: 0,
            bottomTextRotation: 0,
        });
    }
    
    useEffect(() => {
        const canvas = new fabric.Canvas(canvasRef.current, { backgroundColor: '#e5e7eb', selection: false });
        fabricCanvasRef.current = canvas;
        return () => { canvas.dispose(); fabricCanvasRef.current = null; };
    }, []);
    
    const set = (key: keyof MemeState) => (value: any) => setState(s => ({ ...s, [key]: value }));

    return (
        <div>
            <ToolHeader 
              title={t('tools.memeGenerator.pageTitle')}
              description={t('tools.memeGenerator.pageDescription')}
            />

            <div className="space-y-8">
                <div className="relative w-full min-h-[200px] md:min-h-[400px] bg-secondary dark:bg-d-secondary rounded-2xl border border-border-color dark:border-d-border-color flex items-center justify-center overflow-hidden">
                    <canvas ref={canvasRef} className={!hasImage ? 'opacity-0' : ''}></canvas>
                    {!hasImage && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 border-4 border-dashed border-border-color dark:border-d-border-color rounded-xl text-center cursor-pointer hover:border-accent dark:hover:border-d-accent transition-colors" onDrop={handleDrop} onDragOver={handleDragOver} onClick={() => fileInputRef.current?.click()}>
                            <svg className="mx-auto h-16 w-16 text-text-secondary dark:text-d-text-secondary" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            <p className="mt-4 text-lg font-semibold text-text-primary dark:text-d-text-primary">{t('tools.memeGenerator.uploadButton')}</p>
                            <p className="mt-1 text-sm text-text-secondary dark:text-d-text-secondary">{t('tools.memeGenerator.dropzone')}</p>
                        </div>
                    )}
                </div>
                
                <div className="bg-secondary dark:bg-d-secondary rounded-2xl border border-border-color dark:border-d-border-color">
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                    
                    <div className="p-4 flex flex-col sm:flex-row gap-4">
                        <button onClick={() => fileInputRef.current?.click()} className="flex-1 px-6 py-3 bg-accent dark:bg-d-accent text-white dark:text-d-primary font-semibold rounded-lg hover:opacity-90 transition-opacity duration-200 shadow-md">
                            {hasImage ? t('tools.memeGenerator.changeImage') : t('tools.memeGenerator.uploadButton')}
                        </button>
                         <button onClick={handleDownload} disabled={!hasImage} className="flex-1 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors duration-200 shadow-md disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed">
                            {t('tools.memeGenerator.downloadMeme')}
                        </button>
                         <button onClick={handleReset} disabled={!hasImage} className="flex-1 px-6 py-3 bg-border-color dark:bg-d-border-color text-text-primary dark:text-d-text-primary font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200 shadow-sm disabled:opacity-50">
                            {t('tools.memeGenerator.resetStyles')}
                        </button>
                    </div>

                    <fieldset disabled={!hasImage} className="disabled:opacity-50 transition-opacity">
                        <Accordion title={t('tools.memeGenerator.textActions')} defaultOpen>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <LabeledControl label={t('tools.memeGenerator.topText')} htmlFor="top-text">
                                    <input id="top-text" type="text" value={topText} onChange={(e) => set('topText')(e.target.value)} placeholder={t('tools.memeGenerator.placeholderTop')} className="w-full p-2 bg-primary dark:bg-d-primary border-none ring-1 ring-inset ring-border-color dark:ring-d-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-d-accent" />
                                </LabeledControl>
                                <LabeledControl label={t('tools.memeGenerator.bottomText')} htmlFor="bottom-text">
                                    <input id="bottom-text" type="text" value={bottomText} onChange={(e) => set('bottomText')(e.target.value)} placeholder={t('tools.memeGenerator.placeholderBottom')} className="w-full p-2 bg-primary dark:bg-d-primary border-none ring-1 ring-inset ring-border-color dark:ring-d-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-d-accent" />
                                </LabeledControl>
                            </div>
                        </Accordion>
                        <Accordion title={t('tools.memeGenerator.styleActions')}>
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                                 <LabeledControl label={t('tools.memeGenerator.fontFamily')} htmlFor="font-family">
                                    <select id="font-family" value={fontFamily} onChange={e => set('fontFamily')(e.target.value)} className="w-full p-2 bg-primary dark:bg-d-primary border-none ring-1 ring-inset ring-border-color dark:ring-d-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-d-accent">
                                        {fonts.map(font => <option key={font} value={font}>{font}</option>)}
                                    </select>
                                </LabeledControl>
                                <LabeledControl label={t('tools.memeGenerator.textColor')} htmlFor="text-color">
                                    <input id="text-color" type="color" value={textColor} onChange={e => set('textColor')(e.target.value)} className="w-full h-10 p-1 bg-primary dark:bg-d-primary border-none ring-1 ring-inset ring-border-color dark:ring-d-border-color rounded-lg cursor-pointer" />
                                </LabeledControl>
                                <LabeledControl label={t('tools.memeGenerator.outlineColor')} htmlFor="outline-color">
                                    <input id="outline-color" type="color" value={outlineColor} onChange={e => set('outlineColor')(e.target.value)} className="w-full h-10 p-1 bg-primary dark:bg-d-primary border-none ring-1 ring-inset ring-border-color dark:ring-d-border-color rounded-lg cursor-pointer" />
                                </LabeledControl>
                                <LabeledControl label={t('tools.memeGenerator.fontSize')} htmlFor="font-size" valueDisplay={`${fontSize}px`}>
                                    <input id="font-size" type="range" min="10" max="200" value={fontSize} onChange={e => set('fontSize')(parseInt(e.target.value, 10))} className="w-full accent-accent dark:accent-d-accent" />
                                </LabeledControl>
                                <LabeledControl label={t('tools.memeGenerator.outlineWidth')} htmlFor="outline-width" valueDisplay={`${outlineWidth}px`}>
                                    <input id="outline-width" type="range" min="0" max="20" value={outlineWidth} onChange={e => set('outlineWidth')(parseInt(e.target.value, 10))} className="w-full accent-accent dark:accent-d-accent" />
                                </LabeledControl>
                                <div className="lg:col-span-1"></div>
                                <LabeledControl label={t('tools.memeGenerator.topTextRotation')} htmlFor="top-text-rotation" valueDisplay={`${topTextRotation}°`}>
                                    <input id="top-text-rotation" type="range" min="-45" max="45" value={topTextRotation} onChange={e => set('topTextRotation')(parseInt(e.target.value, 10))} className="w-full accent-accent dark:accent-d-accent" />
                                </LabeledControl>
                                <LabeledControl label={t('tools.memeGenerator.bottomTextRotation')} htmlFor="bottom-text-rotation" valueDisplay={`${bottomTextRotation}°`}>
                                    <input id="bottom-text-rotation" type="range" min="-45" max="45" value={bottomTextRotation} onChange={e => set('bottomTextRotation')(parseInt(e.target.value, 10))} className="w-full accent-accent dark:accent-d-accent" />
                                </LabeledControl>
                             </div>
                        </Accordion>
                    </fieldset>
                </div>
            </div>
        </div>
    );
};

export default MemeGenerator;
