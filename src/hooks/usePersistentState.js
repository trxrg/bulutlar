import { useState, useEffect } from 'react';
import { storeApi } from '../backend-adapter/BackendAdapter.js';

export const usePersistentState = (key, defaultValue, shouldPersist = true) => {
    const [state, setState] = useState(defaultValue);
    const [isInitialized, setIsInitialized] = useState(false);

    // console.log('key:', key, 'shouldPersist:', shouldPersist);

    useEffect(() => {
        const fetchStoredValue = async () => {
            // console.log('fetchStoredValue usePersistentState: key:', key);
            const storedValue = await storeApi.get(key);
            // console.log('get usePersistentState: key:', key, 'storedValue: ', storedValue);
            if (storedValue !== undefined) {
                setState(storedValue);
            }
        };
        
        setIsInitialized(true);
        if (shouldPersist) {
            fetchStoredValue();
        }
    }, [key, shouldPersist]);

    useEffect(() => {
        if (isInitialized) {
            storeApi.set(key, state);
            // console.log('set usePersistentState: key:', key, 'state: ', state);
        }
    }, [key, state, isInitialized, shouldPersist]);

    return [state, setState];
};