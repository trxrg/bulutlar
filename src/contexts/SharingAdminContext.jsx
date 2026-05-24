import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { adminApi } from '../backend-adapter/BackendAdapter';

const SharingAdminContext = createContext(null);

export function SharingAdminProvider({ children }) {
    const [enabled, setEnabled] = useState(false);
    const [loaded, setLoaded] = useState(false);

    const refresh = useCallback(async () => {
        const isEnabled = await adminApi.isEnabled();
        setEnabled(isEnabled);
        setLoaded(true);
        return isEnabled;
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const unlock = useCallback(async (passphrase) => {
        const ok = await adminApi.unlock(passphrase);
        if (ok) setEnabled(true);
        return ok;
    }, []);

    const exitAdminMode = useCallback(async () => {
        await adminApi.lock();
        setEnabled(false);
    }, []);

    useEffect(() => {
        document.documentElement.dataset.adminMode = enabled ? 'true' : 'false';
        return () => {
            document.documentElement.dataset.adminMode = 'false';
        };
    }, [enabled]);

    return (
        <SharingAdminContext.Provider value={{ enabled, loaded, refresh, unlock, exitAdminMode, lock: exitAdminMode }}>
            {children}
        </SharingAdminContext.Provider>
    );
}

export function useSharingAdmin() {
    const ctx = useContext(SharingAdminContext);
    if (!ctx) {
        throw new Error('useSharingAdmin must be used within SharingAdminProvider');
    }
    return ctx;
}
