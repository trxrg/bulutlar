import { createContext } from 'react';

export const ReadContext = createContext(

);

export default function ReadContextProvider({ children, article }) {
    
    const ctxValue = {
        article
    };

    return <ReadContext.Provider value={ctxValue}>
        {children}
    </ReadContext.Provider>
}