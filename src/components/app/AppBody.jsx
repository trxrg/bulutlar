import React, { useContext } from 'react';

import TabsScreen from '../article/TabsScreen';
import AddArticle from '../article/AddArticle';
import CategoryScreen from '../category/CategoryScreen';
import OwnerScreen from '../owner/OwnerScreen';
import HomeScreen from '../home/HomeScreen';
import { AppContext } from '../../store/app-context';
import AnnotationScreen from '../annotation/AnnotationScreen';
import SettingsScreen from '../settings/SettingsScreen';
import TagScreen from '../tag/TagScreen';
import QuoteScreen from '../annotation/QuoteScreen';
import GroupScreen from '../group/GroupScreen';


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
            {activeScreen === 'groups' ?
                <GroupScreen />
                : undefined}
            {activeScreen === 'owners' ?
                <OwnerScreen />
                : undefined}
            {activeScreen === 'tags' ?
                <TagScreen />
                : undefined}
            {activeScreen === 'annotations' ?
                <AnnotationScreen />
                : undefined}
            {activeScreen === 'quotes' ?
                <QuoteScreen />
                : undefined}
            {activeScreen === 'settings' ?
                <SettingsScreen />
                : undefined}
        </div>
    );
};

export default AppBody;
