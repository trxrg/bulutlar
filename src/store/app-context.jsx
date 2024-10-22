import { createContext, useState, useContext } from 'react';
import i18n from '../i18n';
import { useTranslation } from 'react-i18next';
import { DBContext } from './db-context';

export const AppContext = createContext();

export default function AppContextProvider({ children }) {
    const [activeScreen, setActiveScreen] = useState('home');
    const [fullScreen, setFullScreen] = useState(false);
    const [activeTabId, setActiveTabId] = useState('search');
    const [tabs, setTabs] = useState([
        { id: 'search', title: 'Search' }
    ]);

    const { allArticles, fetchAllData } = useContext(DBContext);

    const { t } = useTranslation();

    const handleAddTab = (e, articleId) => {
        if (!allArticles.map(article => article.id).includes(articleId))
            return;

        if (tabs.map(tab => tab.id).includes(articleId)) {
            if (!e.ctrlKey && !e.metaKey)
                setActiveTabId(articleId);
            return;
        }
        const newTabId = articleId;
        const newTabs = [...tabs, { id: newTabId }];
        setTabs(newTabs);
        if (!e.ctrlKey && !e.metaKey)
            setActiveTabId(newTabId);
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

    const afterDeleteArticle = async (id) => {
        await fetchAllData();
        handleCloseTab(id);
        setActiveScreen('tabs');
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
        }

        return t(result); 
    }

    const changeLanguage = () => {
        if (i18n.language === 'tr')
            i18n.changeLanguage('en');
        else
            i18n.changeLanguage('tr');
    }

    const ctxValue = {
        linkClicked: handleLinkClicked,
        activeTabId,
        setActiveTabId: setActiveTabId,
        addTab: handleAddTab,
        closeTab: handleCloseTab,
        tabs,
        activeScreen,
        setActiveScreen,
        handleAddArticle,
        handleAddTab,
        handleCancel,
        afterDeleteArticle,
        afterSubmitArticle,
        fullScreen,
        setFullScreen,
        getActiveScreenTitle,
        changeLanguage,
        translate: t,
    };

    return <AppContext.Provider value={ctxValue}>
        {children}
    </AppContext.Provider>
}