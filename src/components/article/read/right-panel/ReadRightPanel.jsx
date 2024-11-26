import React, { useState, useContext } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import BodyWithFixedHeader from '../../../common/BodyWithFixedHeader';
import FormatButton from '../../../common/FormatButton';
import { AppContext } from '../../../../store/app-context';
import { DBContext } from '../../../../store/db-context';
import { ReadContext } from '../../../../store/read-context';

const ReadRightPanel = () => {

    const { translate: t } = useContext(AppContext);
    const { article } = useContext(ReadContext);

    const handleAddRelatedArticle = () => {
        console.log('add related article clicked');
    }

    return (
        <div className='h-full'>
            <BodyWithFixedHeader >
                <div className='flex flex-wrap justify-between p-2 shadow-lg'>
                    <h2 className='ml-2 text-xl font-semibold text-gray-800'>{t('related articles')}</h2>
                    <FormatButton onClick={handleAddRelatedArticle}><PlusIcon className="w-4 h-4" /></FormatButton>
                </div>
                <div className='flex justify-center p-2 h-full'>
                    <p>{t('no related articles')}</p>
                </div>
            </BodyWithFixedHeader>
        </div>
    );
};

export default ReadRightPanel;