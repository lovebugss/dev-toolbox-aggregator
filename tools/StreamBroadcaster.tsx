import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import * as fabric from 'fabric';
import { parseGIF, decompressFrames } from 'gifuct-js';
import { useToolState } from '../contexts/ToolStateContext';
import { useToasts } from '../contexts/ToastContext';
import { ToolHeader } from '../components/ui/ToolHeader';
import { Accordion } from '../components/ui/Accordion';
import { LabeledControl } from '../components/ui/LabeledControl';

type StreamStatus = 'offline' | 'connecting' | 'live' | 'error';

interface BroadcasterState {
    whipUrl: string;
    bearerToken: string;
    showTimestamp: boolean;
    micVolume: number;
    musicVolume: number;
}

const StreamBroadcaster: React.FC = () => {
    const { t } = useTranslation();
    const addToast = useToasts();
    const { state, setState } = useToolState<BroadcasterState>('stream-broadcaster', {
        whipUrl: '',
        bearerToken: '',
        showTimestamp: true,
        micVolume: 1,
        musicVolume: 0.2,
    });
    const { whipUrl, bearerToken, showTimestamp, micVolume, musicVolume } = state;

    const [streamStatus, setStreamStatus] = useState<StreamStatus>('offline');
    const [permissionsGranted, setPermissionsGranted] = useState(false);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
    const videoRef = useRef<HTMLVideoElement>(document.createElement('video'));
    const musicRef = useRef<HTMLAudioElement | null>(null);
    const gifRef = useRef<{ frames: any[], currentIndex: number, image: fabric.Image | null }>({ frames: [], currentIndex: 0, image: null });
    const timestampRef = useRef<fabric.IText | null>(null);
    const animationFrameId = useRef<number>(0);
    
    const peerConnection = useRef<RTCPeerConnection | null>(null);
    const localStream = useRef<MediaStream | null>(null);
    const audioContext = useRef<AudioContext | null>(null);

    const cleanup = useCallback(() => {
        // Stop animation loop
        if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        
        // Stop streams
        localStream.current?.getTracks().forEach(track => track.stop());
        localStream.current = null;
        
        // Close peer connection
        peerConnection.current?.close();
        peerConnection.current = null;

        // Close audio context
        audioContext.current?.close();
        audioContext.current = null;

        // Reset fabric canvas
        const canvas = fabricCanvasRef.current;
        if(canvas) {
            canvas.getObjects().forEach(obj => {
                if((obj as any).isStreamElement) canvas.remove(obj);
            });
            gifRef.current.image = null;
            timestampRef.current = null;
            canvas.renderAll();
        }
        
        // Stop music
        if(musicRef.current) {
            musicRef.current.pause();
            musicRef.current.src = '';
        }

        setStreamStatus('offline');
    }, []);

    const setupMedia = async () => {
        try {
            localStream.current = await navigator.mediaDevices.getUserMedia({
                video: { width: 1280, height: 720 },
                audio: true,
            });
            videoRef.current.srcObject = localStream.current;
            videoRef.current.muted = true;
            videoRef.current.play();
            return true;
        } catch (err) {
            addToast('Failed to get camera/microphone permissions', 'error');
            setStreamStatus('error');
            return false;
        }
    };
    
    const handleStartStreaming = async () => {
        if (!whipUrl) {
            addToast(t('tools.streamBroadcaster.whipUrlRequired'), 'error');
            return;
        }
        if (!whipUrl.startsWith('http://') && !whipUrl.startsWith('https://')) {
            addToast(t('tools.streamBroadcaster.invalidWhipUrl'), 'error');
            return;
        }
        if (!permissionsGranted) {
            const granted = await setupMedia();
            if (!granted) return;
            setPermissionsGranted(true);
        } else if (!localStream.current) {
            const granted = await setupMedia();
            if(!granted) return;
        }

        setStreamStatus('connecting');

        const canvas = fabricCanvasRef.current;
        if (!canvas) {
            setStreamStatus('error');
            return;
        }
        
        // --- 1. SETUP VIDEO ---
        const videoStream = (canvas.getElement() as HTMLCanvasElement).captureStream(30);

        // --- 2. SETUP AUDIO ---
        if (!audioContext.current) audioContext.current = new AudioContext();
        const audioCtx = audioContext.current;
        const destination = audioCtx.createMediaStreamDestination();
        
        // Mic audio
        const micSource = audioCtx.createMediaStreamSource(localStream.current!);
        const micGain = audioCtx.createGain();
        micGain.gain.value = micVolume;
        micSource.connect(micGain).connect(destination);

        // Music audio
        if (musicRef.current) {
            const musicSource = audioCtx.createMediaElementSource(musicRef.current);
            const musicGain = audioCtx.createGain();
            musicGain.gain.value = musicVolume;
            musicSource.connect(musicGain).connect(destination);
            musicRef.current.play();
        }
        
        const audioStream = destination.stream;

        // --- 3. COMBINE STREAMS & SETUP PEER CONNECTION ---
        const combinedStream = new MediaStream([
            videoStream.getVideoTracks()[0],
            audioStream.getAudioTracks()[0]
        ]);
        
        peerConnection.current = new RTCPeerConnection();
        combinedStream.getTracks().forEach(track => peerConnection.current?.addTrack(track, combinedStream));
        
        const offer = await peerConnection.current.createOffer();
        await peerConnection.current.setLocalDescription(offer);
        
        try {
            const headers: HeadersInit = { 'Content-Type': 'application/sdp' };
            if (bearerToken) {
                headers['Authorization'] = `Bearer ${bearerToken}`;
            }

            const response = await fetch(whipUrl, {
                method: 'POST',
                headers: headers,
                body: peerConnection.current.localDescription?.sdp,
            });
            if (!response.ok) throw new Error(`Server responded with ${response.status}`);
            
            const answer = await response.text();
            await peerConnection.current.setRemoteDescription({ type: 'answer', sdp: answer });
            setStreamStatus('live');
        } catch (error) {
            addToast(`Failed to connect to WHIP endpoint: ${(error as Error).message}`, 'error');
            cleanup();
        }
    };

    const handleStopStreaming = () => {
        cleanup();
    };

    const setMicVolume = (v: number) => setState(s => ({...s, micVolume: v}));
    const setMusicVolume = (v: number) => setState(s => ({...s, musicVolume: v}));

    // Init Fabric.js
    useEffect(() => {
        const canvas = new fabric.Canvas(canvasRef.current, {
            width: 1280, height: 720, backgroundColor: '#222'
        });
        fabricCanvasRef.current = canvas;
        // FIX: The cleanup function for useEffect should not return a value. `canvas.dispose()` returns the canvas instance. Wrapping it in braces `{}` ensures `undefined` is returned, satisfying the EffectCallback type.
        return () => {
            canvas.dispose();
        };
    }, []);

    // Animation Loop
    useEffect(() => {
        const canvas = fabricCanvasRef.current;
        if (streamStatus !== 'offline' && canvas) {
            const render = () => {
                // Update video texture
                canvas.renderAll();

                // Update GIF frame
                const gif = gifRef.current;
                if (gif.image && gif.frames.length > 0) {
                    gif.currentIndex = (gif.currentIndex + 1) % gif.frames.length;
                    const frame = gif.frames[gif.currentIndex];
                    const frameCanvas = document.createElement('canvas');
                    frameCanvas.width = frame.dims.width;
                    frameCanvas.height = frame.dims.height;
                    const ctx = frameCanvas.getContext('2d')!;
                    const imageData = ctx.createImageData(frame.dims.width, frame.dims.height);
                    imageData.data.set(frame.patch);
                    ctx.putImageData(imageData, 0, 0);
                    gif.image.setElement(frameCanvas);
                }

                // Update timestamp
                if (timestampRef.current && timestampRef.current.visible) {
                    timestampRef.current.set('text', new Date().toLocaleTimeString());
                }
                
                animationFrameId.current = requestAnimationFrame(render);
            };
            render();
        } else {
            cancelAnimationFrame(animationFrameId.current);
        }
        return () => cancelAnimationFrame(animationFrameId.current);
    }, [streamStatus]);

    // Permissions check
    useEffect(() => {
        navigator.permissions.query({ name: 'camera' as PermissionName }).then(res => {
            if (res.state === 'granted') {
                 navigator.permissions.query({ name: 'microphone' as PermissionName }).then(micRes => {
                    if (micRes.state === 'granted') {
                        setPermissionsGranted(true);
                        setupMedia();
                    }
                 });
            }
        });
    }, []);

    const handleFileChange = (type: 'gif' | 'music') => (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (type === 'gif') {
            const reader = new FileReader();
            reader.onload = (event) => {
                const buffer = event.target?.result as ArrayBuffer;
                const gifData = parseGIF(buffer);
                const frames = decompressFrames(gifData, true);
                
                const canvas = fabricCanvasRef.current;
                if (canvas) {
                    if (gifRef.current.image) canvas.remove(gifRef.current.image);
                    const firstFrame = frames[0];
                    const frameCanvas = document.createElement('canvas');
                    frameCanvas.width = firstFrame.dims.width;
                    frameCanvas.height = firstFrame.dims.height;
                    const ctx = frameCanvas.getContext('2d')!;
                    const imageData = ctx.createImageData(firstFrame.dims.width, firstFrame.dims.height);
                    imageData.data.set(firstFrame.patch);
                    ctx.putImageData(imageData, 0, 0);

                    const img = new fabric.Image(frameCanvas, { left: 100, top: 100, isStreamElement: true } as any);
                    canvas.add(img);
                    gifRef.current = { frames, currentIndex: 0, image: img };
                }
            };
            reader.readAsArrayBuffer(file);
        } else if (type === 'music') {
            if (!musicRef.current) musicRef.current = new Audio();
            musicRef.current.src = URL.createObjectURL(file);
            musicRef.current.loop = true;
        }
    };
    
    // Toggle timestamp visibility
    useEffect(() => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        if (showTimestamp && !timestampRef.current) {
            const text = new fabric.IText(new Date().toLocaleTimeString(), {
                left: canvas.width! - 20, top: canvas.height! - 20,
                originX: 'right', originY: 'bottom',
                fontSize: 30, fill: 'white',
                fontFamily: 'monospace',
                isStreamElement: true,
            } as any);
            canvas.add(text);
            timestampRef.current = text;
        } else if (timestampRef.current) {
            timestampRef.current.set('visible', showTimestamp);
        }
        canvas.renderAll();

    }, [showTimestamp]);

    return (
        <div>
            <ToolHeader title={t('tools.streamBroadcaster.pageTitle')} description={t('tools.streamBroadcaster.pageDescription')} />
            <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-6">
                {/* Controls */}
                <div className="space-y-4">
                    <Accordion title={t('tools.streamBroadcaster.connection')} defaultOpen>
                        <LabeledControl label={t('tools.streamBroadcaster.whipUrl')}>
                            <input type="text" value={whipUrl} onChange={e => setState(s => ({...s, whipUrl: e.target.value}))} placeholder={t('tools.streamBroadcaster.whipUrlPlaceholder') as string} className="w-full p-2 bg-primary dark:bg-d-primary rounded" />
                        </LabeledControl>
                        <LabeledControl label={t('tools.streamBroadcaster.bearerToken')}>
                            <input type="password" value={bearerToken} onChange={e => setState(s => ({...s, bearerToken: e.target.value}))} placeholder={t('tools.streamBroadcaster.bearerTokenPlaceholder') as string} className="w-full p-2 bg-primary dark:bg-d-primary rounded" />
                        </LabeledControl>
                        <div className="flex gap-2">
                             <button onClick={handleStartStreaming} disabled={streamStatus !== 'offline' && streamStatus !== 'error'} className="w-full py-2 bg-green-600 text-white rounded disabled:opacity-50">{t('tools.streamBroadcaster.startStreaming')}</button>
                             <button onClick={handleStopStreaming} disabled={streamStatus === 'offline' || streamStatus === 'error'} className="w-full py-2 bg-red-600 text-white rounded disabled:opacity-50">{t('tools.streamBroadcaster.stopStreaming')}</button>
                        </div>
                    </Accordion>
                     <Accordion title={t('tools.streamBroadcaster.scene')} defaultOpen>
                         <input type="file" accept="image/gif" onChange={handleFileChange('gif')} className="hidden" id="gif-upload" />
                         <button onClick={() => document.getElementById('gif-upload')?.click()} className="w-full py-2 bg-primary dark:bg-d-primary rounded text-sm">{t('tools.streamBroadcaster.uploadGif')}</button>
                         <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={showTimestamp} onChange={e => setState(s => ({...s, showTimestamp: e.target.checked}))} />{t('tools.streamBroadcaster.showTimestamp')}</label>
                     </Accordion>
                      <Accordion title={t('tools.streamBroadcaster.audio')} defaultOpen>
                         <input type="file" accept="audio/*" onChange={handleFileChange('music')} className="hidden" id="music-upload" />
                         <button onClick={() => document.getElementById('music-upload')?.click()} className="w-full py-2 bg-primary dark:bg-d-primary rounded text-sm">{t('tools.streamBroadcaster.uploadMusic')}</button>
                         <LabeledControl label={t('tools.streamBroadcaster.micVolume')}><input type="range" min="0" max="1" step="0.05" value={micVolume} onChange={e => setMicVolume(parseFloat(e.target.value))} className="w-full" /></LabeledControl>
                         <LabeledControl label={t('tools.streamBroadcaster.musicVolume')}><input type="range" min="0" max="1" step="0.05" value={musicVolume} onChange={e => setMusicVolume(parseFloat(e.target.value))} className="w-full" /></LabeledControl>
                     </Accordion>
                </div>

                {/* Preview */}
                <div className="bg-black rounded-lg aspect-video flex items-center justify-center relative overflow-hidden border-2 border-border-color dark:border-d-border-color">
                    <canvas ref={canvasRef} />
                    {!permissionsGranted && streamStatus !== 'connecting' &&
                        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white text-center p-4">
                            <p className="mb-4">{t('tools.streamBroadcaster.permissionsNeeded')}</p>
                            <button onClick={() => { setPermissionsGranted(true); setupMedia(); }} className="px-4 py-2 bg-accent rounded">{t('tools.streamBroadcaster.allowPermissions')}</button>
                        </div>
                    }
                    <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1 rounded-md text-sm font-bold text-white bg-black/50">
                        {streamStatus === 'live' && <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />}
                        {streamStatus === 'offline' && <div className="w-3 h-3 bg-gray-500 rounded-full" />}
                        {streamStatus === 'connecting' && <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" />}
                        {streamStatus === 'error' && <div className="w-3 h-3 bg-red-500 rounded-full" />}
                        <span>{t(`tools.streamBroadcaster.${streamStatus}`)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StreamBroadcaster;