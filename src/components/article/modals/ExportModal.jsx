import React, { useState, useContext } from 'react';
import GeneralModal from '../../common/GeneralModal.jsx';
import ActionButton from '../../common/ActionButton.jsx';
import { AppContext } from '../../../store/app-context.jsx';
import Checkbox from '@mui/material/Checkbox';
import toastr from 'toastr';
import { articleApi } from '../../../backend-adapter/BackendAdapter.js';

const ExportModal = ({ isOpen, onRequestClose, article, articleIds, isMultiArticle = false }) => {
    const { translate: t } = useContext(AppContext);

    const [exportOptions, setExportOptions] = useState({
        explanation: true,
        mainText: true,
        comment: true,
        images: true,
        notes: true,
        tags: true,
        relatedArticles: true,
        collections: true,
        format: 'html'
    });

    const [documentTitle, setDocumentTitle] = useState('');

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

    // translations for the document
    const getTranslations = () => ({
        saveMergedArticles: t('export selected articles'),
        exportArticle: t('export article'),
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
    });

    const handleSingleArticleExport = async () => {
        try {
            const exportData = {
                articleId: article.id,
                options: exportOptions,
                translations: getTranslations()
            };

            const result = await articleApi.exportArticle(exportData);
            
            if (result.success) {
                toastr.success(t('article exported successfully'));
                onRequestClose();
            } else {
                toastr.error(t('export failed'));
            }
        } catch (error) {
            console.error('Single article export error:', error);
            toastr.error(t('export failed'));
        }
    };

    const handleMultiArticleExport = async () => {
        try {
            if (!articleIds || articleIds.length === 0) {
                toastr.warning(t('no articles selected for export'));
                return;
            }

            const exportData = {
                articleIds: articleIds,
                options: exportOptions,
                documentTitle: documentTitle.trim() || t('merged articles'),
                isMultiArticle: true,
                translations: getTranslations()
            };

            const result = await articleApi.exportMultipleArticles(exportData);
            
            if (result.success) {
                toastr.success(t('articles exported successfully'));
                onRequestClose();
            } else {
                toastr.error(t('export failed'));
            }
        } catch (error) {
            console.error('Multi-article export error:', error);
            toastr.error(t('export failed'));
        }
    };

    const handleExport = async () => {
        if (isMultiArticle) {
            await handleMultiArticleExport();
        } else {
            await handleSingleArticleExport();
        }
    };


    return (
        <GeneralModal
            isOpen={isOpen}
            onRequestClose={onRequestClose}
            title={isMultiArticle ? t('export selected articles') : t('export article')}
        >
            <div className='flex flex-col gap-4 mb-4'>
                {/* Document Title Input for Multi-Article Export */}
                {isMultiArticle && (
                    <div className='mb-4'>
                        <h3 className='text-lg font-semibold mb-2' style={{ color: 'var(--text-primary)' }}>
                            {t('document title')}:
                        </h3>
                        <input
                            type="text"
                            value={documentTitle}
                            onChange={(e) => setDocumentTitle(e.target.value)}
                            placeholder={t('enter document title (optional)')}
                            className='w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                            style={{ 
                                backgroundColor: 'var(--bg-secondary)', 
                                color: 'var(--text-primary)',
                                borderColor: 'var(--border-color)'
                            }}
                        />
                        <p className='text-sm mt-1' style={{ color: 'var(--text-tertiary)' }}>
                            {t('if left empty, will use default title')}
                        </p>
                    </div>
                )}
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
                                disabled={false}
                            />
                            <span style={{ color: 'var(--text-primary)' }}>
                                {t('explanation')}
                            </span>
                        </label>

                        {/* Main Text */}
                        <label className='flex items-center gap-2 cursor-pointer'>
                            <Checkbox
                                checked={exportOptions.mainText}
                                onChange={() => handleOptionChange('mainText')}
                                size="small"
                                disabled={false}
                            />
                            <span style={{ color: 'var(--text-primary)' }}>
                                {t('main text')}
                            </span>
                        </label>

                        {/* Comment */}
                        <label className='flex items-center gap-2 cursor-pointer'>
                            <Checkbox
                                checked={exportOptions.comment}
                                onChange={() => handleOptionChange('comment')}
                                size="small"
                                disabled={false}
                            />
                            <span style={{ color: 'var(--text-primary)' }}>
                                {t('comment')}
                            </span>
                        </label>

                        {/* Images */}
                        <label className='flex items-center gap-2 cursor-pointer'>
                            <Checkbox
                                checked={exportOptions.images}
                                onChange={() => handleOptionChange('images')}
                                size="small"
                                disabled={false}
                            />
                            <span style={{ color: 'var(--text-primary)' }}>
                                {t('images')}
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
                                disabled={false}
                            />
                            <span style={{ color: 'var(--text-primary)' }}>
                                {t('tags')}
                            </span>
                        </label>

                        {/* Related Articles */}
                        <label className='flex items-center gap-2 cursor-pointer'>
                            <Checkbox
                                checked={exportOptions.relatedArticles}
                                onChange={() => handleOptionChange('relatedArticles')}
                                size="small"
                                disabled={false}
                            />
                            <span style={{ color: 'var(--text-primary)' }}>
                                {t('related articles')}
                            </span>
                        </label>

                        {/* Collections */}
                        <label className='flex items-center gap-2 cursor-pointer'>
                            <Checkbox
                                checked={exportOptions.collections}
                                onChange={() => handleOptionChange('collections')}
                                size="small"
                                disabled={false}
                            />
                            <span style={{ color: 'var(--text-primary)' }}>
                                {t('collections')}
                            </span>
                        </label>

                         {/* Notes */}
                         <label className='flex items-center gap-2 cursor-pointer'>
                            <Checkbox
                                checked={exportOptions.notes}
                                onChange={() => handleOptionChange('notes')}
                                size="small"
                                disabled={false}
                            />
                            <span style={{ color: 'var(--text-primary)' }}>
                                {t('notes')}
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
                                value="html"
                                checked={exportOptions.format === 'html'}
                                onChange={() => handleFormatChange('html')}
                            />
                            <span style={{ color: 'var(--text-primary)' }}>HTML</span>
                        </label>
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
