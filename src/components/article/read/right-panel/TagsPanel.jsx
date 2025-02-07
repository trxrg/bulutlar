import React, { useContext } from 'react';
import TagList2 from '../../../tag/TagList2';
import BodyWithFixedHeader from '../../../common/BodyWithFixedHeader';
import { AppContext } from '../../../../store/app-context';

const TagsPanel = () => {
    const { translate: t, setActiveScreen } = useContext(AppContext);

    const handleTitleClick = () => {
        setActiveScreen('tags');
    }

    return (
        <div className='bg-white my-2'>
            <BodyWithFixedHeader>
                <div className='flex flex-wrap justify-between p-2 shadow-lg'>
                    <h2 className='ml-2 text-xl font-semibold text-gray-800 cursor-pointer hover:underline' onClick={handleTitleClick}>{t('tags')}</h2>
                </div>
                <div className='flex mt-3'>
                    <TagList2 />
                </div>
            </BodyWithFixedHeader>
        </div>
    );
};

export default TagsPanel;