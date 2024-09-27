import React, { useContext } from 'react';
import TabsScreen from './TabsScreen';
import AddArticle from './crud/AddArticle';
import { AppContext } from '../store/app-context.jsx'

const MainScreen = () => {

    const { handleAddArticle, handleCancel, activeScreen } = useContext(AppContext);

    const handleRandom = () => {
        console.log('random clicked');
    }

    return (
        <div className="h-screen flex flex-col mx-auto bg-stone-200">
            <div className='flex-shrink-0 flex justify-between items-center p-4 border-b-4 border-red-300'>
                <h1 className='text-5xl text-gray-600'>HAZİNE</h1>
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
            <div className='flex flex-1 overflow-auto px-5 justify-center'>
                {activeScreen === 'tabs' ?
                    <TabsScreen/>
                    : undefined}
                {activeScreen === 'addArticle' ?
                    <AddArticle/>
                    : undefined}
            </div>
        </div>
    );
};

export default MainScreen;
