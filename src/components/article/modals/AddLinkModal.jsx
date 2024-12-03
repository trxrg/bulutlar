import React, { useState, useContext } from 'react';

import GeneralModal from '../../common/GeneralModal';
import { AppContext } from '../../../store/app-context';
import { ReadContext } from '../../../store/read-context.jsx';
import ActionButton from '../../common/ActionButton';
import ArticleList from '../ArticleList.jsx';
import ViewArticleModal from './ViewArticleModal.jsx';

const AddLinkModal = ({ isOpen, onRequestClose, handleAdd, title }) => {
    const [selectedArticleId, setSelectedArticleId] = useState(null);
    const [viewedArticleId, setViewedArticleId] = useState(null);
    const [isViewArticleModalOpen, setIsViewArticleModalOpen] = useState(false);

    const { translate: t, handleAddTab } = useContext(AppContext);
    const { articleId } = useContext(ReadContext);

    const handleAddClicked = () => {
        const url = "article:" + selectedArticleId;
        handleAdd(url);
    }

    const handleViewClicked = (articleId) => {
        setViewedArticleId(articleId);
        setIsViewArticleModalOpen(true);
    }

    return (
        <>
            <GeneralModal isOpen={isOpen} onRequestClose={onRequestClose} title={title}>
                <ArticleList onArticleChange={setSelectedArticleId} excludedArticleIds={[articleId]} onViewClicked={handleViewClicked} />
                <div className='flex justify-end gap-2 mt-4'>
                    <ActionButton color={'blue'} onClick={handleAddClicked}>{t('add')}</ActionButton>
                </div>
            </GeneralModal >
            <ViewArticleModal isOpen={isViewArticleModalOpen} onRequestClose={() => setIsViewArticleModalOpen(false)} viewedArticleId={viewedArticleId} afterViewInNewTab={()=>onRequestClose()} removeButtonVisible={false} ></ViewArticleModal>
        </>
    );
};

export default AddLinkModal;