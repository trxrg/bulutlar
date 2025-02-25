import React, { useContext, useEffect, useState } from 'react';
import AppHeader from './AppHeader';
import AppBody from './AppBody';
import { AppContext } from '../../store/app-context';
import { DBContext } from '../../store/db-context';
import CustomTitleBar from './custom-title-bar/CustomTitleBar';
import StreakModal from './StreakModal';
import { imageApi } from '../../backend-adapter/BackendAdapter';

const AppScreen = () => {

    const [imageLoaded, setImageLoaded] = useState(false);
    const [bgImageData, setBgImageData] = useState(null);
    const { activeScreen, streakModalOpen, setStreakModalOpen } = useContext(AppContext);
    const { streak } = useContext(DBContext);

    // useEffect(() => {
    //     if (streak == 1 || streak == 2 || streak == 3 || streak % 5 == 1)
    //         setTimeout(() => setStreakModalOpen(true), 1500);
    // }, [streak]);

    const fetchImageData = async () => {
        console.log('fetchImageData called');
        const path = 'bg-image.jpg';
        const type = 'image/jpeg';
        try {
            const data = await imageApi.getDataByAnyPath(path, type);
            setBgImageData(data);
            setImageLoaded(true);
        } catch (err) {
            console.error('error in fetchImageData', err);
        }
    }

    useEffect(() => { 
        if (!bgImageData)
            fetchImageData(); 
        else
            setImageLoaded(true);
    }, [bgImageData]);

    return (
        <div className='h-screen flex flex-col mx-auto bg-[#fffffc] w-screen'>
            {imageLoaded && activeScreen == 'home' && <div className='absolute inset-0' style={{ backgroundImage: `url(${bgImageData})`, backgroundSize: 'cover', backgroundPosition: 'center', zIndex: '0' }}></div>}
            {/* <div className={'flex flex-shrink-0 overflow-hidden w-full'}>
                <CustomTitleBar />
            </div> */}
            <div className={activeScreen === 'tabs' || activeScreen === 'home' ? 'hidden' : 'flex flex-shrink-0 overflow-hidden'}>
                <AppHeader />
            </div>
            <div className='flex flex-1 overflow-hidden h-full'>
                <AppBody />
            </div>
            <StreakModal isOpen={streakModalOpen} onRequestClose={() => setStreakModalOpen(false)} />
        </div>
    );
};

export default AppScreen;