import React, { useState } from 'react';
import TabsScreen from './TabsScreen';
import AddArticle from './AddArticle';

const MainScreen = () => {

    const [activeScreen, setActiveScreen] = useState('tabs');
    const [editedArticle, setEditedArticle] = useState();
    const [activeTabId, setActiveTabId] = useState('search');
    const [tabs, setTabs] = useState([
        { id: 'search', title: 'Search' }
      ]);

    const handleAddArticle = () => {
        setEditedArticle(undefined);
        setActiveScreen('addArticle');
    }

    const handleCancel = () => {
        // if (editedArticle)
        //     setActiveTabId(editedArticle.id);
        setActiveScreen('tabs');
    }

    const handleRandom = () => {
        console.log('random clicked');
    }

    const handleEditClicked = (article) => {
        console.log('handle edit clicked');
        console.log('article:');
        console.log(article);
        setEditedArticle(article);
        setActiveScreen('addArticle');
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
                {activeScreen === 'tabs' ? <TabsScreen onEditClicked={handleEditClicked} activeTabId={activeTabId} setActiveTabId={setActiveTabId} tabs={tabs} setTabs={setTabs}></TabsScreen> : undefined}
                {activeScreen === 'addArticle' ? <AddArticle article={editedArticle}></AddArticle> : undefined}
            </div>
        </div>
    );
};

export default MainScreen;
