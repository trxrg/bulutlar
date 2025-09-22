import React, { useContext, useState, useEffect } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import BodyWithFixedHeader from '../../common/BodyWithFixedHeader';
import FormatButton from '../../common/FormatButton';
import ConfirmModal from '../../common/ConfirmModal';
import AnnotationCard from '../../annotation/AnnotationCard';
import { AppContext } from '../../../store/app-context';
import { DBContext } from '../../../store/db-context';
import { ReadContext } from '../../../store/read-context';
import { annotationApi } from '../../../backend-adapter/BackendAdapter';
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


const ReadLeftPanel = () => {

    const { translate: t, setActiveScreen } = useContext(AppContext);
    const { getAnnotationById, fetchArticleById, fetchAllAnnotations } = useContext(DBContext);
    const { article } = useContext(ReadContext);
    const [filteredAnnotations, setFilteredAnnotations] = useState([]);
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [annotationToDelete, setAnnotationToDelete] = useState(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleNotesClick = () => {
        setActiveScreen('annotations');
    }

    const handleAddAnnotation = () => {
        setIsAddingNew(true);
    }

    const handleCancelAdd = () => {
        setIsAddingNew(false);
    }

    const handleAnnotationAdded = () => {
        setIsAddingNew(false);
    }

    const handleDeleteAnnotation = (annotationId) => {
        setAnnotationToDelete(annotationId);
        setIsDeleteModalOpen(true);
    }

    const confirmDeleteAnnotation = async () => {
        if (!annotationToDelete) return;

        try {
            await annotationApi.deleteById(annotationToDelete);
            toastr.success(t('note') + t('deleted'));
            await fetchArticleById(article.id);
            await fetchAllAnnotations();
        } catch (error) {
            toastr.error(t('error deleting note'));
        } finally {
            setIsDeleteModalOpen(false);
            setAnnotationToDelete(null);
        }
    }

    const handleDragEnd = async (event) => {
        const { active, over } = event;

        // Check if over exists and is different from active
        if (over && active.id !== over.id) {
            const oldIndex = filteredAnnotations.findIndex(annotation => annotation.id === active.id);
            const newIndex = filteredAnnotations.findIndex(annotation => annotation.id === over.id);

            // Make sure both indices are valid
            if (oldIndex !== -1 && newIndex !== -1) {
                const newOrder = arrayMove(filteredAnnotations, oldIndex, newIndex);
                setFilteredAnnotations(newOrder);

                // Update ordering in database
                try {
                    const orderings = newOrder.map((annotation, index) => ({
                        id: annotation.id,
                        ordering: index
                    }));
                    await annotationApi.updateOrderings(orderings);
                } catch (error) {
                    console.error('Error updating annotation orderings:', error);
                    toastr.error(t('error updating order'));
                    // Revert the local state on error
                    await fetchArticleById(article.id);
                    await fetchAllAnnotations();
                }
            }
        }
    }

    useEffect(() => {
        // Get full annotation data from cache, but preserve the order from article.annotations
        const annotationMap = new Map();
        article.annotations.forEach(ann => {
            const fullAnnotation = getAnnotationById(ann.id);
            if (fullAnnotation) {
                annotationMap.set(ann.id, fullAnnotation);
            }
        });
        
        const filtered = article.annotations
            .map(ann => annotationMap.get(ann.id))
            .filter(annotation => annotation && annotation.note && annotation.note.trim().length > 0);
        
        setFilteredAnnotations(filtered);
    }, [article, getAnnotationById]);


    return (
        <div className='h-full'>
            <BodyWithFixedHeader>
                <div className='flex flex-wrap justify-between p-2 shadow-lg items-center' style={{ backgroundColor: 'var(--bg-secondary)' }}>
                    <h2
                        className='ml-2 text-xl font-semibold hover:underline cursor-pointer'
                        style={{ color: 'var(--text-primary)' }}
                        onClick={handleNotesClick}
                    >
                        {t('notes')}
                    </h2>
                    <FormatButton onClick={handleAddAnnotation} title={t('add note')}>
                        <PlusIcon className="w-5 h-5" />
                    </FormatButton>
                </div>

                <div className="flex flex-col gap-2 p-2 h-full overflow-y-auto overflow-x-hidden">
                    {/* Add new note form */}
                    {isAddingNew && (
                        <AnnotationCard
                            articleId={article.id}
                            isAdding={true}
                            onUpdate={handleAnnotationAdded}
                            onCancel={handleCancelAdd}
                        />
                    )}

                    {/* Existing annotations */}
                    {filteredAnnotations.length > 0 ? (
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext items={filteredAnnotations.map(ann => ann.id).filter(id => id)} strategy={verticalListSortingStrategy}>
                                {filteredAnnotations.map((annotation) => (
                                    <AnnotationCard
                                        key={annotation.id}
                                        annotation={annotation}
                                        articleId={article.id}
                                        onUpdate={() => { }}
                                        onDelete={handleDeleteAnnotation}
                                    />
                                ))}
                            </SortableContext>
                        </DndContext>
                    ) : !isAddingNew && (
                        <div className='flex justify-center items-center h-full'>
                            <p style={{ color: 'var(--text-secondary)' }}>{t('no notes')}</p>
                        </div>
                    )}
                </div>
            </BodyWithFixedHeader>
            <ConfirmModal
                message={t('confirm delete note')}
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDeleteAnnotation}
            />
        </div>
    );
};

export default ReadLeftPanel;