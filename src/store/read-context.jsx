import { createContext } from 'react';

export const ReadContext = createContext(

);

export default function ReadContextProvider({ children }) {
    
    const ctxValue = {}; 

    return <ReadContext.Provider value={ctxValue}>
        {children}
    </ReadContext.Provider>
}