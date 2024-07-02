import React, { useState, useEffect } from 'react';
import TabsScreen from './TabsScreen';
import AddArticle from './AddArticle';

import { getAllArticles, getAllTags, getAllOwners } from '../backend-adapter/BackendAdapter';

const MainScreen = () => {

    const [allArticles, setAllArticles] = useState([]);
    const [allOwners, setAllOwners] = useState([]);
    const [allOwnersLoaded, setAllOwnersLoaded] = useState(false);
    const [allTags, setAllTags] = useState([]);
    const [allTagsLoaded, setAllTagsLoaded] = useState(false);
    const [activeScreen, setActiveScreen] = useState('tabs');
    const [editedArticle, setEditedArticle] = useState();
    const [activeTabId, setActiveTabId] = useState('search');
    const [tabs, setTabs] = useState([
        { id: 'search', title: 'Search' }
    ]);

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

    const getDataFromBE = async () => {
        try {
            await Promise.all([
                getAllArticlesFromBE(),
                getAllOwnersFromBE(),
                getAllTagsFromBE()
            ]);
        } catch (err) {
            console.error(err);
        }
    }

    useEffect(() => {
        // Logic to execute after component initialization
        getDataFromBE();
    }, []);

    const handleAddArticle = () => {
        setEditedArticle(undefined);
        setActiveScreen('addArticle');
    }

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

    const handleRandom = () => {
        console.log('random clicked');
    }

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

    return (
        <div className="h-screen max-w-5xl mx-auto bg-stone-200">
            <div className='h-[15%] flex justify-between items-center px-4 border-b-4 border-red-300'>
                <h1 className='text-5xl text-gray-600'>BULUTLAR</h1>
                <div className="flex justify-end items-center">
                    <div className='h-2/3'>
                        {activeScreen === 'tabs' ?
                            <>
                                <button
                                    className="button text-white py-2 px-4 mx-2 rounded-md hover:bg-green-700 focus:outline-none"
                                    onClick={handleRandom}
                                >
                                    Random
                                </button>
                                <button
                                    className="button text-white py-2 px-4 mx-2 rounded-md hover:bg-blue-700 focus:outline-none"
                                    onClick={handleAddArticle}
                                >
                                    Add Article
                                </button>
                            </>
                            :
                            <button
                                className="bg-red-500 text-white py-2 px-4 mx-2 rounded-md hover:bg-red-600 focus:outline-none"
                                onClick={handleCancel}
                            >
                                Cancel
                            </button>}
                    </div>
                </div>
            </div>
            <div className='h-[85%]'>
                {activeScreen === 'tabs' ?
                    <TabsScreen onEditClicked={handleEditClicked}
                        handleLinkClicked={handleLinkClicked}
                        activeTabId={activeTabId}
                        setActiveTabId={setActiveTabId}
                        handleAddTab={handleAddTab}
                        handleCloseTab={handleCloseTab}
                        tabs={tabs}
                        allArticles={allArticles}
                        allOwners={allOwners}
                        allOwnersLoaded={allOwnersLoaded}
                        allTags={allTags}
                        allTagsLoaded={allTagsLoaded}></TabsScreen>
                    : undefined}
                {activeScreen === 'addArticle' ?
                    <AddArticle article={editedArticle}
                        allTags={allTags}
                        allOwners={allOwners}
                        afterSubmitClicked={afterSubmitArticle}
                        afterDeleteClicked={afterDeleteArticle}></AddArticle>
                    : undefined}
            </div>
        </div>
    );
};

export default MainScreen;
