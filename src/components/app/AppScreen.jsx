import { useContext, useEffect } from 'react';
import AppHeader from './AppHeader';
import AppBody from './AppBody';
import AppFooter from './AppFooter';
import { AppContext } from '../../store/app-context';
import { SharingAdminProvider } from '../../contexts/SharingAdminContext';
import useBundleImport from '../../hooks/useBundleImport';

const AppScreen = () => {
    const { activeScreen, fullScreen } = useContext(AppContext);
    const { requestImport, confirmModal, resultModal } = useBundleImport();
    const showFooter = activeScreen !== 'home' && !fullScreen;

    // Click-to-open: when the OS opens a .blt with the app, main.js hands the
    // path here so we can confirm before applying. Apply + refresh runs through
    // the same useBundleImport flow as the Settings button. Two cases:
    //   - already running: main pushes via 'bundle-open-request'
    //   - cold launch: we pull the queued path once on mount (the push would
    //     race our listener registration and get dropped)
    useEffect(() => {
        if (!window.api?.sharing) return;
        const off = window.api.sharing.onBundleOpenRequest?.((filePath) => {
            requestImport(filePath);
        });
        let cancelled = false;
        window.api.sharing.takePendingBlt?.()
            .then((filePath) => { if (!cancelled && filePath) requestImport(filePath); })
            .catch((err) => console.error('takePendingBlt failed:', err));
        return () => { cancelled = true; off && off(); };
    }, [requestImport]);

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
            {confirmModal}
            {resultModal}
        </div>
        </SharingAdminProvider>
    );
};

export default AppScreen;