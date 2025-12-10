import React, { useState, useContext } from 'react';
import { DBContext } from '../../../../store/db-context';
import { AppContext } from '../../../../store/app-context';
import { ReadContext } from '../../../../store/read-context';
import { articleApi } from '../../../../backend-adapter/BackendAdapter';
import ContextMenu from '../../../common/ContextMenu';
import ActionButton from '../../../common/ActionButton';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const RelatedArticleCard = ({ relatedArticle, onClick, isDisabled = false }) => {

    const { getCategoryByArticleId, fetchArticleById } = useContext(DBContext);
    const { translate: t } = useContext(AppContext);
    const { article } = useContext(ReadContext);
    const [contextMenuIsOpen, setContextMenuIsOpen] = useState(false);
    const [contextMenuPosition, setContextMenuPosition] = useState({ x: 10, y: 10 });
    const category = getCategoryByArticleId(relatedArticle.id);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ 
        id: relatedArticle.id,
        disabled: isDisabled
    });

    const style = {
        transform: transform ? `translate3d(0, ${transform.y}px, 0)` : undefined,
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const handleRightClick = (e) => {
        e.preventDefault();
        setContextMenuIsOpen(true);
        setContextMenuPosition({ x: e.clientX, y: e.clientY });
    }

    const handleRemove = async () => {
        await articleApi.removeRelatedArticle(article.id, relatedArticle.id);
        fetchArticleById(article.id);
    }

    return (
        <div 
            ref={setNodeRef}
            className="relative group"
            onContextMenu={handleRightClick}
            style={style}
        >
            <div className='rounded-lg border-2 active:shadow-none shadow-lg hover:shadow-xl flex flex-row w-full overflow-hidden transition-all duration-200 hover:scale-[1.02]'
                style={{ 
                    borderColor: category && category.color ? category.color : 'var(--border-secondary)',
                    backgroundColor: 'var(--bg-secondary)',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                }}>
                <div 
                    className="flex-1 cursor-pointer hover:bg-opacity-50 transition-colors duration-200"
                    onClick={onClick}
                    style={{ backgroundColor: 'transparent' }}
                >
                    <h2 className="text-lg font-medium break-words p-3 leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                        {relatedArticle.title}
                    </h2>
                </div>
                {!isDisabled && (
                    <div 
                        className="flex items-center px-3 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-opacity-10"
                        {...attributes}
                        {...listeners}
                        style={{ backgroundColor: 'transparent' }}
                    >
                        <div className="w-1 h-8 rounded-full" style={{ backgroundColor: 'var(--text-secondary)' }}></div>
                    </div>
                )}
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
