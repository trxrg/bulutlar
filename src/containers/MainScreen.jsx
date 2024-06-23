import React, { useState } from 'react';
import SearchScreen from './SearchScreen';
import TabsScreen from './TabsScreen';
import AddArticle from './AddArticle';

const MainScreen = () => {

    const [activeScreen, setActiveScreen] = useState('tabs');

    const handleAddArticle = () => {
        setActiveScreen('addArticle');
    }

    const handleCancel = () => {
        setActiveScreen('tabs');
    }

    const handleRandom = () => {
        console.log('random clicked');
    }

    return (
        <div className="h-screen max-w-5xl border border-blue-300 p-4 mx-auto">
            <div className="flex justify-end mb-4 border border-red-200">
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

            {activeScreen === 'tabs' ? <TabsScreen></TabsScreen> : undefined}
            {activeScreen === 'addArticle' ? <AddArticle></AddArticle> : undefined}
        </div>
    );
};

export default MainScreen;
