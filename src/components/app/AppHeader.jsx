import React, { useContext } from 'react';
import { HomeIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import toastr from 'toastr';

import { AppContext } from '../../store/app-context';
import FormatButton from '../common/FormatButton';
import ActionButton from '../common/ActionButton';
import ThemeToggle from '../common/ThemeToggle';

import { DBContext } from '../../store/db-context';

const AppHeader = () => {

    const { translate:t, getActiveScreenTitle, activeScreen, setActiveScreen } = useContext(AppContext);

    const { fetchAllData } = useContext(DBContext);

    const handleRefresh = async () => {
        // Reap orphan media rows (DB rows whose backing file is gone) before
        // we re-pull data into the renderer caches. Failure here is
        // non-fatal: the user clicked refresh expecting their data to
        // refresh, so we still call fetchAllData even if reap blew up.
        try {
            const reapApi = window.api && window.api.maintenance && window.api.maintenance.reapOrphanMedia;
            if (reapApi) {
                const r = await reapApi();
                const reaped = (r?.images?.reaped || 0)
                    + (r?.audios?.reaped || 0)
                    + (r?.videos?.reaped || 0);
                if (reaped > 0) {
                    toastr.warning(t('reaped n orphan media', { count: reaped }));
                }
            }
        } catch (err) {
            console.error('reapOrphanMedia failed:', err);
            toastr.error(t('reap orphan media failed'));
        }

        await fetchAllData();
    }

    return (
        <div 
            className='app-header flex justify-between items-center py-2 px-2 border-b-4 w-full h-full' 
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
