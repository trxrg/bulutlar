import React, { useContext, useState } from 'react';
import TagList2 from '../../../tag/TagList2';
import { PlusIcon } from '@heroicons/react/24/outline';
import BodyWithFixedHeader from '../../../common/BodyWithFixedHeader';
import FormatButton from '../../../common/FormatButton';
import { AppContext } from '../../../../store/app-context';

const TagsPanel = () => {
    const { translate: t, setActiveScreen } = useContext(AppContext);
    const [adding, setAdding] = useState(false);

    const handleTitleClick = () => {
        setActiveScreen('tags');
    }

    return (
        <div className='border-t-4 border-[#809671] h-full'>
            <BodyWithFixedHeader>
                <div className='flex flex-wrap justify-between p-2 shadow-lg bg-white items-center'>
                    <h2 className='ml-2 text-xl font-semibold text-gray-800 cursor-pointer hover:underline' onClick={handleTitleClick}>{t('tags')}</h2>
                    <FormatButton onClick={() => setAdding(prev => !prev)} title={t('add tag')}><PlusIcon className="w-5 h-5" /></FormatButton>
                </div>
                <div className='flex'>
                    <TagList2 showInput={adding} />
                </div>
            </BodyWithFixedHeader>
        </div>
    );
};

export default TagsPanel;