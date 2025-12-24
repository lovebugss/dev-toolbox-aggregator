import React, { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useToolState } from '../contexts/ToolStateContext';
import { useToasts } from '../contexts/ToastContext';
import { ToolHeader } from '../components/ui/ToolHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { LabeledControl } from '../components/ui/LabeledControl';
import { TypeIcon, ImageIcon } from '../components/icons/Icons';

// State and Types
interface AsciiArtState {
    outputWidth: number;
    characterSet: string;
    isInverted: boolean;
    useColor: boolean;
}

const CHARACTER_SETS = {
    standard: `@%#*+=-:. `,
    simple: `Wwli:,.`,
    blocks: `█▓▒░ `,
    binary: `10`,
};

const AsciiArtGenerator: React.FC = () => {
    const { t } = useTranslation();
    const addToast = useToasts();
    const { state, setState } = useToolState<AsciiArtState>('ascii-art-generator', {
        outputWidth: 80,
        characterSet: CHARACTER_SETS.standard,
        isInverted: false,
        useColor: false,
    });
    const { outputWidth, characterSet, isInverted, useColor } = state;
    
    const [sourceImage, setSourceImage] = useState<string | null>(null);
    // FIX: Replaced JSX.Element with React.ReactNode to resolve namespace error.
    const [asciiArt, setAsciiArt] = useState<string | React.ReactNode>('');
    const [isProcessing, setIsProcessing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // File handling
    const processFile = (file: File) => {
        if (!file.type.startsWith('image/')) {
            addToast(t('tools.asciiArtGenerator.errorInvalidImage'), 'error');
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => setSourceImage(e.target?.result as string);
        reader.readAsDataURL(file);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => e.target.files?.[0] && processFile(e.target.files[0]);
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.files?.[0] && processFile(e.dataTransfer.files[0]);
    };
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();

    // ASCII generation logic
    const generateAsciiArt = useCallback(() => {
        if (!sourceImage) return;

        setIsProcessing(true);
        setAsciiArt('');

        const img = new Image();
        img.onload = () => {
            const canvas = canvasRef.current;
            if (!canvas) {
                setIsProcessing(false);
                return;
            }
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) {
                setIsProcessing(false);
                return;
            }

            const aspectRatio = img.height / img.width;
            // The font is roughly twice as tall as it is wide, so we adjust height
            const outputHeight = Math.round(outputWidth * aspectRatio * 0.5);

            canvas.width = outputWidth;
            canvas.height = outputHeight;

            ctx.drawImage(img, 0, 0, outputWidth, outputHeight);
            const imageData = ctx.getImageData(0, 0, outputWidth, outputHeight);
            const data = imageData.data;
            const chars = characterSet.split('');

            // FIX: Replaced JSX.Element with React.ReactNode to resolve namespace error.
            let result: string | React.ReactNode[] = useColor ? [] : '';
            
            for (let y = 0; y < outputHeight; y++) {
                for (let x = 0; x < outputWidth; x++) {
                    const i = (y * outputWidth + x) * 4;
                    const r = data[i];
                    const g = data[i+1];
                    const b = data[i+2];

                    const brightness = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
                    const finalBrightness = isInverted ? 1 - brightness : brightness;
                    const charIndex = Math.floor(finalBrightness * (chars.length - 1));
                    const char = chars[charIndex];

                    if (useColor) {
                        // FIX: Replaced JSX.Element with React.ReactNode to resolve namespace error.
                        (result as React.ReactNode[]).push(
                            <span key={`${y}-${x}`} style={{ color: `rgb(${r},${g},${b})` }}>
                                {char}
                            </span>
                        );
                    } else {
                        result += char;
                    }
                }
                if (y < outputHeight - 1) {
                    if (useColor) {
                        // FIX: Replaced JSX.Element with React.ReactNode to resolve namespace error.
                        (result as React.ReactNode[]).push('\n');
                    } else {
                        result += '\n';
                    }
                }
            }
            
            setAsciiArt(useColor ? <>{result}</> : result as string);
            setIsProcessing(false);
        };
        img.src = sourceImage;
    }, [sourceImage, outputWidth, characterSet, isInverted, useColor]);
    
    const handleCopy = () => {
        let textToCopy = '';
        if (typeof asciiArt === 'string') {
            textToCopy = asciiArt;
        } else {
            // Need to extract text content from JSX for copying
            const pre = document.getElementById('ascii-output-pre');
            if (pre) textToCopy = pre.innerText;
        }

        if (!textToCopy) return;
        navigator.clipboard.writeText(textToCopy).then(() => {
            addToast(t('common.toast.copiedSuccess'), 'success');
        }, () => {
            addToast(t('common.toast.copiedFailed'), 'error');
        });
    };

    // UI
    return (
        <div className="flex flex-col h-full">
            <ToolHeader
                title={t('tools.asciiArtGenerator.pageTitle')}
                description={t('tools.asciiArtGenerator.pageDescription')}
            />
            <canvas ref={canvasRef} className="hidden" />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-grow min-h-0">
                {/* Left Panel: Input & Controls */}
                <div className="flex flex-col gap-6">
                    <div
                        className="flex-grow flex flex-col items-center justify-center p-6 border-2 border-dashed border-border-color dark:border-d-border-color rounded-2xl bg-secondary dark:bg-d-secondary hover:border-accent dark:hover:border-d-accent transition-colors min-h-[200px]"
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                    >
                        <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" ref={fileInputRef} />
                        {sourceImage ? (
                            <img src={sourceImage} alt="Preview" className="max-h-full max-w-full rounded-lg object-contain" />
                        ) : (
                             <div className="text-center cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                <ImageIcon className="mx-auto h-12 w-12 text-text-secondary dark:text-d-text-secondary" />
                                <p className="mt-2 text-sm text-text-secondary dark:text-d-text-secondary">
                                    <span className="font-semibold text-accent dark:text-d-accent">{t('common.tooltips.uploadImage')}</span>
                                    {' '}{t('tools.base64ImageConverter.dropzone')}
                                </p>
                            </div>
                        )}
                    </div>
                    
                    <div className="bg-secondary dark:bg-d-secondary p-6 rounded-2xl border border-border-color dark:border-d-border-color">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                            <LabeledControl label={t('tools.asciiArtGenerator.characterSet')}>
                                <select
                                    value={characterSet}
                                    onChange={e => setState(s => ({...s, characterSet: e.target.value}))}
                                    className="w-full p-2 bg-primary dark:bg-d-primary border-none ring-1 ring-inset ring-border-color dark:ring-d-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-d-accent"
                                >
                                    {Object.entries(CHARACTER_SETS).map(([key, value]) => <option key={key} value={value}>{key}</option>)}
                                </select>
                            </LabeledControl>
                            <LabeledControl label={t('tools.asciiArtGenerator.outputWidth')} valueDisplay={`${outputWidth} chars`}>
                                <input type="range" min="40" max="300" value={outputWidth} onChange={e => setState(s => ({...s, outputWidth: parseInt(e.target.value, 10)}))} className="w-full accent-accent dark:accent-d-accent" />
                            </LabeledControl>
                            <div className="flex items-center justify-between sm:col-span-2">
                                <label className="text-sm font-medium">{t('tools.asciiArtGenerator.options')}</label>
                                <div className="flex gap-4">
                                     <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={isInverted} onChange={() => setState(s => ({...s, isInverted: !s.isInverted}))} /> {t('tools.asciiArtGenerator.invert')}</label>
                                     <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={useColor} onChange={() => setState(s => ({...s, useColor: !s.useColor}))} /> {t('tools.asciiArtGenerator.color')}</label>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={generateAsciiArt}
                            disabled={!sourceImage || isProcessing}
                            className="w-full px-6 py-3 bg-accent dark:bg-d-accent text-white dark:text-d-primary font-semibold rounded-lg hover:opacity-90 transition-opacity duration-200 shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {isProcessing ? t('tools.asciiArtGenerator.generating') : t('tools.asciiArtGenerator.generate')}
                        </button>
                    </div>
                </div>

                {/* Right Panel: Output */}
                <div className="flex flex-col">
                     <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold text-text-secondary dark:text-d-text-secondary">{t('tools.asciiArtGenerator.output')}</h3>
                        {asciiArt && (
                            <button
                                onClick={handleCopy}
                                className="px-3 py-1 text-xs font-medium bg-border-color dark:bg-d-border-color rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                            >
                                {t('common.copy')}
                            </button>
                        )}
                    </div>
                    <div className="flex-grow p-4 bg-secondary dark:bg-d-secondary rounded-lg border border-border-color dark:border-d-border-color overflow-auto">
                        {isProcessing ? (
                             <div className="flex items-center justify-center h-full text-text-secondary dark:text-d-text-secondary">{t('tools.asciiArtGenerator.generating')}...</div>
                        ) : asciiArt ? (
                             <pre id="ascii-output-pre" className="font-mono text-[5px] leading-tight break-all">
                                 {asciiArt}
                             </pre>
                        ) : (
                             <EmptyState Icon={TypeIcon} message={t('tools.asciiArtGenerator.outputPlaceholder')} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AsciiArtGenerator;
