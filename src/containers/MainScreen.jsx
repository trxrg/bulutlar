import React, { useState, useEffect } from 'react';
import TabsScreen from './TabsScreen';
import AddArticle from './AddArticle';

import { getAllArticles } from '../backend-adapter/BackendAdapter';

const MainScreen = () => {

    const [allArticles, setAllArticles] = useState([]);
    const [activeScreen, setActiveScreen] = useState('tabs');
    const [editedArticle, setEditedArticle] = useState();
    const [activeTabId, setActiveTabId] = useState('search');
    const [tabs, setTabs] = useState([
        { id: 'search', title: 'Search' }
    ]);

    const getArticles = async () => {
        try {
            const response = await getAllArticles();
            setAllArticles(response);
        } catch (err) {
            console.error(err);
        }
    }

    useEffect(() => {
        // Logic to execute after component initialization
        getArticles();
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
        await getArticles();
        handleAddTab(id);
        setActiveScreen('tabs');
    }

    const afterDeleteArticle = async (id) => {
        await getArticles();
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
        <div className="h-screen max-w-5xl border border-blue-300 p-4 mx-auto">
            <div className="h-[10%] flex justify-end items-center mb-4 border border-red-200">
                <div className='h-2/3'>
                    {activeScreen === 'tabs' ?
                        <>
                            <button
                                className="bg-green-600 text-white py-2 px-4 mx-2 rounded-md hover:bg-green-700 focus:outline-none"
                                onClick={handleRandom}
                            >
                                Random
                            </button>
                            <button
                                className="bg-blue-600 text-white py-2 px-4 mx-2 rounded-md hover:bg-blue-700 focus:outline-none"
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
            <div className='h-[90%] border border-blue-800'>
                {activeScreen === 'tabs' ?
                    <TabsScreen onEditClicked={handleEditClicked}
                        handleLinkClicked={handleLinkClicked}
                        activeTabId={activeTabId}
                        setActiveTabId={setActiveTabId}
                        handleAddTab={handleAddTab}
                        handleCloseTab={handleCloseTab}
                        tabs={tabs}
                        allArticles={allArticles}></TabsScreen>
                    : undefined}
                {activeScreen === 'addArticle' ?
                    <AddArticle article={editedArticle}
                        afterSubmitClicked={afterSubmitArticle}
                        afterDeleteClicked={afterDeleteArticle}></AddArticle>
                    : undefined}
            </div>
        </div>
    );
};

export default MainScreen;
