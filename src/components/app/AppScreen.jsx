import React, { useContext } from 'react';
import AppHeader from './AppHeader';
import AppBody from './AppBody';
import { AppContext } from '../../store/app-context';

const AppScreen = () => {

    const { fullScreen } = useContext(AppContext);

    return (
        <div className='h-screen flex flex-col mx-auto bg-stone-200'>
            <div className={fullScreen ? 'hidden' : 'flex flex-shrink-0 overflow-hidden'}>
                <AppHeader />
            </div>
            <div className='flex flex-1 overflow-hidden h-full'>
                <AppBody />
            </div>
        </div>
    );
};

export default AppScreen;