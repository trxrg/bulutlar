import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../../store/app-context';
import { DBContext } from '../../store/db-context.jsx';
import { imageApi } from '../../backend-adapter/BackendAdapter.js';
import ActionButton from '../common/ActionButton';
import '../../styles.css';

const HomeScreen = () => {

    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageData, setImageData] = useState(null);
    const { setActiveScreen, setStreakModalOpen } = useContext(AppContext);
    const { streak, dbVersion } = useContext(DBContext);

    const fetchImageData = async () => {
        const image = {
            path: 'treasure-chest.jpg',
            type: 'image/jpeg'
        };
        try {
            const data = await imageApi.getDataByPath(image);
            setImageData(data);
            setImageLoaded(true);
        } catch (err) {
            console.error('error in fetchImageData', err);
        }
    }

    useEffect(() => { fetchImageData(); }, []);

    return (
        <div className='flex flex-col items-center w-full h-full'>
            <h1 className='text-5xl text-[#0C3B2E] p-4 select-none'>HAZINE</h1>
            {imageLoaded && <img src={imageData} alt='Bulutlar' className='w-1/2 h-auto p-4' />}
            <div className='flex gap-2'>
                <ActionButton onClick={() => setActiveScreen('tabs')}>Articles</ActionButton>
                <ActionButton onClick={() => setActiveScreen('addArticle')}>Add</ActionButton>
                <ActionButton onClick={() => setActiveScreen('categories')}>Categories</ActionButton>
                <ActionButton onClick={() => setActiveScreen('owners')}>Owners</ActionButton>
            </div>
            <div className='p-6 cursor-pointer' onClick={() => setStreakModalOpen(true)}>
                <span className='text-5xl text-green-600 font-bold'>⚡{streak}</span>
            </div>
            <div>
                <h2>db version: {dbVersion}</h2>
            </div>
        </div>
    );
};

export default HomeScreen;