import { createContext, useRef, useState, useContext } from 'react';
import { AppContext } from './app-context.jsx';

export const ReadContext = createContext();

export default function ReadContextProvider({ children, article }) {

    const { syncArticleWithIdFromBE } = useContext(AppContext);
    const [fontSize, setFontSize] = useState('text-xl');
    const [editable, setEditable] = useState(false);
    const [sidePanelCollapsed, setSidePanelCollapsed] = useState(false);

    const readBodyRef = useRef();

    const fontSizes = ['text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl', 'text-5xl', 'text-6xl'];
   
    const syncArticleFromBE = async () => {
        await syncArticleWithIdFromBE(article.id);
    }

    const saveContent = () => {
        if (readBodyRef && readBodyRef.current)
            readBodyRef.current.saveContent();
    }

    const resetContent = () => {
        if (readBodyRef && readBodyRef.current)
            readBodyRef.current.resetContent();
    }

    const increaseFontSize = () => {
        const index = fontSizes.indexOf(fontSize);

        if (index + 1 < fontSizes.length)
            setFontSize(fontSizes[index + 1]);
    }

    const decreaseFontSize = () => {
        const index = fontSizes.indexOf(fontSize);

        if (index > 0)
            setFontSize(fontSizes[index - 1]);
    }

    const toggleStyle = (style) => {
        if (readBodyRef && readBodyRef.current)
            readBodyRef.current.toggleStyle(style);
    }

    const addImage = () => {
        if (readBodyRef && readBodyRef.current)
            readBodyRef.current.addImage();
    }

    const ctxValue = {
        article,
        readBodyRef,    
        toggleStyle,
        addImage,
        saveContent,
        resetContent,        
        syncArticleFromBE,
        fontSize,
        increaseFontSize,
        decreaseFontSize,
        editable,
        setEditable,
        sidePanelCollapsed,
        setSidePanelCollapsed,
    };

    return <ReadContext.Provider value={ctxValue}>
        {children}
    </ReadContext.Provider>
}
