import React, { useContext } from 'react';
import { HomeIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

import { AppContext } from '../../store/app-context';
import FormatButton from '../common/FormatButton';
import ActionButton from '../common/ActionButton';

import { DBContext } from '../../store/db-context';

const AppHeader = () => {

    const { translate:t, getActiveScreenTitle, activeScreen, setActiveScreen } = useContext(AppContext);

    const { fetchAllData } = useContext(DBContext);

    const handleRefresh = async () => {
        await fetchAllData();
    }

    return (
        <div className={'flex justify-between items-center py-2 px-2 border-b-4 border-[#809671] bg-[#E7ECD8] w-full h-full'}>
            <h1 className='text-3xl text-gray-600 ml-2'>{getActiveScreenTitle()}</h1>
            <div className="flex justify-end items-center">
                <div className='flex gap-1'>
                    {activeScreen != 'tabs' && <ActionButton onClick={() => setActiveScreen('tabs')}>{t('all articles')}</ActionButton>}
                    <FormatButton onClick={handleRefresh} title={t('refresh')}><ArrowPathIcon className='w-5 h-5' /></FormatButton>
                    <FormatButton onClick={() => setActiveScreen('home')} title={t('homescreen')}><HomeIcon className='w-5 h-5' /></FormatButton>
                </div>
            </div>            
        </div>
    );
};

export default AppHeader;
