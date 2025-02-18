import React, { useState, useContext, useEffect } from 'react';
import GeneralModal from '../common/GeneralModal.jsx';
import ActionButton from '../common/ActionButton.jsx';
import toastr from 'toastr';
import { AppContext } from '../../store/app-context.jsx';
import { ReadContext } from '../../store/read-context.jsx';
import { DBContext } from '../../store/db-context.jsx';
import { articleApi, annotationApi } from '../../backend-adapter/BackendAdapter.js';

const AnnotationModal = ({ isOpen, onRequestClose, annotationId, articleId }) => {

    const { translate: t } = useContext(AppContext);
    // const { fontSize } = useContext(ReadContext);
    
    const { fetchArticleById, fetchAnnotationById, fetchAllAnnotations, getAnnotationById } = useContext(DBContext);

    const annotation = getAnnotationById(annotationId);
    const [note, setNote] = useState(annotation?.note || '');
    const [msg, setMsg] = useState('');
    
    const handleAdd = () => {
        if (note.trim() === '') {
            setMsg(t('note') + t('cannot be empty'));
            return;
        }
        articleApi.addAnnotation(articleId, { note }).then(() => {
            toastr.success(t('note') + t('added'));
            fetchArticleById(articleId);
            fetchAllAnnotations();
        }).catch((e) => {
            toastr.error(e.message, t('error adding note'));
        });
        onRequestClose();
    }

    const handleUpdate = () => {
        if (note.trim() === '') {
            setMsg(t('note') + t('cannot be empty'));
            return;
        }
        annotationApi.updateNote(annotation.id, note).then(() => {
            toastr.success(t('note') + t('updated'));
            fetchAnnotationById(annotation.id);
        }).catch(() => {
            toastr.error(t('error updating note'));
        });
        onRequestClose();
    }

    const handleDelete = () => {
        annotationApi.deleteById(annotation.id).then(() => {
            toastr.success(t('note') + t('deleted'));
            fetchArticleById(articleId);
            fetchAllAnnotations();
        }).catch(() => {
            toastr.error(t('error deleting note'));
        });
        onRequestClose();
    }

    useEffect(() => {
        setMsg('');
    }, [note]);

    useEffect(() => {
        setNote(annotation?.note || '');
        setMsg('');
    }, [isOpen]);

    return (
        <GeneralModal isOpen={isOpen} onRequestClose={onRequestClose} title={t('note')}>
            <div className={'flex flex-col gap-2 overflow-y-auto text-xl'}>
                {msg && <span className="text-red-400">{msg}</span>}
                <textarea
                    placeholder={t('write your note here')}
                    rows="10"
                    cols="50"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '10px',
                        boxSizing: 'border-box',
                        borderRadius: '5px',
                        border: '1px solid #111'
                    }}
                />
                {annotation ?
                    <div>
                        <div className="text-sm text-gray-500 mt-2 flex gap-5">
                            <div>{t('creation')}: {new Date(annotation.createdAt).toLocaleDateString(t('locale'))}</div>
                            <div>{t('last update')}: {new Date(annotation.updatedAt).toLocaleDateString(t('locale'))}</div>
                        </div>
                        <div className='flex justify-end gap-2 mt-4'>
                            <ActionButton color={'red'} onClick={handleDelete}>{t('delete')}</ActionButton>
                            <ActionButton color={'blue'} onClick={handleUpdate}>{t('update')}</ActionButton>
                        </div>
                    </div>
                    :
                    <div className='flex justify-end gap-2 mt-4'>
                        <ActionButton color={'red'} onClick={onRequestClose}>{t('cancel')}</ActionButton>
                        <ActionButton color={'blue'} onClick={handleAdd}>{t('add')}</ActionButton>
                    </div>
                }
            </div>
        </GeneralModal>
    );
};

export default AnnotationModal;