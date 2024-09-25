import { createContext, useState, useEffect } from 'react';
import { getAllArticles, getAllTags, getAllOwners, getAllCategories, getArticleWithId } from '../backend-adapter/BackendAdapter';

export const AppContext = createContext(

);

export default function AppContextProvider({ children }) {
    const [allArticles, setAllArticles] = useState([]);
    const [allOwners, setAllOwners] = useState([]);
    const [allOwnersLoaded, setAllOwnersLoaded] = useState(false);
    const [allTags, setAllTags] = useState([]);
    const [allTagsLoaded, setAllTagsLoaded] = useState(false);
    const [allCategories, setAllCategories] = useState([]);
    const [allCategoriesLoaded, setAllCategoriesLoaded] = useState(false);
    const [activeScreen, setActiveScreen] = useState('tabs');
    const [editedArticle, setEditedArticle] = useState();
    const [activeTabId, setActiveTabId] = useState('search');
    const [tabs, setTabs] = useState([
        { id: 'search', title: 'Search' }
    ]);

    const syncArticleWithIdFromBE = async (id) => {
        try {
            const updatedArticle = await getArticleWithId(id);

            console.log('updated article')
            console.log(updatedArticle)

            const updatedArticles = allArticles.map(article => article.id === id ? updatedArticle : article);
            setAllArticles(updatedArticles);
        } catch (err) {
            console.error(err);
        }
    }

    const getAllArticlesFromBE = async () => {
        try {
            const response = await getAllArticles();
            setAllArticles(response);
        } catch (err) {
            console.error(err);
        }
    }

    const getAllTagsFromBE = async () => {
        try {
            const response = await getAllTags();
            setAllTags(response);
            setAllTagsLoaded(true);
        } catch (err) {
            console.error(err);
        }
    }

    const getAllOwnersFromBE = async () => {
        try {
            const response = await getAllOwners();
            setAllOwners(response);
            setAllOwnersLoaded(true);
        } catch (err) {
            console.error(err);
        }
    }

    const getAllCategoriesFromBE = async () => {
        try {
            const response = await getAllCategories();
            setAllCategories(response);
            setAllCategoriesLoaded(true);
        } catch (err) {
            console.error(err);
        }
    }

    const getDataFromBE = async () => {
        console.log('syncing with DB');
        try {
            await Promise.all([
                getAllArticlesFromBE(),
                getAllOwnersFromBE(),
                getAllTagsFromBE(),
                getAllCategoriesFromBE()
            ]);
        } catch (err) {
            console.error(err);
        }
    }

    useEffect(() => {
        getDataFromBE();
    }, []);

    const handleAddTab = (articleId) => {
        if (!allArticles.map(article => article.id).includes(articleId))
            return;

        if (tabs.map(tab => tab.id).includes(articleId)) {
            setActiveTabId(articleId);
            return;
        }
        const newTabId = articleId;
        const newTabs = [...tabs, { id: newTabId }];
        setTabs(newTabs);
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

    const handleEditClicked = (article) => {
        setEditedArticle(article);
        setActiveScreen('addArticle');
    }

    const handleLinkClicked = (articleCode) => {
        const article = allArticles.find(article => article.code === articleCode);
        if (!article)
            return;

        handleAddTab(article.id);
    }

    const handleAddArticle = () => {
        setEditedArticle(undefined);
        setActiveScreen('addArticle');
    }

    const handleCancel = () => {
        setActiveScreen('tabs');
    }

    const afterSubmitArticle = async (id) => {
        await getDataFromBE();
        handleAddTab(id);
        setActiveScreen('tabs');
    }

    const afterDeleteArticle = async (id) => {
        await getAllArticlesFromBE();
        handleCloseTab(id);
        setActiveScreen('tabs');
    }

    const ctxValue = {
        editClicked: handleEditClicked,
        linkClicked: handleLinkClicked,
        activeTabId: activeTabId,
        setActiveTabId: setActiveTabId,
        addTab: handleAddTab,
        closeTab: handleCloseTab,
        tabs: tabs,
        allArticles,
        allOwners,
        allTags,
        allOwnersLoaded,
        allTagsLoaded,
        allCategories,
        editedArticle,
        activeScreen,
        syncWithDB: getDataFromBE,
        handleAddArticle,
        handleAddTab,
        handleCancel,
        getAllArticlesFromBE,
        getAllCategoriesFromBE,
        syncArticleWithIdFromBE,
        afterDeleteArticle,
        afterSubmitArticle
    }; // TODO fill this

    return <AppContext.Provider value={ctxValue}>
        {children}
    </AppContext.Provider>
}