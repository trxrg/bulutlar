import React, { useState, useContext } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import BodyWithFixedHeader from '../../../common/BodyWithFixedHeader';
import FormatButton from '../../../common/FormatButton';
import { AppContext } from '../../../../store/app-context';
import { ReadContext } from '../../../../store/read-context';
import PickArticleModal from '../../modals/PickArticleModal';
import ViewArticleModal from '../../modals/ViewArticleModal';
import RelatedArticleCard from './RelatedArticleCard';

const ReadRightPanel = () => {

    const [isPickArticleModalOpen, setIsPickArticleModalOpen] = useState(false);
    const [isViewArticleModalOpen, setIsViewArticleModalOpen] = useState(false);
    const [viewedArticleId, setViewedArticleId] = useState(null);
    const { translate: t } = useContext(AppContext);
    const { article } = useContext(ReadContext);

    const openViewArticleModal = (articleId) => {
        setViewedArticleId(articleId);
        setIsViewArticleModalOpen(true);
    }    

    return (
        <div className='h-full bg-white'>
            <BodyWithFixedHeader >
                <div className='flex flex-wrap justify-between p-2 shadow-lg'>
                    <h2 className='ml-2 text-xl font-semibold text-gray-800'>{t('related articles')}</h2>
                    <FormatButton onClick={() => setIsPickArticleModalOpen(true)}><PlusIcon className="w-4 h-4" /></FormatButton>
                </div>
                {article.relatedArticles.length > 0 ?
                    <div className='flex flex-col gap-2 p-2'>
                        {article.relatedArticles.map((relatedArticle) => <RelatedArticleCard key={relatedArticle.id} relatedArticle={relatedArticle} onClick={() => openViewArticleModal(relatedArticle.id)} />)}
                    </div>
                    :
                    <div className='flex justify-center p-2 h-full'>
                        <p>{t('no related articles')}</p>
                    </div>}
            </BodyWithFixedHeader>
            <PickArticleModal isOpen={isPickArticleModalOpen} onRequestClose={() => setIsPickArticleModalOpen(false)} articleId={article.id} onViewClicked={(id) => openViewArticleModal(id)} />
            <ViewArticleModal isOpen={isViewArticleModalOpen} onRequestClose={() => setIsViewArticleModalOpen(false)} viewedArticleId={viewedArticleId} afterViewInNewTab={()=>setIsPickArticleModalOpen(false)} ></ViewArticleModal>
        </div>
    );
};

export default ReadRightPanel;