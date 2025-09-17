import React, { useState, useContext } from 'react';
import GeneralModal from '../../common/GeneralModal.jsx';
import ActionButton from '../../common/ActionButton.jsx';
import { AppContext } from '../../../store/app-context.jsx';
import { DBContext } from '../../../store/db-context.jsx';
import Checkbox from '@mui/material/Checkbox';
import toastr from 'toastr';
import { articleApi } from '../../../backend-adapter/BackendAdapter.js';

const ExportModal = ({ isOpen, onRequestClose, article }) => {
    const { translate: t } = useContext(AppContext);
    const { getAnnotationById, getTagById, getArticleById, getCategoryById, getOwnerById, getGroupById } = useContext(DBContext);

    const [exportOptions, setExportOptions] = useState({
        explanation: true,
        mainText: true,
        comment: true,
        images: true,
        notes: true,
        tags: true,
        relatedArticles: true,
        collections: true,
        format: 'pdf'
    });

    const handleOptionChange = (option) => {
        setExportOptions(prev => ({
            ...prev,
            [option]: !prev[option]
        }));
    };

    const handleFormatChange = (format) => {
        setExportOptions(prev => ({
            ...prev,
            format
        }));
    };

    const handleExport = async () => {
        try {
            // Prepare the article data with all related information
            // Resolve IDs to full objects
            const fullAnnotations = article.annotations ? article.annotations.map(ann => 
                typeof ann === 'object' && ann.note !== undefined ? ann : getAnnotationById(ann.id || ann)
            ).filter(Boolean) : [];
            
            const fullTags = article.tags ? article.tags.map(tag => 
                typeof tag === 'object' && tag.name !== undefined ? tag : getTagById(tag.id || tag)
            ).filter(Boolean) : [];
            
            const fullCollections = article.groups ? article.groups.map(group => 
                typeof group === 'object' && group.name !== undefined ? group : getGroupById(group.id || group)
            ).filter(Boolean) : [];

            const exportData = {
                article: article,
                options: exportOptions,
                // Get annotations (notes) - resolve to full objects
                annotations: fullAnnotations,
                // Get tags - resolve to full objects
                tags: fullTags,
                // Get related articles
                relatedArticles: article.relatedArticles || [],
                // Get collections (groups) - resolve to full objects
                collections: fullCollections,
                // Get category and owner info
                category: article.categoryId ? getCategoryById(article.categoryId) : null,
                owner: article.ownerId ? getOwnerById(article.ownerId) : null,
                // Add translations
                translations: {
                    comment: t('comment'),
                    images: t('images'),
                    notes: t('notes'),
                    tags: t('tags'),
                    relatedArticles: t('related articles'),
                    collections: t('collections'),
                    minRead: t('min read'),
                    minsRead: t('mins read'),
                    sunday: t('sunday'),
                    monday: t('monday'),
                    tuesday: t('tuesday'),
                    wednesday: t('wednesday'),
                    thursday: t('thursday'),
                    friday: t('friday'),
                    saturday: t('saturday')
                }
            };

            const result = await articleApi.exportArticle(exportData);
            
            if (result.success) {
                toastr.success(t('article exported successfully'));
                onRequestClose();
            } else {
                toastr.error(t('export failed'));
            }
        } catch (error) {
            console.error('Export error:', error);
            toastr.error(t('export failed'));
        }
    };

    const isHtmlStringEmpty = (htmlString) => {
        if (!htmlString) return true;
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlString;
        return !tempDiv.textContent.trim();
    };

    return (
        <GeneralModal
            isOpen={isOpen}
            onRequestClose={onRequestClose}
            title={t('export article')}
        >
            <div className='flex flex-col gap-4 mb-4'>
                {/* Text Content Section */}
                <div className='mb-4'>
                    <h3 className='text-lg font-semibold mb-2' style={{ color: 'var(--text-primary)' }}>
                        {t('text content')}:
                    </h3>
                    <div className='grid grid-cols-2 gap-2'>
                        {/* Explanation */}
                        <label className='flex items-center gap-2 cursor-pointer'>
                            <Checkbox
                                checked={exportOptions.explanation}
                                onChange={() => handleOptionChange('explanation')}
                                size="small"
                                disabled={isHtmlStringEmpty(article.explanation)}
                            />
                            <span style={{ color: isHtmlStringEmpty(article.explanation) ? 'var(--text-tertiary)' : 'var(--text-primary)' }}>
                                {t('explanation')} {isHtmlStringEmpty(article.explanation) && '(empty)'}
                            </span>
                        </label>

                        {/* Main Text */}
                        <label className='flex items-center gap-2 cursor-pointer'>
                            <Checkbox
                                checked={exportOptions.mainText}
                                onChange={() => handleOptionChange('mainText')}
                                size="small"
                                disabled={isHtmlStringEmpty(article.text)}
                            />
                            <span style={{ color: isHtmlStringEmpty(article.text) ? 'var(--text-tertiary)' : 'var(--text-primary)' }}>
                                {t('main text')} {isHtmlStringEmpty(article.text) && '(empty)'}
                            </span>
                        </label>

                        {/* Comment */}
                        <label className='flex items-center gap-2 cursor-pointer'>
                            <Checkbox
                                checked={exportOptions.comment}
                                onChange={() => handleOptionChange('comment')}
                                size="small"
                                disabled={!article.comments || article.comments.length === 0 || isHtmlStringEmpty(article.comments[0]?.text)}
                            />
                            <span style={{ color: (!article.comments || article.comments.length === 0 || isHtmlStringEmpty(article.comments[0]?.text)) ? 'var(--text-tertiary)' : 'var(--text-primary)' }}>
                                {t('comment')} {(!article.comments || article.comments.length === 0 || isHtmlStringEmpty(article.comments[0]?.text)) && '(empty)'}
                            </span>
                        </label>

                        {/* Images */}
                        <label className='flex items-center gap-2 cursor-pointer'>
                            <Checkbox
                                checked={exportOptions.images}
                                onChange={() => handleOptionChange('images')}
                                size="small"
                                disabled={!article.images || article.images.length === 0}
                            />
                            <span style={{ color: (!article.images || article.images.length === 0) ? 'var(--text-tertiary)' : 'var(--text-primary)' }}>
                                {t('images')} {(!article.images || article.images.length === 0) && '(none)'}
                            </span>
                        </label>

                        {/* Notes */}
                        <label className='flex items-center gap-2 cursor-pointer'>
                            <Checkbox
                                checked={exportOptions.notes}
                                onChange={() => handleOptionChange('notes')}
                                size="small"
                                disabled={!article.annotations || article.annotations.length === 0}
                            />
                            <span style={{ color: (!article.annotations || article.annotations.length === 0) ? 'var(--text-tertiary)' : 'var(--text-primary)' }}>
                                {t('notes')} {(!article.annotations || article.annotations.length === 0) && '(none)'}
                            </span>
                        </label>
                    </div>
                </div>

                {/* Relational Information Section */}
                <div className='mb-4'>
                    <h3 className='text-lg font-semibold mb-2' style={{ color: 'var(--text-primary)' }}>
                        {t('relational information')}:
                    </h3>
                    <div className='grid grid-cols-2 gap-2'>
                        {/* Tags */}
                        <label className='flex items-center gap-2 cursor-pointer'>
                            <Checkbox
                                checked={exportOptions.tags}
                                onChange={() => handleOptionChange('tags')}
                                size="small"
                                disabled={!article.tags || article.tags.length === 0}
                            />
                            <span style={{ color: (!article.tags || article.tags.length === 0) ? 'var(--text-tertiary)' : 'var(--text-primary)' }}>
                                {t('tags')} {(!article.tags || article.tags.length === 0) && '(none)'}
                            </span>
                        </label>

                        {/* Related Articles */}
                        <label className='flex items-center gap-2 cursor-pointer'>
                            <Checkbox
                                checked={exportOptions.relatedArticles}
                                onChange={() => handleOptionChange('relatedArticles')}
                                size="small"
                                disabled={!article.relatedArticles || article.relatedArticles.length === 0}
                            />
                            <span style={{ color: (!article.relatedArticles || article.relatedArticles.length === 0) ? 'var(--text-tertiary)' : 'var(--text-primary)' }}>
                                {t('related articles')} {(!article.relatedArticles || article.relatedArticles.length === 0) && '(none)'}
                            </span>
                        </label>

                        {/* Collections */}
                        <label className='flex items-center gap-2 cursor-pointer'>
                            <Checkbox
                                checked={exportOptions.collections}
                                onChange={() => handleOptionChange('collections')}
                                size="small"
                                disabled={!article.groups || article.groups.length === 0}
                            />
                            <span style={{ color: (!article.groups || article.groups.length === 0) ? 'var(--text-tertiary)' : 'var(--text-primary)' }}>
                                {t('collections')} {(!article.groups || article.groups.length === 0) && '(none)'}
                            </span>
                        </label>
                    </div>
                </div>

                <div className='mb-4'>
                    <h3 className='text-lg font-semibold mb-2' style={{ color: 'var(--text-primary)' }}>
                        {t('export format')}:
                    </h3>
                    <div className='flex gap-4'>
                        <label className='flex items-center gap-2 cursor-pointer'>
                            <input
                                type="radio"
                                name="format"
                                value="pdf"
                                checked={exportOptions.format === 'pdf'}
                                onChange={() => handleFormatChange('pdf')}
                            />
                            <span style={{ color: 'var(--text-primary)' }}>PDF</span>
                        </label>
                        <label className='flex items-center gap-2 cursor-pointer'>
                            <input
                                type="radio"
                                name="format"
                                value="docx"
                                checked={exportOptions.format === 'docx'}
                                onChange={() => handleFormatChange('docx')}
                            />
                            <span style={{ color: 'var(--text-primary)' }}>Word (.docx)</span>
                        </label>
                    </div>
                </div>
            </div>

            <div className='flex justify-end gap-2 mt-4'>
                <ActionButton onClick={onRequestClose} color='red'>{t('cancel')}</ActionButton>
                <ActionButton onClick={handleExport} color='blue'>{t('export')}</ActionButton>
            </div>
        </GeneralModal>
    );
};

export default ExportModal;
