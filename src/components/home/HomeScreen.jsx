import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../../store/app-context';
import { DBContext } from '../../store/db-context.jsx';
import { imageApi, lookupApi } from '../../backend-adapter/BackendAdapter.js';
import ActionButton from '../common/ActionButton';
import toastr from 'toastr';
import '../../styles.css';

const HomeScreen = () => {

    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageData, setImageData] = useState(null);
    const [dbVersion, setDbVersion] = useState(null);
    const { setActiveScreen, setStreakModalOpen } = useContext(AppContext);
    const { streak } = useContext(DBContext);

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

    const fetchDbVersion = async () => {
        try {
            const version = await lookupApi.getByLabel('db-version');
            console.log('version', version.dataValues.value);
            setDbVersion(version);
        } catch (err) {
            console.error('error in fetchDbVersion', err);
        }
    }

    useEffect(() => { fetchImageData(); fetchDbVersion() }, []);

    const handleClick = () => {
        toastr.info('This is an info message', 'Info');
    };

    return (
        <div className='flex flex-col items-center w-full h-full'>
            <h1 className='text-5xl text-[#0C3B2E] p-4 select-none'>HAZINE</h1>
            {imageLoaded && <img src={imageData} alt='Bulutlar' className='w-1/2 h-auto p-4' />}
            <div className='flex gap-2'>
                <button className='primary-button'>test</button>
                <button className='secondary-button'>test</button>
                <ActionButton onClick={handleClick}>TEST TOASTR</ActionButton>
                <ActionButton onClick={() => setActiveScreen('tabs')}>Articles</ActionButton>
                <ActionButton onClick={() => setActiveScreen('addArticle')}>Add</ActionButton>
                <ActionButton onClick={() => setActiveScreen('categories')}>Categories</ActionButton>
                <ActionButton onClick={() => setActiveScreen('owners')}>Owners</ActionButton>
                <h2>db version: {dbVersion && dbVersion.dataValues.value.value}</h2>
            </div>
            <div className='p-6 cursor-pointer' onClick={() => setStreakModalOpen(true)}>
                <span className='text-5xl text-green-600 font-bold'>⚡{streak}</span>
            </div>
        </div>
    );
};

export default HomeScreen;