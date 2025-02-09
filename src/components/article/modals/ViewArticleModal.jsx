import React, { useContext } from 'react';

import GeneralModal from '../../common/GeneralModal.jsx';
import { AppContext } from '../../../store/app-context.jsx';
import { DBContext } from '../../../store/db-context.jsx';
import { ReadContext } from '../../../store/read-context.jsx';
import ActionButton from '../../common/ActionButton.jsx';
import ArticleInfo from '../ArticleInfo.jsx';

const ViewArticleModal = ({ isOpen, onRequestClose, viewedArticleId, afterViewInNewTab }) => {
    const { translate: t, handleAddTab, htmlToText } = useContext(AppContext);
    const { getArticleById } = useContext(DBContext);
    const { fontSize } = useContext(ReadContext);
    const viewedArticle = getArticleById(viewedArticleId);

    const handleViewInNewTab = (e) => {
        handleAddTab(e, viewedArticleId);
        afterViewInNewTab && afterViewInNewTab();
        onRequestClose();
    }

    return (
        <>
            {viewedArticle && <GeneralModal isOpen={isOpen} onRequestClose={onRequestClose}>
                <div className='flex-shrink-0 shadow-lg p-2'>
                    <h2 className={fontSize + " font-bold"}>{viewedArticle.title}</h2>
                    <ArticleInfo article={viewedArticle} fontSize={fontSize} isEditable={false}></ArticleInfo>
                </div>
                <div className={'flex-1 overflow-y-auto p-2 border leading-loose ' + fontSize}>
                    <article dangerouslySetInnerHTML={{ __html: viewedArticle.text }} />
                    {viewedArticle.comments && viewedArticle.comments[0] &&  htmlToText(viewedArticle.comments[0].text) &&
                        <>
                            <h3>{t('comment')}</h3>
                            <article dangerouslySetInnerHTML={{ __html: viewedArticle.comments[0].text }} />
                        </>}
                </div>
                <div className='flex-shrink-0'>
                    <div className='flex justify-end gap-2 mt-4'>
                        <ActionButton color={'blue'} onClick={handleViewInNewTab}>{t('open in new tab')}</ActionButton>
                    </div>
                </div>
            </GeneralModal >}
        </>
    );
};

export default ViewArticleModal;