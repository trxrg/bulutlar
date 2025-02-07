import React, { useContext } from 'react';
import TagList2 from '../../../tag/TagList2';
import BodyWithFixedHeader from '../../../common/BodyWithFixedHeader';
import { AppContext } from '../../../../store/app-context';

const TagsPanel = () => {
    const { translate: t } = useContext(AppContext);
    return (
        <div className='bg-white my-2'>
            <BodyWithFixedHeader>
                <div className='flex flex-wrap justify-between p-2 shadow-lg'>
                    <h2 className='ml-2 text-xl font-semibold text-gray-800'>{t('tags')}</h2>
                </div>
                <div className='flex mt-3'>
                    <TagList2 />
                </div>
            </BodyWithFixedHeader>
        </div>
    );
};

export default TagsPanel;