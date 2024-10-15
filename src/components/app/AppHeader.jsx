import React, { useContext } from 'react';

import TabsScreen from '../article/TabsScreen';
import AddArticle from '../article/AddArticle';
import CategoryScreen from '../category/CategoryScreen';
import OwnerScreen from '../owner/OwnerScreen';
import ActionButton from '../common/ActionButton';

import { AppContext } from '../../store/app-context';
import { DBContext } from '../../store/db-context';

import { dbApi } from '../../backend-adapter/BackendAdapter';


const AppHeader = () => {

    const { handleAddArticle, handleCancel, activeScreen, setActiveScreen, fullScreen } = useContext(AppContext);
    const { fetchAllData } = useContext(DBContext);

    const handleRandom = () => {
        console.log('random clicked');
    }

    const handleLoadArticles = async () => {
        await dbApi.loadArticles();
        await fetchAllData();
    }

    const handleRefresh = async () => {
        await fetchAllData();
    }

    return (
        <div className={'flex justify-between items-center p-4 border-b-4 border-red-300 w-full h-full'}>
            <h1 className='text-5xl text-gray-600'>BULUTLAR</h1>
            <div className="flex justify-end items-center">
                <div className='h-2/3'>
                    {activeScreen === 'tabs' ?
                        <div className='flex gap-2'>
                            <ActionButton color='blue' onClick={() => setActiveScreen('owners')}>Owners</ActionButton>
                            <ActionButton color='blue' onClick={() => setActiveScreen('categories')}>Categories</ActionButton>
                            <ActionButton color='blue' onClick={handleRandom}>Random</ActionButton>
                            <ActionButton color='blue' onClick={handleAddArticle}>Add Article</ActionButton>
                            <ActionButton color='blue' onClick={handleLoadArticles}>Load Articles</ActionButton>
                            <ActionButton color='blue' onClick={handleRefresh}>Refresh</ActionButton>
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
    );
};

export default AppHeader;
