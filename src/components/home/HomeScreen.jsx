import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../../store/app-context.jsx';
import { DBContext } from '../../store/db-context.jsx';
import { imageApi } from '../../backend-adapter/BackendAdapter.js';
import ActionButton from '../common/ActionButton.jsx';
import '../../styles.css';

const HomeScreen = () => {

    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageData, setImageData] = useState(null);
    const { setActiveScreen, setStreakModalOpen, translate: t } = useContext(AppContext);
    const { streak, dbVersion } = useContext(DBContext);

    // const fetchImageData = async () => {
    //     const image = {
    //         path: 'treasure-chest.jpeg',
    //         type: 'image/jpeg'
    //     };
    //     try {
    //         const data = await imageApi.getDataByPath(image);
    //         setImageData(data);
    //         setImageLoaded(true);
    //     } catch (err) {
    //         console.error('error in fetchImageData', err);
    //     }
    // }

    // useEffect(() => { fetchImageData(); }, []);

    return (
        <div className='relative w-full h-full'>
            {/* {imageLoaded && (
                <img
                    src={imageData}
                    alt='Bulutlar'
                    className='absolute top-0 left-0 w-full h-full object-cover opacity-10'
                />
            )} */}
            <div className='relative flex flex-col items-center w-full h-full gap-5'>
                <h1 className='text-5xl text-[#0C3B2E] p-4 select-none mt-5'>HAZINE</h1>
                <div className='flex flex-col items-center gap-5'>
                    <ActionButton size={'large'} onClick={() => setActiveScreen('tabs')}>{t('start reading')}</ActionButton>
                </div>
                <div className='flex gap-2'>
                    <ActionButton onClick={() => setActiveScreen('categories')}>{t('categories')}</ActionButton>
                    <ActionButton onClick={() => setActiveScreen('owners')}>{t('owners')}</ActionButton>
                    <ActionButton onClick={() => setActiveScreen('annotations')}>{t('annotations')}</ActionButton>
                    <ActionButton onClick={() => setActiveScreen('settings')}>{t('settings')}</ActionButton>
                </div>
                <div className='cursor-pointer' onClick={() => setStreakModalOpen(true)}>
                    <span className='text-5xl text-green-600 font-bold'>⚡{streak}</span>
                </div>
                <div>
                    <h2>db version: {dbVersion}</h2>
                </div>
            </div>
        </div>
    );
};

export default HomeScreen;