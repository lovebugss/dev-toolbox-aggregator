import React, { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import { useToolState } from '../contexts/ToolStateContext';
import { useToasts } from '../contexts/ToastContext';
import { ToolHeader } from '../components/ui/ToolHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { LabeledControl } from '../components/ui/LabeledControl';
import { WaterDropIcon, PdfFileIcon } from '../components/icons/Icons';

interface WatermarkState {
    type: 'text' | 'image';
    text: string;
    font: StandardFonts;
    fontSize: number;
    color: string;
    opacity: number;
    rotation: number;
    position: 'center' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
    tiled: boolean;
}

const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255
    } : { r: 0, g: 0, b: 0 };
};

// FIX: Cast fontOptions to string[] to resolve unknown type issues in map
const fontOptions = Object.values(StandardFonts) as string[];
const positionOptions: WatermarkState['position'][] = ['center', 'topLeft', 'topRight', 'bottomLeft', 'bottomRight'];

const PdfWatermark: React.FC = () => {
    const { t } = useTranslation();
    const addToast = useToasts();
    const { state, setState } = useToolState<WatermarkState>('pdf-watermark', {
        type: 'text',
        text: 'CONFIDENTIAL',
        font: StandardFonts.HelveticaBold,
        fontSize: 50,
        color: '#ff0000',
        opacity: 0.5,
        rotation: 45,
        position: 'center',
        tiled: false,
    });
    
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const pdfInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);

    const handleApplyWatermark = useCallback(async () => {
        if (!pdfFile) {
            addToast('Please upload a PDF file.', 'error');
            return;
        }
        if (state.type === 'image' && !imageFile) {
            addToast('Please upload a watermark image.', 'error');
            return;
        }
        setIsProcessing(true);
        try {
            const pdfDoc = await PDFDocument.load(await pdfFile.arrayBuffer());
            const pages = pdfDoc.getPages();
            
            let watermarkContent: any;
            if (state.type === 'text') {
                const font = await pdfDoc.embedFont(state.font);
                watermarkContent = {
                    text: state.text,
                    font,
                    size: state.fontSize,
                    color: hexToRgb(state.color),
                    opacity: state.opacity,
                    rotate: degrees(state.rotation),
                };
            } else {
                const imgBytes = await imageFile!.arrayBuffer();
                const image = await (imageFile!.type === 'image/png' ? pdfDoc.embedPng(imgBytes) : pdfDoc.embedJpg(imgBytes));
                watermarkContent = { image, opacity: state.opacity, rotate: degrees(state.rotation) };
            }

            for (const page of pages) {
                const { width, height } = page.getSize();
                const textWidth = state.type === 'text' ? watermarkContent.font.widthOfTextAtSize(state.text, state.fontSize) : watermarkContent.image.width;
                const textHeight = state.type === 'text' ? watermarkContent.font.heightAtSize(state.fontSize) : watermarkContent.image.height;

                const getPosition = (pos: WatermarkState['position']) => {
                    const margin = 50;
                    switch (pos) {
                        case 'topLeft': return { x: margin, y: height - textHeight - margin };
                        case 'topRight': return { x: width - textWidth - margin, y: height - textHeight - margin };
                        case 'bottomLeft': return { x: margin, y: margin };
                        case 'bottomRight': return { x: width - textWidth - margin, y: margin };
                        case 'center':
                        default: return { x: (width - textWidth) / 2, y: (height - textHeight) / 2 };
                    }
                };
                
                if (state.tiled && state.type === 'text') {
                    for (let y = -height; y < height * 2; y += textHeight * 3) {
                        for (let x = -width; x < width * 2; x += textWidth * 1.5) {
                            page.drawText(watermarkContent.text, { ...watermarkContent, x, y });
                        }
                    }
                } else {
                     const { x, y } = getPosition(state.position);
                     if (state.type === 'text') {
                         page.drawText(watermarkContent.text, { ...watermarkContent, x, y });
                     } else {
                         page.drawImage(watermarkContent.image, { ...watermarkContent, x, y });
                     }
                }
            }
            
            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `watermarked_${pdfFile.name}`;
            link.click();

        } catch (err) {
            addToast(`Error: ${(err as Error).message}`, 'error');
        } finally {
            setIsProcessing(false);
        }
    }, [pdfFile, imageFile, state, addToast]);
    
    const set = (key: keyof WatermarkState) => (value: any) => setState(s => ({...s, [key]: value}));

    return (
        <div>
            <ToolHeader title={t('tools.pdfWatermark.pageTitle')} description={t('tools.pdfWatermark.pageDescription')} />
            <input type="file" accept="application/pdf" ref={pdfInputRef} onChange={e => e.target.files && setPdfFile(e.target.files[0])} className="hidden" />
            <input type="file" accept="image/png, image/jpeg" ref={imageInputRef} onChange={e => e.target.files && setImageFile(e.target.files[0])} className="hidden" />

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8">
                {/* PDF & Download */}
                <div className="flex flex-col gap-6">
                    <div onClick={() => pdfInputRef.current?.click()} className="cursor-pointer flex-grow p-6 bg-secondary dark:bg-d-secondary rounded-2xl border-2 border-dashed border-border-color dark:border-d-border-color hover:border-accent dark:hover:border-d-accent transition-colors">
                        {pdfFile ? (
                             <div className="text-center">
                                <PdfFileIcon className="mx-auto h-16 w-16 text-accent dark:text-d-accent" />
                                <p className="mt-2 font-semibold truncate">{pdfFile.name}</p>
                            </div>
                        ) : (
                            <EmptyState Icon={PdfFileIcon} message="Click or drop a PDF here" />
                        )}
                    </div>
                    <button onClick={handleApplyWatermark} disabled={isProcessing || !pdfFile} className="w-full py-3 bg-accent text-white font-bold rounded-lg disabled:opacity-50">{isProcessing ? 'Processing...' : t('tools.pdfWatermark.applyWatermark')}</button>
                </div>
                {/* Settings */}
                <div className="bg-secondary dark:bg-d-secondary p-4 rounded-2xl border border-border-color dark:border-d-border-color space-y-4 overflow-y-auto">
                     <LabeledControl label={t('tools.pdfWatermark.watermarkType')}>
                        <div className="flex bg-primary dark:bg-d-primary p-1 rounded-md">
                            <button onClick={() => set('type')('text')} className={`w-1/2 py-1 text-xs rounded ${state.type === 'text' ? 'bg-secondary dark:bg-d-secondary shadow' : ''}`}>{t('tools.pdfWatermark.text')}</button>
                            <button onClick={() => set('type')('image')} className={`w-1/2 py-1 text-xs rounded ${state.type === 'image' ? 'bg-secondary dark:bg-d-secondary shadow' : ''}`}>{t('tools.pdfWatermark.image')}</button>
                        </div>
                    </LabeledControl>
                    {state.type === 'text' ? (
                        <>
                            <h4 className="font-semibold">{t('tools.pdfWatermark.textOptions')}</h4>
                            <LabeledControl label={t('tools.pdfWatermark.watermarkText')}><input type="text" value={state.text} onChange={e => set('text')(e.target.value)} className="w-full p-2 bg-primary dark:bg-d-primary rounded-md" /></LabeledControl>
                            <LabeledControl label={t('tools.pdfWatermark.font')}><select value={state.font} onChange={e => set('font')(e.target.value as StandardFonts)} className="w-full p-2 bg-primary dark:bg-d-primary rounded-md">{fontOptions.map(f => <option key={f} value={f}>{f}</option>)}</select></LabeledControl>
                            <LabeledControl label={t('tools.pdfWatermark.fontSize')}><input type="number" value={state.fontSize} onChange={e => set('fontSize')(parseInt(e.target.value, 10))} className="w-full p-2 bg-primary dark:bg-d-primary rounded-md" /></LabeledControl>
                            <LabeledControl label={t('tools.pdfWatermark.color')}><input type="color" value={state.color} onChange={e => set('color')(e.target.value)} className="w-full h-10 p-1" /></LabeledControl>
                        </>
                    ) : (
                        <>
                            <h4 className="font-semibold">{t('tools.pdfWatermark.imageOptions')}</h4>
                            <button onClick={() => imageInputRef.current?.click()} className="w-full py-2 bg-primary dark:bg-d-primary rounded text-sm">{imageFile ? imageFile.name : t('tools.pdfWatermark.uploadImage')}</button>
                        </>
                    )}
                    <div className="pt-2 border-t border-border-color dark:border-d-border-color">
                        <h4 className="font-semibold">{t('tools.pdfWatermark.commonOptions')}</h4>
                         <LabeledControl label={t('tools.pdfWatermark.opacity')} valueDisplay={`${Math.round(state.opacity * 100)}%`}><input type="range" min="0" max="1" step="0.05" value={state.opacity} onChange={e => set('opacity')(parseFloat(e.target.value))} className="w-full accent-accent dark:accent-d-accent" /></LabeledControl>
                         <LabeledControl label={t('tools.pdfWatermark.rotation')} valueDisplay={`${state.rotation}°`}><input type="range" min="-180" max="180" value={state.rotation} onChange={e => set('rotation')(parseInt(e.target.value, 10))} className="w-full accent-accent dark:accent-d-accent" /></LabeledControl>
                         <LabeledControl label={t('tools.pdfWatermark.position')}><select value={state.position} onChange={e => set('position')(e.target.value as WatermarkState['position'])} className="w-full p-2 bg-primary dark:bg-d-primary rounded-md">{positionOptions.map(p => <option key={p} value={p}>{t(`tools.pdfWatermark.${p}`)}</option>)}</select></LabeledControl>
                         {state.type === 'text' && <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={state.tiled} onChange={e => set('tiled')(e.target.checked)} />{t('tools.pdfWatermark.tiled')}</label>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PdfWatermark;