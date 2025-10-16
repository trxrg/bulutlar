import React, { useState, useContext, useEffect } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import BodyWithFixedHeader from '../../../common/BodyWithFixedHeader';
import FormatButton from '../../../common/FormatButton';
import { AppContext } from '../../../../store/app-context';
import { ReadContext } from '../../../../store/read-context';
import { DBContext } from '../../../../store/db-context';
import PickAndViewArticleModal from '../../modals/PickAndViewArticleModal';
import RelatedArticleCard from './RelatedArticleCard';
import { articleApi } from '../../../../backend-adapter/BackendAdapter';
import toastr from 'toastr';

import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';

const RelatedArticlesPanel = () => {

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // 'add' or 'view'
    const [viewedArticleId, setViewedArticleId] = useState(null);
    const [localRelatedArticles, setLocalRelatedArticles] = useState([]);
    const { translate: t } = useContext(AppContext);
    const { article } = useContext(ReadContext);
    const { fetchArticleById } = useContext(DBContext);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Sync local state with article's related articles
    useEffect(() => {
        setLocalRelatedArticles(article.relatedArticles || []);
    }, [article.relatedArticles]);

    const openAddModal = () => {
        setModalMode('add');
        setViewedArticleId(null);
        setIsModalOpen(true);
    }

    const openViewModal = (articleId) => {
        setModalMode('view');
        setViewedArticleId(articleId);
        setIsModalOpen(true);
    }

    const handleDragEnd = async (event) => {
        const { active, over } = event;

        // Check if over exists and is different from active
        if (over && active.id !== over.id) {
            const oldIndex = localRelatedArticles.findIndex(relatedArticle => relatedArticle.id === active.id);
            const newIndex = localRelatedArticles.findIndex(relatedArticle => relatedArticle.id === over.id);

            // Make sure both indices are valid
            if (oldIndex !== -1 && newIndex !== -1) {
                const newOrder = arrayMove(localRelatedArticles, oldIndex, newIndex);

                // Update local state immediately for smooth UI
                setLocalRelatedArticles(newOrder);

                // Update ordering in database
                try {
                    const orderings = newOrder.map((relatedArticle, index) => ({
                        relatedArticleId: relatedArticle.id,
                        ordering: index
                    }));
                    await articleApi.updateRelatedArticleOrderings(article.id, orderings);

                    // Refresh the article to get the updated order from database
                    await fetchArticleById(article.id);
                } catch (error) {
                    console.error('Error updating related article orderings:', error);
                    toastr.error(t('error updating order'));
                    // Revert local state on error
                    await fetchArticleById(article.id);
                }
            }
        }
    }

    return (
        <div className='h-full'>
            <BodyWithFixedHeader >
                <div className='flex flex-wrap justify-between p-2 shadow-lg bg-white items-center'>
                    <h2 className='ml-2 text-xl font-semibold text-gray-800'>{t('related articles')}</h2>
                    <FormatButton onClick={openAddModal} title={t('add related article')}><PlusIcon className="w-5 h-5" /></FormatButton>
                </div>
                {localRelatedArticles.length > 0 ?
                    <div className="flex flex-col gap-2 p-2 h-full overflow-y-auto overflow-x-hidden">
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext items={localRelatedArticles.map(rel => rel.id).filter(id => id)} strategy={verticalListSortingStrategy}>
                                {localRelatedArticles.map((relatedArticle) => (
                                    <RelatedArticleCard
                                        key={relatedArticle.id}
                                        relatedArticle={relatedArticle}
                                        onClick={() => openViewModal(relatedArticle.id)}
                                    />
                                ))}
                            </SortableContext>
                        </DndContext>
                    </div>
                    :
                    <div className='h-full p-2'>
                        <div className='flex items-start p-2' style={{ color: 'var(--text-secondary)' }}>
                            <p>{t('no related articles')}</p>
                        </div>
                    </div>}
            </BodyWithFixedHeader>
            <PickAndViewArticleModal 
                isOpen={isModalOpen} 
                onRequestClose={() => setIsModalOpen(false)} 
                articleId={article.id} 
                title={modalMode === 'add' ? t('add related article') : t('related article')}
                showSelect={modalMode === 'add'}
                initialArticleId={modalMode === 'view' ? viewedArticleId : null}
                onAdd={modalMode === 'add' ? async (selectedArticleId) => {
                    await articleApi.addRelatedArticle(article.id, selectedArticleId);
                    fetchArticleById(article.id);
                } : undefined}
            />
        </div>
    );
};

export default RelatedArticlesPanel;