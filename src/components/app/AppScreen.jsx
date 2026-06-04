import { useContext, useEffect } from 'react';
import toastr from 'toastr';
import AppHeader from './AppHeader';
import AppBody from './AppBody';
import AppFooter from './AppFooter';
import { AppContext } from '../../store/app-context';
import { DBContext } from '../../store/db-context';
import { SharingAdminProvider } from '../../contexts/SharingAdminContext';

const AppScreen = () => {
    const { activeScreen, fullScreen, translate: t, resetTabs } = useContext(AppContext);
    const { fetchAllData } = useContext(DBContext);
    const showFooter = activeScreen !== 'home' && !fullScreen;

    // Click-to-open: when the OS opens a .blt with the app, main.js imports it
    // and notifies us so the in-memory library reflects the new data.
    useEffect(() => {
        if (!window.api?.sharing?.onBundleImported) return;
        const offImported = window.api.sharing.onBundleImported(async (summary) => {
            try {
                await fetchAllData();
                resetTabs();
            } catch (err) {
                console.error('Refresh after bundle import failed:', err);
            }
            if (summary?.alreadyApplied) {
                toastr.info(t('bundle already imported'));
            } else {
                const count = summary?.articleCount;
                toastr.success(t('bundle imported') + (count ? ` (${count})` : ''));
            }
        });
        const offError = window.api.sharing.onBundleImportError((message) => {
            toastr.error(t('bundle import error') + (message ? `: ${message}` : ''));
        });
        return () => { offImported && offImported(); offError && offError(); };
    }, [fetchAllData, resetTabs, t]);

    return (
        <SharingAdminProvider>
        <div className='h-screen flex flex-col mx-auto w-screen' style={{ backgroundColor: 'var(--bg-primary)' }}>
            <div className={activeScreen === 'tabs' || activeScreen === 'home' ? 'hidden' : 'flex flex-shrink-0 overflow-hidden'}>
                <AppHeader />
            </div>
            <div className='flex flex-1 overflow-hidden h-full min-h-0'>
                <AppBody />
            </div>
            {showFooter && <AppFooter />}
        </div>
        </SharingAdminProvider>
    );
};

export default AppScreen;