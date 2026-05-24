import { useContext } from 'react';
import AppHeader from './AppHeader';
import AppBody from './AppBody';
import AppFooter from './AppFooter';
import { AppContext } from '../../store/app-context';

const AppScreen = () => {
    const { activeScreen, fullScreen } = useContext(AppContext);
    const showFooter = activeScreen !== 'home' && !fullScreen;

    return (
        <div className='h-screen flex flex-col mx-auto w-screen' style={{ backgroundColor: 'var(--bg-primary)' }}>
            <div className={activeScreen === 'tabs' || activeScreen === 'home' ? 'hidden' : 'flex flex-shrink-0 overflow-hidden'}>
                <AppHeader />
            </div>
            <div className='flex flex-1 overflow-hidden h-full min-h-0'>
                <AppBody />
            </div>
            {showFooter && <AppFooter />}
        </div>
    );
};

export default AppScreen;