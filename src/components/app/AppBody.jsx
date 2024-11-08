import React, { useContext } from 'react';

import TabsScreen from '../article/TabsScreen';
import AddArticle from '../article/AddArticle';
import CategoryScreen from '../category/CategoryScreen';
import OwnerScreen from '../owner/OwnerScreen';
import HomeScreen from '../home/HomeScreen';
import { AppContext } from '../../store/app-context';
import AnnotationScreen from '../annotation/AnnotationScreen';


const AppBody = () => {

    const { activeScreen } = useContext(AppContext);
   
    return (
        <div className='flex justify-center h-full w-full'>
            {activeScreen === 'home' ?
                <HomeScreen />
                : undefined}
            {activeScreen === 'tabs' ?
                <TabsScreen />
                : undefined}
            {activeScreen === 'addArticle' ?
                <AddArticle />
                : undefined}
            {activeScreen === 'categories' ?
                <CategoryScreen />
                : undefined}
            {activeScreen === 'owners' ?
                <OwnerScreen />
                : undefined}
            {activeScreen === 'annotations' ?
                <AnnotationScreen />
                : undefined}
        </div>
    );
};

export default AppBody;
