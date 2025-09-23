import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

const LabeledInput: React.FC<{ label: string; helpText?: string; children: React.ReactNode }> = ({ label, helpText, children }) => (
    <div>
        <label className="block text-sm font-medium text-text-secondary dark:text-d-text-secondary mb-1">{label}</label>
        {children}
        {helpText && <p className="text-xs text-text-secondary dark:text-d-text-secondary mt-1">{helpText}</p>}
    </div>
);

const VideoToGif: React.FC = () => {
    const { t } = useTranslation();
    const [ffmpeg, setFfmpeg] = useState<FFmpeg | null>(null);
    const [isLoadingFfmpeg, setIsLoadingFfmpeg] = useState(true);
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoSrc, setVideoSrc] = useState<string | null>(null);
    const [gifSrc, setGifSrc] = useState<string | null>(null);
    const [isConverting, setIsConverting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    // Conversion Options
    const [startTime, setStartTime] = useState('0');
    const [endTime, setEndTime] = useState('5');
    const [fps, setFps] = useState('15');
    const [width, setWidth] = useState('480');

    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const loadFfmpeg = async () => {
            const ffmpegInstance = new FFmpeg();
            ffmpegInstance.on('log', ({ message }) => {
                console.log(message);
            });
            ffmpegInstance.on('progress', ({ progress }) => {
                setProgress(Math.round(progress * 100));
            });
            try {
                // Using esm.sh for wasm files with correct headers
                const baseURL = 'https://esm.sh/@ffmpeg/core@0.12.10/dist/esm';
                await ffmpegInstance.load({
                    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
                    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
                });
                setFfmpeg(ffmpegInstance);
            } catch (err) {
                console.error(err);
                setError('Failed to load FFmpeg library.');
            } finally {
                setIsLoadingFfmpeg(false);
            }
        };
        loadFfmpeg();
    }, []);

    const processFile = (file: File) => {
        if (!file.type.startsWith('video/')) {
            setError(t('tools.videoToGif.errorInvalidVideo'));
            return;
        }
        setError(null);
        setVideoFile(file);
        const url = URL.createObjectURL(file);
        setVideoSrc(url);
        setGifSrc(null);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => e.target.files?.[0] && processFile(e.target.files[0]);
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.files?.[0] && processFile(e.dataTransfer.files[0]);
    };
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();
    
    const handleConvert = async () => {
        if (!ffmpeg || !videoFile) return;
        setIsConverting(true);
        setProgress(0);
        setGifSrc(null);
        setError(null);

        try {
            await ffmpeg.writeFile(videoFile.name, await fetchFile(videoFile));

            const command = [
                '-i', videoFile.name,
                '-ss', startTime,
                '-to', endTime,
                '-vf', `fps=${fps},scale=${width}:-1:flags=lanczos`,
                'output.gif'
            ];
            
            await ffmpeg.exec(command);
            
            const data = await ffmpeg.readFile('output.gif');
            const url = URL.createObjectURL(new Blob([(data as Uint8Array).buffer], { type: 'image/gif' }));
            setGifSrc(url);

        } catch (err) {
            console.error(err);
            setError(t('tools.videoToGif.errorConversion'));
        } finally {
            setIsConverting(false);
        }
    };

    const inputClass = "w-full p-2 bg-primary dark:bg-d-primary border border-border-color dark:border-d-border-color rounded-md text-text-primary dark:text-d-text-primary focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-d-accent";
    
    return (
        <div>
            <h2 className="text-2xl font-bold text-text-primary dark:text-d-text-primary mb-4">{t('tools.videoToGif.pageTitle')}</h2>
            <p className="text-text-secondary dark:text-d-text-secondary mb-6">{t('tools.videoToGif.pageDescription')}</p>

            {isLoadingFfmpeg ? (
                 <div className="text-center p-8 bg-secondary dark:bg-d-secondary rounded-lg border border-border-color dark:border-d-border-color">
                    <p>{t('tools.videoToGif.ffmpegLoading')}</p>
                </div>
            ) : !videoFile ? (
                 <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border-color dark:border-d-border-color rounded-lg h-60 bg-secondary dark:bg-d-secondary hover:border-accent dark:hover:border-d-accent transition-colors" onDrop={handleDrop} onDragOver={handleDragOver}>
                    <input type="file" accept="video/*" onChange={handleFileChange} className="hidden" ref={fileInputRef}/>
                    <div className="text-center">
                        <svg className="mx-auto h-12 w-12 text-text-secondary dark:text-d-text-secondary" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        <p className="mt-2 text-sm text-text-secondary dark:text-d-text-secondary"><button onClick={() => fileInputRef.current?.click()} className="font-medium text-accent dark:text-d-accent hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none" title={t('common.tooltips.uploadVideo')}>{t('tools.videoToGif.uploadButton')}</button>{t('tools.videoToGif.dropzone')}</p>
                        <p className="text-xs text-text-secondary dark:text-d-text-secondary">{t('tools.videoToGif.fileTypes')}</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-4">
                        <video ref={videoRef} src={videoSrc} controls className="w-full rounded-lg bg-black border border-border-color dark:border-d-border-color"></video>
                        <div className="p-4 bg-secondary dark:bg-d-secondary border border-border-color dark:border-d-border-color rounded-lg">
                            <h3 className="text-lg font-semibold mb-4">{t('tools.videoToGif.options')}</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <LabeledInput label={t('tools.videoToGif.startTime')}>
                                    <input type="number" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={inputClass} />
                                </LabeledInput>
                                <LabeledInput label={t('tools.videoToGif.endTime')}>
                                    <input type="number" value={endTime} onChange={(e) => setEndTime(e.target.value)} className={inputClass} />
                                </LabeledInput>
                                <LabeledInput label={t('tools.videoToGif.fps')}>
                                    <input type="number" value={fps} onChange={(e) => setFps(e.target.value)} className={inputClass} />
                                </LabeledInput>
                                <LabeledInput label={t('tools.videoToGif.width')} helpText={t('tools.videoToGif.widthHelp')}>
                                    <input type="number" value={width} onChange={(e) => setWidth(e.target.value)} className={inputClass} />
                                </LabeledInput>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <button 
                            onClick={handleConvert} 
                            disabled={isConverting}
                            className="w-full px-6 py-3 bg-accent dark:bg-d-accent text-white dark:text-d-primary font-semibold rounded-lg hover:bg-blue-700 dark:hover:bg-blue-500 transition-colors duration-200 shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {isConverting ? t('tools.videoToGif.converting') : t('tools.videoToGif.convertButton')}
                        </button>

                        {isConverting && (
                            <div className="w-full bg-border-color dark:bg-d-border-color rounded-full h-2.5">
                                <div className="bg-accent dark:bg-d-accent h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                                <p className="text-center text-sm mt-1">{t('tools.videoToGif.conversionProgress', { progress: progress })}</p>
                            </div>
                        )}
                        
                        {gifSrc && (
                             <div className="p-4 bg-secondary dark:bg-d-secondary border border-border-color dark:border-d-border-color rounded-lg space-y-4">
                                <p className="text-center font-semibold">{t('tools.videoToGif.conversionComplete')}</p>
                                <img src={gifSrc} alt="Generated GIF" className="w-full rounded-md border border-border-color dark:border-d-border-color" />
                                <a 
                                    href={gifSrc} 
                                    download={`${videoFile.name.split('.')[0]}.gif`}
                                    className="block w-full text-center px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
                                >
                                    {t('tools.videoToGif.downloadButton')}
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            )}
            {error && <p className="text-center mt-4 text-red-500">{error}</p>}
        </div>
    );
};

export default VideoToGif;