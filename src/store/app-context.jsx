import { createContext, useState, useContext, useRef, useCallback } from 'react';
import i18n from '../i18n';
import { useTranslation } from 'react-i18next';
import { DBContext } from './db-context';
import { usePersistentState } from '../hooks/usePersistentState';
import { useEffect } from 'react';

// Detect if running on Mac (only checked once when module loads)
const isMac = /(Mac|iPhone|iPod|iPad)/i.test(navigator.userAgent);

export const AppContext = createContext();

export default function AppContextProvider({ children }) {
    const { allArticles, fetchAllData, allDataFetched } = useContext(DBContext);

    const [activeScreen, setActiveScreen] = usePersistentState('activeScreen', 'home');
    const [fullScreen, setFullScreen] = usePersistentState('fullscreen', false);
    const [activeTabId, setActiveTabId] = usePersistentState('activeTabId', 'search');
    const [tabs, setTabs] = usePersistentState('tabs', [{ id: 'search', title: 'Search' }]);
    const [editorSettings, setEditorSettings] = usePersistentState('editorSettings', {
        fontFamily: 'system-ui',
        fontSize: 'text-3xl',
        lineHeight: 'loose',
        autosaveEnabled: false,
        autosaveInterval: 30 // seconds
    });
    const [ttsSettings, setTtsSettings] = usePersistentState('ttsSettings', {
        language: 'app',
        voiceURI: 'auto'
    });
    const [dataIsCleaned, setDataIsCleaned] = useState(false);
    const [isReadyToShow, setIsReadyToShow] = useState(false);
    const [loadingStartTime] = useState(Date.now());

    // Registry for tabs in edit mode with their save callbacks
    const editableTabsRef = useRef({});
    const [saveConfirmModal, setSaveConfirmModal] = useState({ isOpen: false, tabId: null });

    const { t } = useTranslation();

    useEffect(() => {
        if (allDataFetched) {
            cleanTabs();
            setDataIsCleaned(true);
        }
    }, [allDataFetched]);

    useEffect(() => {
        if (allDataFetched && dataIsCleaned) {
            const elapsedTime = Date.now() - loadingStartTime;
            const minDisplayTime = 5000; // 7 seconds minimum

            if (elapsedTime >= minDisplayTime) {
                // Enough time has passed, show immediately
                setIsReadyToShow(true);
            } else {
                // Wait for the remaining time
                const remainingTime = minDisplayTime - elapsedTime;
                const timer = setTimeout(() => {
                    setIsReadyToShow(true);
                }, remainingTime);

                return () => clearTimeout(timer);
            }
        }
    }, [allDataFetched, dataIsCleaned, loadingStartTime]);

    // Handle hiding the initial HTML loader with proper fade transition
    useEffect(() => {
        if (isReadyToShow) {
            const initialLoader = document.getElementById('initial-loader');
            if (initialLoader) {
                const video = initialLoader.querySelector('video');
                if (video) {
                    // Disable loop to prevent restart glitch
                    video.loop = false;

                    // Create smooth audio fade out
                    const fadeOutDuration = 2000; // 2 second fade out
                    const fadeOutSteps = 40;
                    const stepDuration = fadeOutDuration / fadeOutSteps;
                    let currentStep = 0;

                    const fadeOutInterval = setInterval(() => {
                        currentStep++;
                        const volume = Math.max(0, 1 - (currentStep / fadeOutSteps));
                        video.volume = volume;

                        if (currentStep >= fadeOutSteps) {
                            clearInterval(fadeOutInterval);
                            video.pause();
                            // Don't reset currentTime to avoid glitch
                            video.volume = 1; // Reset volume for next time
                        }
                    }, stepDuration);
                }

                // Apply transition first
                initialLoader.style.transition = 'opacity 1s ease-out';

                // Small delay to ensure transition is applied
                setTimeout(() => {
                    initialLoader.style.opacity = '0';
                }, 10);

                // Remove completely after fade completes
                setTimeout(() => {
                    initialLoader.style.display = 'none';
                    // Remove video element to free memory
                    const video = initialLoader.querySelector('video');
                    if (video) {
                        video.remove(); // Remove from DOM to free memory
                    }
                }, 2010); // 2000ms transition + 10ms delay
            }
        }
    }, [isReadyToShow]);

    const cleanTabs = () => {
        // Filter out invalid tabs but preserve the order
        const validTabs = tabs.filter(tab =>
            tab.id === 'search' || allArticles.some(article => article.id === tab.id)
        );

        // Ensure search tab exists, but don't force it to be first
        if (!validTabs.some(tab => tab.id === 'search')) {
            validTabs.unshift({ id: 'search', title: 'Search' });
        }

        setTabs(validTabs);
        if (!validTabs.map(tab => tab.id).includes(activeTabId))
            setActiveTabId('search');
    }

    const handleAddTab = (e, articleId) => {
        if (!allArticles.map(article => article.id).includes(articleId))
            return;

        if (tabs.map(tab => tab.id).includes(articleId)) {
            if (!e || !e.ctrlKey && !e.metaKey)
                setActiveTabId(articleId);
            return;
        }
        const newTabId = articleId;
        const newTabs = [...tabs, { id: newTabId }];
        setTabs(newTabs);
        if (!e || !e.ctrlKey && !e.metaKey)
            setActiveTabId(newTabId);
    };

    const handleAddTab2 = (articleId) => {
        // console.log('handleAddTab2');
        // console.log(allArticles);
        // if (!allArticles.map(article => article.id).includes(articleId))
        //     return;

        if (tabs.map(tab => tab.id).includes(articleId)) {
            setActiveTabId(articleId);
            return;
        }

        const newTabId = articleId;
        const newTabs = [...tabs, { id: newTabId }];
        setTabs(newTabs);
        setActiveTabId(newTabId);
    };

    const handleAddRandomTab = (e) => {
        const randomIndex = Math.floor(Math.random() * allArticles.length);
        const randomArticle = allArticles[randomIndex];
        handleAddTab(e, randomArticle.id);
    };

    // Register a tab as editable with its save callback
    const registerEditableTab = useCallback((tabId, saveCallback) => {
        editableTabsRef.current[tabId] = { saveCallback };
    }, []);

    // Unregister a tab from editable registry
    const unregisterEditableTab = useCallback((tabId) => {
        delete editableTabsRef.current[tabId];
    }, []);

    // Directly close a tab without confirmation
    const closeTabDirectly = (tabId) => {
        let updatedTabs = [...tabs];
        updatedTabs = updatedTabs.filter(tab => tab.id !== tabId);
        setTabs(updatedTabs);

        if (activeTabId === tabId && updatedTabs.length > 0) {
            setActiveTabId(updatedTabs[updatedTabs.length - 1].id);
        }
    };

    // Handle close tab - check if confirmation is needed
    const handleCloseTab = (tabId) => {
        // Check if tab is in edit mode
        if (editableTabsRef.current[tabId]) {
            // Show confirmation modal
            setSaveConfirmModal({ isOpen: true, tabId });
            return;
        }

        closeTabDirectly(tabId);
    };

    // Handle save and close from confirmation modal
    const handleSaveAndClose = async () => {
        const tabId = saveConfirmModal.tabId;
        const tabInfo = editableTabsRef.current[tabId];

        if (tabInfo && tabInfo.saveCallback) {
            await tabInfo.saveCallback();
        }

        unregisterEditableTab(tabId);
        setSaveConfirmModal({ isOpen: false, tabId: null });
        closeTabDirectly(tabId);
    };

    // Handle discard and close from confirmation modal
    const handleDiscardAndClose = () => {
        const tabId = saveConfirmModal.tabId;
        unregisterEditableTab(tabId);
        setSaveConfirmModal({ isOpen: false, tabId: null });
        closeTabDirectly(tabId);
    };

    // Handle cancel from confirmation modal
    const handleCancelClose = () => {
        setSaveConfirmModal({ isOpen: false, tabId: null });
    };

    const handleLinkClicked = (articleCode) => {
        const article = allArticles.find(article => article.code === articleCode);
        if (!article)
            return;

        handleAddTab(article.id);
    }

    const handleAddArticle = () => {
        setActiveScreen('addArticle');
    }

    const handleCancel = () => {
        setActiveScreen('tabs');
    }

    const afterSubmitArticle = async (id) => {
        await fetchAllData();
        handleAddTab(id);
        setActiveScreen('tabs');
    }

    const afterSubmitArticle2 = async (id) => {
        await fetchAllData();
        handleAddTab2(id);
    }

    const beforeDeleteArticle = async (id) => {
        unregisterEditableTab(id); // Unregister from edit mode before closing to avoid save confirmation
        handleCloseTab(id);
        setActiveScreen('tabs');
    }

    const afterDeleteArticle = async (id) => {
        await fetchAllData();
    }

    const getActiveScreenTitle = () => {
        let result = '';
        if (activeScreen === 'addArticle') {
            result = 'Add Article';
        } else if (activeScreen === 'tabs') {
            result = 'articles';
        } else if (activeScreen === 'home') {
            result = 'home';
        } else if (activeScreen === 'categories') {
            result = 'categories';
        } else if (activeScreen === 'owners') {
            result = 'owners';
        } else if (activeScreen === 'tags') {
            result = 'tags';
        } else if (activeScreen === 'groups') {
            result = 'groups';
        } else if (activeScreen === 'annotations') {
            result = 'annotations';
        } else if (activeScreen === 'quotes') {
            result = 'quotes';
        } else if (activeScreen === 'settings') {
            result = 'settings';
        }

        return t(result);
    }

    const changeLanguage = () => {
        if (i18n.language === 'tr')
            i18n.changeLanguage('en');
        else
            i18n.changeLanguage('tr');
    }

    const getLanguage = () => {
        return i18n.language;
    }

    const resetTabs = () => {
        setTabs([
            { id: 'search', title: 'Search' }
        ]);
        setActiveTabId('search');
    }

    const reorderTabs = (startIndex, endIndex) => {
        const newTabs = Array.from(tabs);
        const [removed] = newTabs.splice(startIndex, 1);
        newTabs.splice(endIndex, 0, removed);
        setTabs(newTabs);
    }

    // Close all tabs except search
    const closeAllTabs = () => {
        const searchTab = tabs.find(tab => tab.id === 'search');
        setTabs(searchTab ? [searchTab] : [{ id: 'search', title: 'Search' }]);
        setActiveTabId('search');
    }

    // Close all tabs except the specified one and search
    const closeOtherTabs = (keepTabId) => {
        const newTabs = tabs.filter(tab => tab.id === 'search' || tab.id === keepTabId);
        setTabs(newTabs);
        // If the kept tab exists, make it active
        if (keepTabId && newTabs.some(tab => tab.id === keepTabId)) {
            setActiveTabId(keepTabId);
        }
    }

    // Close tabs to the right of the specified tab
    const closeTabsToRight = (tabId) => {
        const tabIndex = tabs.findIndex(tab => tab.id === tabId);
        if (tabIndex === -1) return;

        // Keep tabs up to and including the specified tab, but also keep search if it's to the right
        const newTabs = tabs.filter((tab, index) => {
            if (tab.id === 'search') return true;
            return index <= tabIndex;
        });
        setTabs(newTabs);
    }

    const ctxValue = {
        linkClicked: handleLinkClicked,
        activeTabId,
        setActiveTabId,
        addTab: handleAddTab,
        closeTab: handleCloseTab,
        closeAllTabs,
        closeOtherTabs,
        closeTabsToRight,
        reorderTabs,
        tabs,
        activeScreen,
        resetTabs,
        setActiveScreen,
        handleAddArticle,
        handleAddTab,
        handleAddRandomTab,
        handleCancel,
        beforeDeleteArticle,
        afterDeleteArticle,
        afterSubmitArticle,
        afterSubmitArticle2,
        fullScreen,
        setFullScreen,
        getActiveScreenTitle,
        changeLanguage,
        getLanguage,
        translate: t,
        editorSettings,
        setEditorSettings,
        ttsSettings,
        setTtsSettings,
        isMac,
        // Editable tab confirmation
        registerEditableTab,
        unregisterEditableTab,
        saveConfirmModal,
        handleSaveAndClose,
        handleDiscardAndClose,
        handleCancelClose
    };

    return (
        <AppContext.Provider value={ctxValue}>
            {isReadyToShow ? (
                children
            ) : (
                <div className='flex flex-col items-center justify-center h-screen bg-black text-white'>
                    <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white"></div>
                        <div className="mt-6 text-xl">{t('loading')}...</div>
                    </div>
                </div>
            )}
        </AppContext.Provider>
    );
}