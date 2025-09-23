import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { ToolId } from '../types';

type ToolStates = Partial<Record<ToolId, any>>;

interface IToolStateContext {
    states: ToolStates;
    setToolState: <T>(toolId: ToolId, newState: T | ((prevState: T) => T)) => void;
    initToolState: <T>(toolId: ToolId, initialState: T) => void;
}

const ToolStateContext = createContext<IToolStateContext | undefined>(undefined);

export const ToolStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [states, setStates] = useState<ToolStates>({});

    const setToolState = useCallback(<T,>(toolId: ToolId, newState: T | ((prevState: T) => T)) => {
        setStates(prevStates => {
            const oldState = prevStates[toolId] as T;
            const updatedState = typeof newState === 'function' ? (newState as (prevState: T) => T)(oldState) : newState;
            return { ...prevStates, [toolId]: updatedState };
        });
    }, []);
    
    const initToolState = useCallback(<T,>(toolId: ToolId, initialState: T) => {
        setStates(prevStates => {
            if (Object.prototype.hasOwnProperty.call(prevStates, toolId)) {
                return prevStates;
            }
            return { ...prevStates, [toolId]: initialState };
        });
    }, []);

    return (
        <ToolStateContext.Provider value={{ states, setToolState, initToolState }}>
            {children}
        </ToolStateContext.Provider>
    );
};

export const useToolState = <T,>(toolId: ToolId, initialState: T): { state: T; setState: (newState: T | ((prevState: T) => T)) => void } => {
    const context = useContext(ToolStateContext);
    if (!context) {
        throw new Error('useToolState must be used within a ToolStateProvider');
    }
    
    useEffect(() => {
        context.initToolState<T>(toolId, initialState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [context.initToolState, toolId]);

    const state = context.states[toolId] as T ?? initialState;
    
    const setState = useCallback((newState: T | ((prevState: T) => T)) => {
        context.setToolState<T>(toolId, newState);
    }, [context.setToolState, toolId]);

    return { state, setState };
};
