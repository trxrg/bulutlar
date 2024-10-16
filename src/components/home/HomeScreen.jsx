import React, { useContext } from 'react';
import { AppContext } from '../../store/app-context';
import ActionButton from '../common/ActionButton';

const HomeScreen = () => {

    const { setActiveScreen } = useContext(AppContext);

    return (
        <div className='flex flex-col items-center w-full h-full'>
            <h1 className='text-5xl text-stone-600 p-4'>BULUTLAR</h1>
            <div className='flex'>
                <ActionButton color='blue' onClick={() => setActiveScreen('tabs')}>Articles</ActionButton>
                <ActionButton color='blue' onClick={() => setActiveScreen('addArticle')}>Add</ActionButton>
                <ActionButton color='blue' onClick={() => setActiveScreen('categories')}>Categories</ActionButton>
                <ActionButton color='blue' onClick={() => setActiveScreen('owners')}>Owners</ActionButton>
            </div>
        </div>
    );
};

export default HomeScreen;