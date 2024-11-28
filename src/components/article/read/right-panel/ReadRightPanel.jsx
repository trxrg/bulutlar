import React, { useState, useContext } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import BodyWithFixedHeader from '../../../common/BodyWithFixedHeader';
import FormatButton from '../../../common/FormatButton';
import { AppContext } from '../../../../store/app-context';
import { DBContext } from '../../../../store/db-context';
import { ReadContext } from '../../../../store/read-context';
import PickArticleModal from '../../modals/PickArticleModal';
import ViewArticleModal from '../../modals/ViewArticleModal';
import RelatedArticleCard from './RelatedArticleCard';
import { set } from 'draft-js/lib/DefaultDraftBlockRenderMap';

const ReadRightPanel = () => {

    const [isPickArticleModalOpen, setIsPickArticleModalOpen] = useState(false);
    const [isViewArticleModalOpen, setIsViewArticleModalOpen] = useState(false);
    const [relatedArticleId, setRelatedArticleId] = useState(null);
    const [removeButtonVisible, setRemoveButtonVisible] = useState(false);
    const { translate: t } = useContext(AppContext);
    const { article } = useContext(ReadContext);

    const handleAddRelatedArticle = () => {
        setIsPickArticleModalOpen(true);
    }

    const openViewArticleModal = (articleId) => {
        setRelatedArticleId(articleId);
        setIsViewArticleModalOpen(true);
    }

    const handleRelatedArticleCardClick = (articleId) => {
        setRemoveButtonVisible(true);
        openViewArticleModal(articleId);
    }

    const handleViewClicked = (articleId) => {
        setRemoveButtonVisible(false);
        openViewArticleModal(articleId);
    }

    return (
        <div className='h-full bg-white'>
            <BodyWithFixedHeader >
                <div className='flex flex-wrap justify-between p-2 shadow-lg'>
                    <h2 className='ml-2 text-xl font-semibold text-gray-800'>{t('related articles')}</h2>
                    <FormatButton onClick={handleAddRelatedArticle}><PlusIcon className="w-4 h-4" /></FormatButton>
                </div>
                {article.relatedArticles.length > 0 ?
                    <div className='flex flex-col gap-2 p-2'>
                        {article.relatedArticles.map((relatedArticle) => <RelatedArticleCard key={relatedArticle.id} article={relatedArticle} onClick={handleRelatedArticleCardClick} />)}
                    </div>
                    :
                    <div className='flex justify-center p-2 h-full'>
                        <p>{t('no related articles')}</p>
                    </div>}
            </BodyWithFixedHeader>
            <PickArticleModal isOpen={isPickArticleModalOpen} onRequestClose={() => setIsPickArticleModalOpen(false)} articleId={article.id} onViewClicked={handleViewClicked} />
            <ViewArticleModal isOpen={isViewArticleModalOpen} onRequestClose={() => setIsViewArticleModalOpen(false)} relatedArticleId={relatedArticleId} removeButtonVisible={removeButtonVisible} ></ViewArticleModal>
        </div>
    );
};

export default ReadRightPanel;