import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../../store/app-context.jsx';
import { DBContext } from '../../store/db-context.jsx';
import { imageApi } from '../../backend-adapter/BackendAdapter.js';
import Button from '@mui/material/Button';
import '../../styles.css';

const HomeScreen = () => {

    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageData, setImageData] = useState(null);
    const { setActiveScreen, setStreakModalOpen, translate: t } = useContext(AppContext);
    const { streak, dbVersion } = useContext(DBContext);

    const fetchImageData = async () => {
        const path = 'bg-image.jpg';
        const type = 'image/jpeg';
        try {
            const data = await imageApi.getDataByAnyPath(path, type);
            setImageData(data);
            setImageLoaded(true);
        } catch (err) {
            console.error('error in fetchImageData', err);
        }
    }

    useEffect(() => { fetchImageData(); }, []);

    return (
        <div className='relative flex w-full h-full'>
            {imageLoaded && <div className='absolute inset-0' style={{ backgroundImage: `url(${imageData})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>}
            <div className='relative flex w-full h-full'>
                <div className='w-3/4'></div>
                <div className='flex flex-col flex-shrink-0 items-center justify-center gap-5 bg-stone-100 bg-opacity-80 px-10 py-5'>
                    <h1 className='text-5xl text-[#0C3B2E] pb-8 select-none'>HAZINE</h1>
                    <div className='flex flex-col gap-5'>
                        <Button size={"large"} onClick={() => setActiveScreen('tabs')} variant="contained" color="secondary">{t('articles')}</Button>                
                        <Button size={"large"} onClick={() => setActiveScreen('categories')} variant="outlined" color='secondary'>{t('categories')}</Button>
                        <Button size={"large"} onClick={() => setActiveScreen('owners')} variant="outlined" color='secondary'>{t('owners')}</Button>
                        <Button size={"large"} onClick={() => setActiveScreen('tags')} variant="outlined" color='secondary'>{t('tags')}</Button>
                        <Button size={"large"} onClick={() => setActiveScreen('annotations')} variant="outlined" color='secondary'>{t('annotations')}</Button>
                        <Button size={"large"} onClick={() => setActiveScreen('settings')} variant="outlined" color='secondary'>{t('settings')}</Button>
                    </div>
                    {/* <div className='cursor-pointer' onClick={() => setStreakModalOpen(true)}>
                        <span className='text-5xl text-green-600 font-bold'>⚡{streak}</span>
                    </div> */}
                    <div>
                        <h2>db version: {dbVersion}</h2>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomeScreen;