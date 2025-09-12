import React, { useState, useContext } from 'react';
import { DBContext } from '../../../../store/db-context';
import { AppContext } from '../../../../store/app-context';
import { ReadContext } from '../../../../store/read-context';
import { articleApi } from '../../../../backend-adapter/BackendAdapter';
import ContextMenu from '../../../common/ContextMenu';
import ActionButton from '../../../common/ActionButton';

const RelatedArticleCard = ({ relatedArticle, onClick }) => {

    const { getCategoryByArticleId, fetchArticleById } = useContext(DBContext);
    const { translate: t } = useContext(AppContext);
    const { article } = useContext(ReadContext);
    const [contextMenuIsOpen, setContextMenuIsOpen] = useState(false);
    const [contextMenuPosition, setContextMenuPosition] = useState({ x: 10, y: 10 });
    const category = getCategoryByArticleId(relatedArticle.id);

    const handleRightClick = (e) => {
        e.preventDefault();
        const grandParentRect = e.currentTarget.getBoundingClientRect();
        const posx = e.clientX - grandParentRect.left;
        const posy = e.clientY - grandParentRect.top;
        setContextMenuIsOpen(true);
        setContextMenuPosition({ x: posx, y: posy });
    }

    const handleRemove = async () => {
        await articleApi.removeRelatedArticle(article.id, relatedArticle.id);
        fetchArticleById(article.id);
    }

    return (
        <div className='relative' onContextMenu={handleRightClick}>
            <div className='rounded-md border-2 related-article-card
        active:shadow-none shadow-xl cursor-pointer flex flex-row w-full overflow-hidden'
                style={{ 
                    borderColor: category && category.color
                }}
                onClick={onClick}>
                <h2 className="text-xl break-words p-2" style={{ color: 'var(--text-primary)' }}>{relatedArticle.title}</h2>
            </div>
            <ContextMenu isOpen={contextMenuIsOpen} onClose={() => setContextMenuIsOpen(false)} position={{ top: contextMenuPosition.y, left: contextMenuPosition.x }}>
                <div className='flex flex-col'>
                    <ActionButton onClick={handleRemove} color='red'>{t('remove')}</ActionButton>
                </div>
            </ContextMenu>
        </div>
    );
};

export default RelatedArticleCard;
