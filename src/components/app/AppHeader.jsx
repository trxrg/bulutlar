import React, { useContext } from 'react';
import { HomeIcon } from '@heroicons/react/24/outline';

import { AppContext } from '../../store/app-context';
import FormatButton from '../common/FormatButton';

// import { DBContext } from '../../store/db-context';
// import { dbApi } from '../../backend-adapter/BackendAdapter';


const AppHeader = () => {

    const { getActiveScreenTitle, setActiveScreen } = useContext(AppContext);
    // const { fetchAllData } = useContext(DBContext);

    // const handleLoadArticles = async () => {
    //     await dbApi.loadArticles();
    //     await fetchAllData();
    // }

    // const handleRefresh = async () => {
    //     await fetchAllData();
    // }

    return (
        <div className={'flex justify-between items-center py-2 px-2 border-b-4 border-red-300 w-full h-full'}>
            <h1 className='text-3xl text-gray-600'>{getActiveScreenTitle()}</h1>
            <div className="flex justify-end items-center">
                <div className='flex gap-2'>
                    <FormatButton onClick={() => setActiveScreen('home')}><HomeIcon className='w-5 h-5' /></FormatButton>
                    {/* <ActionButton color='blue' onClick={handleLoadArticles}>Load Articles</ActionButton> */}
                    {/* <ActionButton color='blue' onClick={handleRefresh}>Refresh</ActionButton> */}
                </div>
            </div>
        </div>
    );
};

export default AppHeader;