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
    const [isAddLinkModalOpen, setAddLinkModalOpen] = useState(false);
    const [contextMenuIsOpen, setContextMenuIsOpen] = useState(false);
    const [contextMenuPosition, setContextMenuPosition] = useState({ x: 10, y: 10 });
    const [searchTerm, setSearchTerm] = useState('');
    const [currentHighlightIndex, setCurrentHighlightIndex] = useState(-1);
    const [allHighlightRefs, setAllHighlightRefs] = useState([]); // Combined refs from all editors
    const articleId = article.id;

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

    const addQuote = () => {
        if (readContentRef && readContentRef.current)
            readContentRef.current.addQuote();
    }

    const toggleBlockType = (blockType) => {
        if (readContentRef && readContentRef.current)
            readContentRef.current.toggleBlockType(blockType);
    }

    const handleInsertImageClicked = () => {
        if (readContentRef && readContentRef.current)
            readContentRef.current.handleInsertImageClicked();
    }

    const handleInsertAudioClicked = () => {
        if (readContentRef && readContentRef.current)
            readContentRef.current.handleInsertAudioClicked();
    }

    const handleInsertVideoClicked = () => {
        if (readContentRef && readContentRef.current)
            readContentRef.current.handleInsertVideoClicked();
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

    const addLink = (url) => {
        if (readContentRef && readContentRef.current)
            readContentRef.current.addLink(url);
    }

    useEffect(() => {
        if (fullScreen) {
            setLeftPanelCollapsed(true);
            setRightPanelCollapsed(true);
        } else {
            setLeftPanelCollapsed(false);
            setRightPanelCollapsed(false);
        }
    }, [fullScreen]);

    useEffect(() => {
        if (!searchTerm) {
            setCurrentHighlightIndex(-1);
            setAllHighlightRefs([]);
        }
    }, [searchTerm]);

    // Navigation methods
    const scrollToNextHighlight = () => {
        if (allHighlightRefs.length === 0) return;
        
        const nextIndex = (currentHighlightIndex + 1) % allHighlightRefs.length;
        scrollToHighlight(nextIndex);
    };

    const scrollToPreviousHighlight = () => {
        if (allHighlightRefs.length === 0) return;
        
        const prevIndex = currentHighlightIndex <= 0 
            ? allHighlightRefs.length - 1 
            : currentHighlightIndex - 1;
        scrollToHighlight(prevIndex);
    };

    const scrollToHighlight = (index) => {
        if (index < 0 || index >= allHighlightRefs.length) return;
        
        const targetRef = allHighlightRefs[index]?.ref;
        if (targetRef) {
            // Remove previous highlight styling
            allHighlightRefs.forEach((item, i) => {
                if (item.ref) {
                    item.ref.style.backgroundColor = i === index ? '#66bb6a' : '#a5d6a7';
                    item.ref.style.outline = i === index ? '2px solid #4caf50' : 'none';
                }
            });
            
            setCurrentHighlightIndex(index);
            
            // Scroll to element
            targetRef.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'nearest'
            });
        }
    };

    const getHighlightInfo = () => {
        return {
            total: allHighlightRefs.length,
            current: currentHighlightIndex + 1,
            hasMatches: allHighlightRefs.length > 0
        };
    };

    const updateAllHighlightRefs = (editorId, refs) => {
        setAllHighlightRefs(prev => {
            // Remove existing refs from this editor
            const filtered = prev.filter(item => item.editorId !== editorId);
            // Add new refs with editor identifier
            const newRefs = refs.map(ref => ({ ...ref, editorId }));
            // Sort by DOM order (top to bottom)
            const combined = [...filtered, ...newRefs].sort((a, b) => {
                if (!a.ref || !b.ref) return 0;
                const aRect = a.ref.getBoundingClientRect();
                const bRect = b.ref.getBoundingClientRect();
                return aRect.top - bRect.top;
            });
            return combined;
        });
    };

    const ctxValue = {
        article,
        articleId,
        readContentRef,
        toggleStyle,
        addQuote,
        toggleBlockType,
        handleInsertImageClicked,
        handleInsertAudioClicked,
        handleInsertVideoClicked,
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
        isAddLinkModalOpen,
        setAddLinkModalOpen,
        getCategoryName,
        getOwnerName,
        addLink,
        contextMenuIsOpen,
        setContextMenuIsOpen,
        contextMenuPosition,
        setContextMenuPosition,
        searchTerm,
        setSearchTerm,
        setCurrentHighlightIndex,
        allHighlightRefs,
        setAllHighlightRefs,
        updateAllHighlightRefs,
        scrollToNextHighlight,
        scrollToPreviousHighlight,
        scrollToHighlight,
        getHighlightInfo
    };

    return <ReadContext.Provider value={ctxValue}>
        {children}
    </ReadContext.Provider>
}
