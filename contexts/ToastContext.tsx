import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { v4 as uuidv4 } from 'uuid';
import { InfoIcon, AlertTriangleIcon, CheckCircleIcon, CloseIcon } from '../components/icons/Icons';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

type AddToastFunction = (message: string, type: ToastType) => void;

const ToastContext = createContext<AddToastFunction | undefined>(undefined);

const ToastComponent: React.FC<{ toast: Toast, onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
    const [isExiting, setIsExiting] = useState(false);

    const handleDismiss = useCallback(() => {
        setIsExiting(true);
        setTimeout(() => onDismiss(toast.id), 300); // match animation duration
    }, [onDismiss, toast.id]);

    useEffect(() => {
        const timer = setTimeout(() => {
            handleDismiss();
        }, 5000);
        return () => clearTimeout(timer);
    }, [handleDismiss]);

    const typeClasses = {
        success: 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800',
        error: 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
        info: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    };
    
    const icons = {
        success: <CheckCircleIcon />,
        error: <AlertTriangleIcon />,
        info: <InfoIcon />,
    };

    return (
        <div className={`toast ${isExiting ? 'toast-out' : ''} max-w-sm w-full p-4 rounded-lg shadow-lg flex items-start gap-3 border ${typeClasses[toast.type]}`}>
            <div className="flex-shrink-0 mt-0.5">{icons[toast.type]}</div>
            <div className="flex-grow text-sm font-semibold">{toast.message}</div>
            <button onClick={handleDismiss} className="-m-1 p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                <CloseIcon className="w-4 h-4" />
            </button>
        </div>
    );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);
    
    useEffect(() => {
        setPortalRoot(document.getElementById('toast-portal'));
    }, []);

    const addToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = uuidv4();
        setToasts(prev => [...prev, { id, message, type }]);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    const toastElements = (
        <>
            {toasts.map(toast => (
                <ToastComponent key={toast.id} toast={toast} onDismiss={removeToast} />
            ))}
        </>
    );
    
    return (
        <ToastContext.Provider value={addToast}>
            {children}
            {portalRoot && ReactDOM.createPortal(toastElements, portalRoot)}
        </ToastContext.Provider>
    );
};

export const useToasts = (): AddToastFunction => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToasts must be used within a ToastProvider');
    }
    return context;
};
