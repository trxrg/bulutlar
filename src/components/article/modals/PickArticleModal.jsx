import React, { useState, useContext, useEffect } from 'react';

import GeneralModal from '../../common/GeneralModal';
import { AppContext } from '../../../store/app-context';
import { DBContext } from '../../../store/db-context.jsx';
import ActionButton from '../../common/ActionButton';
import ArticleList from '../ArticleList.jsx';
import { articleApi } from '../../../backend-adapter/BackendAdapter.js';

const PickArticleModal = ({ isOpen, onRequestClose, articleId, onViewClicked }) => {
    const [selectedArticleId, setSelectedArticleId] = useState(null);
    const { translate: t } = useContext(AppContext);
    const { fetchArticleById, getRelatedArticlesByArticleId } = useContext(DBContext);

    const handleAdd = async () => {
        await articleApi.addRelatedArticle(articleId, selectedArticleId);
        fetchArticleById(articleId);
        onRequestClose();
    }

    const handleViewClicked = (articleId) => {
        onViewClicked(articleId);
    }

    const relatedArticles = getRelatedArticlesByArticleId(articleId);

    return (
        <GeneralModal isOpen={isOpen} onRequestClose={onRequestClose} title={t('add related article')}>

            <ArticleList onArticleChange={setSelectedArticleId} excludedArticleIds={[articleId, ...relatedArticles.map(art => art.id)]} onViewClicked={handleViewClicked}/>
            <div className='flex justify-end gap-2 mt-4'>
                <ActionButton color={'blue'} onClick={handleAdd}>{t('add')}</ActionButton>
            </div>

        </GeneralModal >
    );
};

export default PickArticleModal;