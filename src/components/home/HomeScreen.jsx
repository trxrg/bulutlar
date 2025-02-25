import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../../store/app-context.jsx';
import { DBContext } from '../../store/db-context.jsx';
import { imageApi } from '../../backend-adapter/BackendAdapter.js';
import Button from '@mui/material/Button';
import '../../styles.css';

const HomeScreen = () => {

    const [imageLoaded, setImageLoaded] = useState(false);
    const { setActiveScreen, setStreakModalOpen, translate: t, bgImageData, setBgImageData } = useContext(AppContext);
    const { streak, dbVersion } = useContext(DBContext);

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

    // useEffect(() => { 
    //     if (!bgImageData)
    //         fetchImageData(); 
    //     else
    //         setImageLoaded(true);
    // }, [bgImageData]);

    const primaryButtonProps = {
        variant: 'contained',
        color: 'primary',
        style: { fontFamily: '"Trebuchet MS", sans-serif', fontWeight: 'bold', fontSize: '1.2rem' }
    };
    const secondaryButtonProps = {
        variant: 'outlined',
        color: 'primary',
        style: { fontFamily: '"Trebuchet MS", sans-serif', fontWeight: 'bold', fontSize: '1.2rem' }
    };

    return (
        <div className='relative flex w-full h-full' style={{ fontFamily: '"Trebuchet MS", sans-serif' }}>
            {/* {imageLoaded && <div className='absolute inset-0' style={{ backgroundImage: `url(${bgImageData})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>} */}
            <div className='relative flex w-full h-full'>
                <div className='w-3/4'></div>
                <div className='flex flex-col flex-shrink-0 items-center justify-center gap-5 bg-stone-100 bg-opacity-80 px-20 py-10'>
                    <h1 className='text-6xl text-blue-900 pb-10 select-none'>bulutlar</h1>
                    <div className='flex flex-col gap-3'>
                        <Button size="large" onClick={() => setActiveScreen('tabs')} {...primaryButtonProps}>{t('all articles')}</Button>
                        <Button size="large" onClick={() => setActiveScreen('categories')} {...primaryButtonProps}>{t('categories')}</Button>
                        <Button size="large" onClick={() => setActiveScreen('groups')} {...primaryButtonProps}>{t('groups')}</Button>
                        <div className='flex flex-row gap-3 min-w-full'>
                            <div className='flex flex-col gap-3'>
                                <Button size="large" onClick={() => setActiveScreen('owners')} {...secondaryButtonProps}>{t('owners')}</Button>
                                <Button size="large" onClick={() => setActiveScreen('tags')} {...secondaryButtonProps}>{t('tags')}</Button>
                            </div>
                            <div className='flex flex-col gap-3'>
                                <Button size="large" onClick={() => setActiveScreen('annotations')} {...secondaryButtonProps}>{t('annotations')}</Button>
                                <Button size="large" onClick={() => setActiveScreen('quotes')} {...secondaryButtonProps}>{t('quotes')}</Button>
                            </div>
                        </div>
                        <Button size="large" onClick={() => setActiveScreen('settings')} {...secondaryButtonProps}>{t('settings')}</Button>
                    </div>
                    {/* <div className='cursor-pointer' onClick={() => setStreakModalOpen(true)}>
                        <span className='text-5xl text-green-600 font-bold'>⚡{streak}</span>
                    </div> */}
                    <div>
                        <h2 className='text-l'>db version: {dbVersion}</h2>
                    </div>
                    <div>
                        <h2 className='text-l'>app version: 1.2.0</h2>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomeScreen;