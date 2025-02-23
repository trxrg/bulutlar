import React, { useContext, useEffect } from 'react';
import AppHeader from './AppHeader';
import AppBody from './AppBody';
import { AppContext } from '../../store/app-context';
import { DBContext } from '../../store/db-context';
import CustomTitleBar from './custom-title-bar/CustomTitleBar';
import StreakModal from './StreakModal';

const AppScreen = () => {

    const { activeScreen, streakModalOpen, setStreakModalOpen } = useContext(AppContext);
    const { streak } = useContext(DBContext);

    // useEffect(() => {
    //     if (streak == 1 || streak == 2 || streak == 3 || streak % 5 == 1)
    //         setTimeout(() => setStreakModalOpen(true), 1500);
    // }, [streak]);

    return (
        <div className='h-screen flex flex-col mx-auto bg-[#fffffc] w-screen'>
            {/* <div className={'flex flex-shrink-0 overflow-hidden w-full'}>
                <CustomTitleBar />
            </div> */}
            <div className={activeScreen === 'tabs' || activeScreen === 'home'  ? 'hidden' : 'flex flex-shrink-0 overflow-hidden'}>
                <AppHeader />
            </div>
            <div className='flex flex-1 overflow-hidden h-full'>
                <AppBody />
            </div>
            <StreakModal isOpen={streakModalOpen} onRequestClose={() => setStreakModalOpen(false)}/>
        </div>
    );
};

export default AppScreen;