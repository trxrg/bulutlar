import { createContext, useRef, useState, useContext, useEffect } from 'react';
import { DBContext } from './db-context';
import { AppContext } from './app-context';

export const ReadContext = createContext();

export default function ReadContextProvider({ children, article }) {

    const { getOwnerById, getCategoryById, fetchArticleById } = useContext(DBContext);
    const { fullScreen } = useContext(AppContext);
    const [fontSize, setFontSize] = useState('text-3xl');
    const [editable, setEditable] = useState(false);
    const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
    const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);

    const readContentRef = useRef();

    const fontSizes = ['text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl', 'text-5xl', 'text-6xl', 'text-7xl'];
   
    const syncArticleFromBE = async () => {
        await fetchArticleById(article.id);
    }

    const saveContent = () => {
        if (readContentRef && readContentRef.current)
            readContentRef.current.saveContent();
    }

    const resetContent = () => {
        if (readContentRef && readContentRef.current)
            readContentRef.current.resetContent();
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
        if (readContentRef && readContentRef.current)
            readContentRef.current.toggleStyle(style);
    }

    const toggleBlockType = (blockType) => {
        if (readContentRef && readContentRef.current)
            readContentRef.current.toggleBlockType(blockType);
    }

    const addImage = () => {
        if (readContentRef && readContentRef.current)
            readContentRef.current.addImage();
    }

    const getOwnerName = () => {
        if (article) {
            const owner = getOwnerById(article.ownerId);
            return owner ? owner.name : '';
        }
        return '';
    }

    const getCategoryName = () => {
        if (article) {
            const category = getCategoryById(article.categoryId);
            return category ? category.name : '';
        }
        return '';
    }

    useEffect(() => {
        if (fullScreen) {
            setLeftPanelCollapsed(true);
            setRightPanelCollapsed(true);
        }
    }, [fullScreen]);

    const ctxValue = {
        article,
        readContentRef,    
        toggleStyle,
        toggleBlockType,
        addImage,
        saveContent,
        resetContent,        
        syncArticleFromBE,
        fontSize,
        increaseFontSize,
        decreaseFontSize,
        editable,
        setEditable,
        rightPanelCollapsed,
        setRightPanelCollapsed,
        leftPanelCollapsed,
        setLeftPanelCollapsed,
        getCategoryName,
        getOwnerName,
    };

    return <ReadContext.Provider value={ctxValue}>
        {children}
    </ReadContext.Provider>
}
