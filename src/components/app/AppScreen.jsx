import { useContext } from 'react';
import AppHeader from './AppHeader';
import AppBody from './AppBody';
import { AppContext } from '../../store/app-context';

const AppScreen = () => {
    const { activeScreen } = useContext(AppContext);
    
    return (
        <div className='h-screen flex flex-col mx-auto w-screen' style={{ backgroundColor: 'var(--bg-primary)' }}>
            <div className={activeScreen === 'tabs' || activeScreen === 'home' ? 'hidden' : 'flex flex-shrink-0 overflow-hidden'}>
                <AppHeader />
            </div>
            <div className='flex flex-1 overflow-hidden h-full'>
                <AppBody />
            </div>
        </div>
    );
};

export default AppScreen;