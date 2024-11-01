import React, { useContext } from 'react';
import AppHeader from './AppHeader';
import AppBody from './AppBody';
import { AppContext } from '../../store/app-context';
import CustomTitleBar from './custom-title-bar/CustomTitleBar';

const AppScreen = () => {

    const { fullScreen, activeScreen } = useContext(AppContext);

    return (
        <div className='h-screen flex flex-col mx-auto bg-stone-200 w-screen'>
            {/* <div className={'flex flex-shrink-0 overflow-hidden w-full'}>
                <CustomTitleBar />
            </div> */}
            <div className={fullScreen | activeScreen === 'home' ? 'hidden' : 'flex flex-shrink-0 overflow-hidden'}>
                <AppHeader />
            </div>
            <div className='flex flex-1 overflow-hidden h-full'>
                <AppBody />
            </div>
        </div>
    );
};

export default AppScreen;