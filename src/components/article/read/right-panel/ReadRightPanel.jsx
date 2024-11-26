import React, { useState, useContext } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import BodyWithFixedHeader from '../../../common/BodyWithFixedHeader';
import FormatButton from '../../../common/FormatButton';
import { AppContext } from '../../../../store/app-context';
import { DBContext } from '../../../../store/db-context';
import { ReadContext } from '../../../../store/read-context';
import PickArticleModal from '../../PickArticleModal';

const ReadRightPanel = () => {

    const [isPickArticleModalOpen, setIsPickArticleModalOpen] = useState(false);
    const { translate: t } = useContext(AppContext);
    const { article } = useContext(ReadContext);

    const handleAddRelatedArticle = () => {
        setIsPickArticleModalOpen(true);
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
            <PickArticleModal isOpen={isPickArticleModalOpen} onRequestClose={()=>setIsPickArticleModalOpen(false)} articleId={article.id}/>
        </div>
    );
};

export default ReadRightPanel;