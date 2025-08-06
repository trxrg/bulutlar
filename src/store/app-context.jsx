import { createContext, useState, useContext } from 'react';
import i18n from '../i18n';
import { useTranslation } from 'react-i18next';
import { DBContext } from './db-context';
import { usePersistentState } from '../hooks/usePersistentState';
import { useEffect } from 'react';

export const AppContext = createContext();

export default function AppContextProvider({ children }) {
    const { allArticles, fetchAllData, allDataFetched } = useContext(DBContext);

    const [activeScreen, setActiveScreen] = usePersistentState('activeScreen', 'home');
    const [fullScreen, setFullScreen] = usePersistentState('fullscreen', false);
    const [activeTabId, setActiveTabId] = usePersistentState('activeTabId', 'search');
    const [tabs, setTabs] = usePersistentState('tabs', [{ id: 'search', title: 'Search' }]);
    const [dataIsCleaned, setDataIsCleaned] = useState(false);
    const [isReadyToShow, setIsReadyToShow] = useState(false);
    const [loadingStartTime] = useState(Date.now());

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
            const minDisplayTime = 3000; // 2 seconds minimum

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

    const cleanTabs = () => {
        const validTabs = tabs.filter(tab => allArticles.some(article => article.id === tab.id));
        setTabs([{ id: 'search', title: 'Search' }, ...validTabs]);
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

    const handleCloseTab = (tabId) => {
        let updatedTabs = [...tabs];
        updatedTabs = updatedTabs.filter(tab => tab.id !== tabId);
        setTabs(updatedTabs);

        if (activeTabId === tabId && updatedTabs.length > 0) {
            setActiveTabId(updatedTabs[updatedTabs.length - 1].id);
        }
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

    const normalizeText = (text) => {
        if (!text)
            return '';
        if (typeof text !== 'string') return text;
        const turkishMap = {
            'ç': 'c', 'Ç': 'C',
            'ğ': 'g', 'Ğ': 'G',
            'ı': 'i', 'İ': 'I',
            'ö': 'o', 'Ö': 'O',
            'ş': 's', 'Ş': 'S',
            'ü': 'u', 'Ü': 'U'
        };
        const result = text.split('').map(char => turkishMap[char] || char).join('').toLowerCase();
        return result;
    };

    const htmlToText = (html) => {
        if (!html)
            return '';
        const doc = new DOMParser().parseFromString(html, 'text/html');
        return doc.body.textContent || "";
    };

    const ctxValue = {
        linkClicked: handleLinkClicked,
        activeTabId,
        setActiveTabId,
        addTab: handleAddTab,
        closeTab: handleCloseTab,
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
        normalizeText,
        htmlToText
    };

    return (
        <AppContext.Provider value={ctxValue}>
            {isReadyToShow ? (
                (() => {
                    // Hide initial HTML loader when React app is ready
                    const initialLoader = document.getElementById('initial-loader');
                    if (initialLoader) {
                        initialLoader.style.transition = 'opacity 0.3s ease-out';
                        initialLoader.style.opacity = '0';
                        setTimeout(() => {
                            initialLoader.style.display = 'none';
                        }, 300);
                    }
                    return children;
                })()
            ) : (
                <div className='flex flex-col items-center justify-center h-screen bg-black text-white'>
                    <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white"></div>
                        <div className="mt-6 text-xl">fadkl;sdsal;kf{t('loading')}...</div>
                    </div>
                </div>
            )}
        </AppContext.Provider>
    );
}