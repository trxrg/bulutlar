import React, { useContext } from 'react';

import GeneralModal from '../../common/GeneralModal';
import { AppContext } from '../../../store/app-context';
import { DBContext } from '../../../store/db-context.jsx';
import { ReadContext } from '../../../store/read-context.jsx';
import ActionButton from '../../common/ActionButton';
import { articleApi } from '../../../backend-adapter/BackendAdapter.js';
import ArticleInfo from '../ArticleInfo.jsx';

const ViewArticleModal = ({ isOpen, onRequestClose, viewedArticleId, handleViewInNewTab, removeButtonVisible = false }) => {
    const { translate: t } = useContext(AppContext);
    const { fetchArticleById, getArticleById } = useContext(DBContext);
    const { article } = useContext(ReadContext);
    const viewedArticle = getArticleById(viewedArticleId);

    const handleRemove = async () => {
        await articleApi.removeRelatedArticle(article.id, viewedArticleId);
        fetchArticleById(article.id);
        onRequestClose();
    }

    return (
        <>
            {viewedArticle && <GeneralModal isOpen={isOpen} onRequestClose={onRequestClose}>
                <div className='flex-shrink-0'>
                    <h2 className='text-xl'>{viewedArticle.title}</h2>
                    <ArticleInfo article={article} isEditable={false}></ArticleInfo>
                </div>
                <div className='flex-1 overflow-y-auto'>
                    <article dangerouslySetInnerHTML={{ __html: viewedArticle.text }} />
                    {viewedArticle.comments && viewedArticle.comments[0] &&
                        <>
                            <h3>{t('comment')}</h3>
                            <article dangerouslySetInnerHTML={{ __html: viewedArticle.comments[0].text }} />
                        </>}
                </div>
                <div className='flex-shrink-0'>
                    <div className='flex justify-end gap-2 mt-4'>
                        {removeButtonVisible && <ActionButton color={'red'} onClick={handleRemove}>{t('remove')}</ActionButton>}
                        <ActionButton color={'blue'} onClick={handleViewInNewTab}>{t('open in new tab')}</ActionButton>
                    </div>
                </div>
            </GeneralModal >}
        </>
    );
};

export default ViewArticleModal;