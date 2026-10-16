import { createContext, useContext } from 'react';

export const PanelAccessContext = createContext(null);

export const usePanelAccess = () => {
    const context = useContext(PanelAccessContext);
    if (!context) {
        throw new Error('usePanelAccess must be used within a PanelGate');
    }
    return context;
};
