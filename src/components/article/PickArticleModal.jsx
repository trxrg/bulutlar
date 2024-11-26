import React, { useState, useContext, useEffect } from 'react';

import GeneralModal from '../common/GeneralModal';
import { AppContext } from '../../store/app-context';
import ActionButton from '../common/ActionButton';
import ArticleList from './ArticleList.jsx';
import { articleApi } from '../../backend-adapter/BackendAdapter.js';

const PickArticleModal = ({ isOpen, onRequestClose, articleId }) => {
    const [selectedArticleId, setSelectedArticleId] = useState(null);
    const { translate: t } = useContext(AppContext);

    const handleAdd = () => {
        articleApi.addRelatedArticle(articleId, selectedArticleId);        
        onRequestClose();
    }

    return (
        <GeneralModal isOpen={isOpen} onRequestClose={onRequestClose} title={t('add related article')}>

            <ArticleList onArticleChange={setSelectedArticleId} excludedArticleId={articleId}/>
            <div className='flex justify-end gap-2 mt-4'>
                <ActionButton color={'blue'} onClick={handleAdd}>{t('add')}</ActionButton>
                <ActionButton color={'red'} onClick={onRequestClose}>{t('cancel')}</ActionButton>
            </div>

        </GeneralModal >
    );
};

export default PickArticleModal;