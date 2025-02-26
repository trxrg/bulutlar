import React, { useContext, useEffect, useState } from 'react';
import AppHeader from './AppHeader';
import AppBody from './AppBody';
import { AppContext } from '../../store/app-context';
import { imageApi } from '../../backend-adapter/BackendAdapter';

const AppScreen = () => {

    const [imageLoaded, setImageLoaded] = useState(false);
    const [bgImageData, setBgImageData] = useState(null);
    const { activeScreen } = useContext(AppContext);
    
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