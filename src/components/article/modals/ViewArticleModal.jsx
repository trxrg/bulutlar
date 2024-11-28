import React, { useContext } from 'react';

import GeneralModal from '../../common/GeneralModal';
import { AppContext } from '../../../store/app-context';
import { DBContext } from '../../../store/db-context.jsx';
import { ReadContext } from '../../../store/read-context.jsx';
import ActionButton from '../../common/ActionButton';
import { articleApi } from '../../../backend-adapter/BackendAdapter.js';
import ArticleInfo from '../ArticleInfo.jsx';

const PickArticleModal = ({ isOpen, onRequestClose, relatedArticleId, removeButtonVisible = false }) => {
    const { translate: t, handleAddTab } = useContext(AppContext);
    const { fetchArticleById, getArticleById } = useContext(DBContext);
    const { article } = useContext(ReadContext);
    const relatedArticle = getArticleById(relatedArticleId);

    const handleOpenInNewTab = async (e) => {
        handleAddTab(e, relatedArticleId);
        onRequestClose();
    }

    const handleRemove = async () => {
        await articleApi.removeRelatedArticle(article.id, relatedArticleId);
        fetchArticleById(article.id);
        onRequestClose();
    }

    return (
        <>
            {relatedArticle && <GeneralModal isOpen={isOpen} onRequestClose={onRequestClose}>


                <h2 className='text-xl'>{relatedArticle.title}</h2>
                <ArticleInfo article={article} isEditable={false}></ArticleInfo>
                <div>
                    <article dangerouslySetInnerHTML={{ __html: relatedArticle.text }} />
                </div>
                {relatedArticle.comments && relatedArticle.comments[0] &&
                    < div >
                        <h3>{t('comment')}</h3>
                        <article dangerouslySetInnerHTML={{ __html: relatedArticle.comments[0].text }} />
                    </div>}
                <div className='flex justify-end gap-2 mt-4'>
                    {removeButtonVisible && <ActionButton color={'red'} onClick={handleRemove}>{t('remove')}</ActionButton>}
                    <ActionButton color={'blue'} onClick={handleOpenInNewTab}>{t('open in new tab')}</ActionButton>
                </div>

            </GeneralModal >}
        </>
    );
};

export default PickArticleModal;