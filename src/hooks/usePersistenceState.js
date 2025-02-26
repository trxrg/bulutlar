import { useState, useEffect } from 'react';
import { storeApi } from '../backend-adapter/BackendAdapter.js';

export const usePersistentState = (key, defaultValue) => {
    const [state, setState] = useState(defaultValue);
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        const fetchStoredValue = async () => {
            const storedValue = await storeApi.get(key);
            console.log('get usePersistentState: key:', key, 'storedValue: ', storedValue);
            if (storedValue !== undefined) {
                setState(storedValue);
            }
            setIsInitialized(true);
        };

        fetchStoredValue();
    }, [key]);

    useEffect(() => {
        if (isInitialized) {
            storeApi.set(key, state);
            console.log('set usePersistentState: key:', key, 'state: ', state);
        }
    }, [key, state, isInitialized]);

    return [state, setState];
};