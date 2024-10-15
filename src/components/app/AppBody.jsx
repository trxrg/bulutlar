import React, { useContext } from 'react';

import TabsScreen from '../article/TabsScreen';
import AddArticle from '../article/AddArticle';
import CategoryScreen from '../category/CategoryScreen';
import OwnerScreen from '../owner/OwnerScreen';
import { AppContext } from '../../store/app-context';


const AppBody = () => {

    const { activeScreen } = useContext(AppContext);
   
    return (
        <div className='flex px-5 justify-center h-full w-full'>
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
        </div>
    );
};

export default AppBody;
