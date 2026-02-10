import React, { useState, useContext } from 'react';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import FormatButton from '../common/FormatButton';
import ActionButton from '../common/ActionButton';
import { AppContext } from '../../store/app-context';
import { DBContext } from '../../store/db-context';
import { articleApi, annotationApi } from '../../backend-adapter/BackendAdapter';
import toastr from 'toastr';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const AnnotationCard = ({ annotation, articleId, onUpdate, onDelete, onCancel, isAdding = false }) => {
    const { translate: t } = useContext(AppContext);
    const { fetchArticleById, fetchAllAnnotations } = useContext(DBContext);
    
    const [isEditing, setIsEditing] = useState(isAdding);
    const [noteText, setNoteText] = useState(annotation?.note || '');
    const [msg, setMsg] = useState('');

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ 
        id: isAdding ? 'new-annotation' : annotation?.id,
        disabled: isAdding || isEditing
    });

    const style = {
        transform: transform ? `translate3d(0, ${transform.y}px, 0)` : undefined,
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const handleEdit = () => {
        setIsEditing(true);
        setNoteText(annotation?.note || '');
        setMsg('');
    };

    const handleCancel = () => {
        setIsEditing(false);
        setNoteText(annotation?.note || '');
        setMsg('');
        if (isAdding) {
            onCancel && onCancel();
        }
    };

    const handleSave = async () => {
        const trimmedNote = noteText.trim();
        if (!trimmedNote) {
            setMsg(t('note') + t('cannot be empty'));
            return;
        }

        try {
            if (isAdding) {
                await articleApi.addAnnotation(articleId, { note: trimmedNote });
                toastr.success(t('note') + t('added'));
            } else {
                await annotationApi.updateNote(annotation.id, trimmedNote);
                toastr.success(t('note') + t('updated'));
            }
            
            await fetchArticleById(articleId || annotation.articleId);
            await fetchAllAnnotations();
            setIsEditing(false);
            onUpdate && onUpdate();
        } catch (error) {
            toastr.error(isAdding ? t('error adding note') : t('error updating note'));
        }
    };

    const handleDelete = () => {
        onDelete && onDelete(annotation.id);
    };

    return (
        <div 
            ref={setNodeRef}
            className={`group rounded-md border-2 pt-3 pb-2 px-2 shadow-sm ${isAdding ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/20' : ''}`}
            style={{
                borderColor: isEditing ? 'var(--border-primary)' : (isAdding ? 'var(--border-primary)' : 'var(--border-secondary)'),
                backgroundColor: isAdding ? 'var(--bg-secondary)' : 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                ...style
            }}
        >
            {isEditing ? (
                <div className="flex flex-col w-full">
                    <textarea
                        placeholder={isAdding ? t('write your note here') : ''}
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        rows="4"
                        className="w-full p-2 rounded border"
                        style={{
                            backgroundColor: 'var(--bg-primary)',
                            color: 'var(--text-primary)',
                            border: '2px solid var(--border-primary)',
                            boxShadow: '0 0 0 2px var(--border-secondary)',
                            resize: 'vertical',
                            minWidth: 0,
                        }}
                        autoFocus
                    />
                    {msg && (
                        <div className="text-red-400 text-sm p-2 bg-red-50 dark:bg-red-900/20 rounded">
                            {msg}
                        </div>
                    )}
                    <div className="flex flex-wrap justify-between items-center mt-2 gap-2 w-full">
                        {!isAdding && annotation && (
                            <div className="text-sm italic" style={{ color: 'var(--text-tertiary)' }}>
                                {t('last update')}: {new Date(annotation.updatedAt).toLocaleDateString(t('locale'))}
                            </div>
                        )}
                        <div className={`flex flex-wrap gap-2 ${isAdding ? 'justify-end' : ''}`} style={{ minWidth: 0 }}>
                            <ActionButton color="red" onClick={handleCancel}>
                                {t('cancel')}
                            </ActionButton>
                            <ActionButton onClick={handleSave}>
                                {isAdding ? t('add') : t('update')}
                            </ActionButton>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex">
                    {!isAdding && !isEditing && (
                        <div 
                            className="flex items-center pr-2 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                            {...attributes}
                            {...listeners}
                        >
                            <div className="w-1 h-8 rounded-full" style={{ backgroundColor: 'var(--text-secondary)' }}></div>
                        </div>
                    )}
                    <div className="flex-1">
                        <div style={{ whiteSpace: 'pre-line' }} className="mb-2 text-xl">
                            {annotation?.note}
                        </div>
                        <div className="flex justify-between items-center">
                            <div className="text-sm italic opacity-0 group-hover:opacity-100 transition-opacity duration-200" style={{ color: 'var(--text-tertiary)' }}>
                                {t('last update')}: {new Date(annotation.updatedAt).toLocaleDateString(t('locale'))}
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <FormatButton 
                                    onClick={handleEdit}
                                    title={t('edit note')}
                                >
                                    <PencilIcon className="w-4 h-4" />
                                </FormatButton>
                                <FormatButton 
                                    onClick={handleDelete}
                                    title={t('delete note')}
                                >
                                    <TrashIcon className="w-4 h-4" />
                                </FormatButton>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnnotationCard;