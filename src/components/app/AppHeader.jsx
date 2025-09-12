import React, { useContext } from 'react';
import { HomeIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

import { AppContext } from '../../store/app-context';
import FormatButton from '../common/FormatButton';
import ActionButton from '../common/ActionButton';
import ThemeToggle from '../common/ThemeToggle';

import { DBContext } from '../../store/db-context';

const AppHeader = () => {

    const { translate:t, getActiveScreenTitle, activeScreen, setActiveScreen } = useContext(AppContext);

    const { fetchAllData } = useContext(DBContext);

    const handleRefresh = async () => {
        await fetchAllData();
    }

    return (
        <div 
            className={'flex justify-between items-center py-2 px-2 border-b-4 w-full h-full'} 
            style={{ 
                borderColor: 'var(--border-primary)', 
                backgroundColor: 'var(--bg-tertiary)' 
            }}
        >
            <h1 className='text-3xl ml-2' style={{ color: 'var(--text-secondary)' }}>{getActiveScreenTitle()}</h1>
            <div className="flex justify-end items-center">
                <div className='flex gap-1'>
                    {activeScreen != 'tabs' && <ActionButton onClick={() => setActiveScreen('tabs')}>{t('all articles')}</ActionButton>}
                    <ThemeToggle />
                    <FormatButton onClick={handleRefresh} title={t('refresh')}><ArrowPathIcon className='w-5 h-5' /></FormatButton>
                    <FormatButton onClick={() => setActiveScreen('home')} title={t('homescreen')}><HomeIcon className='w-5 h-5' /></FormatButton>
                </div>
            </div>            
        </div>
    );
};

export default AppHeader;
