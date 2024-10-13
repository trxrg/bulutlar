import React, { useContext } from 'react';

import TabsScreen from './article/TabsScreen';
import AddArticle from './article/AddArticle';
import CategoryScreen from './category/CategoryScreen';
import OwnerScreen from './owner/OwnerScreen';
import ActionButton from './common/ActionButton';

import { AppContext } from '../store/app-context';

const MainScreen = () => {

    const { handleAddArticle, handleCancel, activeScreen, setActiveScreen, fullScreen } = useContext(AppContext);

    const handleRandom = () => {
        console.log('random clicked');
    }

    return (
        <div className="h-screen flex flex-col mx-auto bg-stone-200">
            <div className={fullScreen ? 'hidden' : 'flex-shrink-0 flex justify-between items-center p-4 border-b-4 border-red-300'}>
                <h1 className='text-5xl text-gray-600'>BULUTLAR</h1>
                <div className="flex justify-end items-center">
                    <div className='h-2/3'>
                        {activeScreen === 'tabs' ?
                            <div className='flex gap-2'>
                                <ActionButton color='blue' onClick={() => setActiveScreen('owners')}>Owners</ActionButton>
                                <ActionButton color='blue' onClick={() => setActiveScreen('categories')}>Categories</ActionButton>
                                <ActionButton color='blue' onClick={handleRandom}>Random</ActionButton>
                                <ActionButton color='blue' onClick={handleAddArticle}>Add Article</ActionButton>
                            </div>
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
                    <TabsScreen />
                    : undefined}
                {activeScreen === 'addArticle' ?
                    <AddArticle />
                    : undefined}
                {activeScreen === 'categories' ?
                    <CategoryScreen />
                    : undefined}
                {activeScreen === 'owners' ?
                    <OwnerScreen />
                    : undefined}
            </div>
        </div>
    );
};

export default MainScreen;
