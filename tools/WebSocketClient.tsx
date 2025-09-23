import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useToolState } from '../contexts/ToolStateContext';
import { ToolHeader } from '../components/ui/ToolHeader';
import { LabeledControl } from '../components/ui/LabeledControl';
import { ArrowRightIcon } from '../components/icons/Icons';

interface Message {
    type: 'in' | 'out' | 'system' | 'error';
    content: string;
    timestamp: string;
}

interface WebSocketClientState {
    url: string;
    messageInput: string;
}

const StatusIndicator: React.FC<{ status: 'disconnected' | 'connecting' | 'connected' | 'error' }> = ({ status }) => {
    const { t } = useTranslation();
    const statusConfig = {
        disconnected: { text: t('tools.websocketClient.statusDisconnected'), color: 'bg-gray-500' },
        connecting: { text: t('tools.websocketClient.statusConnecting'), color: 'bg-yellow-500 animate-pulse' },
        connected: { text: t('tools.websocketClient.statusConnected'), color: 'bg-green-500' },
        error: { text: t('tools.websocketClient.statusError'), color: 'bg-red-500' },
    };

    return (
        <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${statusConfig[status].color}`}></div>
            <span className="text-sm font-medium">{statusConfig[status].text}</span>
        </div>
    );
};

const WebSocketClient: React.FC = () => {
    const { t } = useTranslation();
    const { state, setState } = useToolState<WebSocketClientState>('websocket-client', {
        url: 'wss://echo.websocket.events',
        messageInput: '',
    });
    const { url, messageInput } = state;

    const [messages, setMessages] = useState<Message[]>([]);
    const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');

    const ws = useRef<WebSocket | null>(null);
    const logRef = useRef<HTMLDivElement>(null);

    const addMessage = useCallback((type: Message['type'], content: string) => {
        const timestamp = new Date().toLocaleTimeString();
        setMessages(prev => [...prev, { type, content, timestamp }]);
    }, []);

    useEffect(() => {
        if (logRef.current) {
            logRef.current.scrollTop = logRef.current.scrollHeight;
        }
    }, [messages]);
    
    // Cleanup on component unmount
    useEffect(() => {
        return () => {
            ws.current?.close();
        };
    }, []);

    const handleConnect = useCallback(() => {
        if (ws.current || connectionStatus === 'connecting') return;

        try {
            setConnectionStatus('connecting');
            addMessage('system', `${t('tools.websocketClient.statusConnecting')} to ${url}...`);
            const websocket = new WebSocket(url);

            websocket.onopen = () => {
                setConnectionStatus('connected');
                addMessage('system', t('tools.websocketClient.statusConnected'));
                ws.current = websocket;
            };

            websocket.onmessage = (event) => {
                addMessage('in', event.data);
            };

            websocket.onclose = (event) => {
                setConnectionStatus('disconnected');
                addMessage('system', `${t('tools.websocketClient.statusDisconnected')}. Code: ${event.code}`);
                ws.current = null;
            };

            websocket.onerror = () => {
                setConnectionStatus('error');
                addMessage('error', t('tools.websocketClient.statusError'));
                ws.current = null;
            };
        } catch (error) {
            setConnectionStatus('error');
            addMessage('error', `Failed to connect: ${(error as Error).message}`);
        }
    }, [url, addMessage, t, connectionStatus]);

    const handleDisconnect = () => {
        ws.current?.close();
    };

    const handleSend = () => {
        if (ws.current?.readyState === WebSocket.OPEN && messageInput) {
            ws.current.send(messageInput);
            addMessage('out', messageInput);
            setState(s => ({ ...s, messageInput: '' }));
        }
    };

    const isConnected = connectionStatus === 'connected';
    const isDisconnected = connectionStatus === 'disconnected' || connectionStatus === 'error';

    const messageTypeStyles = {
        in: { color: 'text-green-500 dark:text-green-400', label: t('tools.websocketClient.received') },
        out: { color: 'text-blue-500 dark:text-blue-400', label: t('tools.websocketClient.sent') },
        system: { color: 'text-purple-500 dark:text-purple-400', label: t('tools.websocketClient.system') },
        error: { color: 'text-red-500 dark:text-red-400', label: t('tools.websocketClient.error') },
    };

    return (
        <div className="flex flex-col h-full">
            <ToolHeader title={t('tools.websocketClient.pageTitle')} description={t('tools.websocketClient.pageDescription')} />

            <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
                {/* Left Panel: Controls */}
                <div className="lg:col-span-1 flex flex-col gap-6">
                    <div className="p-4 bg-secondary dark:bg-d-secondary rounded-lg border border-border-color dark:border-d-border-color">
                        <LabeledControl label={t('tools.websocketClient.urlLabel')}>
                            <input
                                type="text"
                                value={url}
                                onChange={e => setState(s => ({ ...s, url: e.target.value }))}
                                placeholder={t('tools.websocketClient.urlPlaceholder') as string}
                                disabled={!isDisconnected}
                                className="w-full p-2 bg-primary dark:bg-d-primary rounded-md disabled:opacity-50"
                            />
                        </LabeledControl>
                        <div className="flex gap-2 mt-4">
                            <button
                                onClick={handleConnect}
                                disabled={!isDisconnected}
                                className="flex-1 px-4 py-2 bg-accent text-white rounded-md disabled:opacity-50"
                            >
                                {t('tools.websocketClient.connect')}
                            </button>
                            <button
                                onClick={handleDisconnect}
                                disabled={isDisconnected}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md disabled:opacity-50"
                            >
                                {t('tools.websocketClient.disconnect')}
                            </button>
                        </div>
                    </div>
                     <div className="p-4 bg-secondary dark:bg-d-secondary rounded-lg border border-border-color dark:border-d-border-color">
                        <h3 className="font-semibold mb-2">{t('tools.websocketClient.status')}</h3>
                        <StatusIndicator status={connectionStatus} />
                    </div>
                </div>

                {/* Right Panel: Log & Input */}
                <div className="lg:col-span-2 flex flex-col bg-secondary dark:bg-d-secondary rounded-lg border border-border-color dark:border-d-border-color min-h-0">
                    <div className="flex justify-between items-center p-3 border-b border-border-color dark:border-d-border-color">
                        <h3 className="font-semibold">{t('tools.websocketClient.messageLog')}</h3>
                        <button onClick={() => setMessages([])} className="text-xs px-2 py-1 bg-primary dark:bg-d-primary rounded-md">
                            {t('tools.websocketClient.clearLog')}
                        </button>
                    </div>
                    <div ref={logRef} className="flex-grow p-3 overflow-y-auto font-mono text-sm space-y-2">
                        {messages.map((msg, index) => (
                            <div key={index}>
                                <div className="flex items-center gap-2 text-xs text-text-secondary dark:text-d-text-secondary">
                                    <span className={messageTypeStyles[msg.type].color}>{messageTypeStyles[msg.type].label}</span>
                                    <span>{msg.timestamp}</span>
                                </div>
                                <div className="pl-2 border-l-2 border-border-color dark:border-d-border-color ml-2 mt-1">
                                    <pre className="whitespace-pre-wrap break-all text-text-primary dark:text-d-text-primary">{msg.content}</pre>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="p-3 border-t border-border-color dark:border-d-border-color">
                        <label className="font-semibold text-sm mb-1 block">{t('tools.websocketClient.messageToSend')}</label>
                        <div className="flex gap-2">
                            <textarea
                                value={messageInput}
                                onChange={e => setState(s => ({ ...s, messageInput: e.target.value }))}
                                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                                disabled={!isConnected}
                                className="flex-1 p-2 bg-primary dark:bg-d-primary rounded-md resize-none h-16 disabled:opacity-50"
                            />
                            <button
                                onClick={handleSend}
                                disabled={!isConnected || !messageInput}
                                className="self-stretch px-4 bg-accent text-white rounded-md disabled:opacity-50"
                            >
                                <ArrowRightIcon />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WebSocketClient;
