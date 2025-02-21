import React, { useContext } from 'react';
import { HomeIcon, GlobeAltIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

import { AppContext } from '../../store/app-context';
import FormatButton from '../common/FormatButton';
import ActionButton from '../common/ActionButton';

import { DBContext } from '../../store/db-context';
import { dbApi } from '../../backend-adapter/BackendAdapter';
import StreakModal from './StreakModal';


const AppHeader = () => {

    const { translate:t, getActiveScreenTitle, activeScreen, setActiveScreen, changeLanguage, setStreakModalOpen } = useContext(AppContext);

    const { fetchAllData, streak } = useContext(DBContext);

    // const handleLoadArticles = async () => {
    //     await dbApi.loadArticles();
    //     await fetchAllData();
    // }
    
    const handleLoadArticlesFromTxt = async () => {

        console.log('handleLoadArticlesFromTxt called');	
        await dbApi.loadArticlesFromTxt();
        await fetchAllData();
    }

    const handleRefresh = async () => {
        await fetchAllData();
    }

    return (
        <div className={'flex justify-between items-center py-2 px-2 border-b-4 border-[#809671] bg-[#E7ECD8] w-full h-full'}>
            <h1 className='text-3xl text-gray-600'>{getActiveScreenTitle()}</h1>
            <div className="flex justify-end items-center">
                <div className='flex gap-1'>
                    {/* <div className='flex items-center gap-2 mx-2 cursor-pointer' onClick={() => setStreakModalOpen(true)}>
                        <span className='text-xl text-green-600 font-bold'>⚡{streak}</span>
                    </div> */}
                    {activeScreen != 'tabs' && <ActionButton onClick={() => setActiveScreen('tabs')}>{t('articles')}</ActionButton>}
                    <FormatButton onClick={handleRefresh} title={t('refresh')}><ArrowPathIcon className='w-5 h-5' /></FormatButton>
                    <FormatButton onClick={() => changeLanguage()}><GlobeAltIcon className='w-5 h-5' /></FormatButton>
                    <FormatButton onClick={() => setActiveScreen('home')} title={t('homescreen')}><HomeIcon className='w-5 h-5' /></FormatButton>
                    {/* <ActionButton color='red' onClick={handleLoadArticlesFromTxt}>Load Articles From Txt</ActionButton> */}
                    {/* <ActionButton color='blue' onClick={handleLoadArticles}>Load Articles</ActionButton> */}
                    {/* <ActionButton color='blue' onClick={handleRefresh}>Refresh</ActionButton> */}
                </div>
            </div>            
        </div>
    );
};

export default AppHeader;
