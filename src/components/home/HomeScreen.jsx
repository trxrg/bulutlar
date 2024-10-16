import React, { useContext } from 'react';
import { AppContext } from '../../store/app-context';
import ActionButton from '../common/ActionButton';

const HomeScreen = () => {

    const { setActiveScreen } = useContext(AppContext);

    return (
        <div className='flex flex-col items-center w-full h-full'>
            <h1 className='text-5xl text-[#0C3B2E] p-4'>BULUTLAR</h1>
            <div className='flex'>
                <ActionButton onClick={() => setActiveScreen('tabs')}>Articles</ActionButton>
                <ActionButton onClick={() => setActiveScreen('addArticle')}>Add</ActionButton>
                <ActionButton onClick={() => setActiveScreen('categories')}>Categories</ActionButton>
                <ActionButton onClick={() => setActiveScreen('owners')}>Owners</ActionButton>
            </div>
        </div>
    );
};

export default HomeScreen;