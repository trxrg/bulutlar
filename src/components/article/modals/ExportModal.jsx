import React, { useState, useContext } from 'react';
import GeneralModal from '../../common/GeneralModal.jsx';
import ActionButton from '../../common/ActionButton.jsx';
import LoadingToastr from '../../common/LoadingToastr.jsx';
import { AppContext } from '../../../store/app-context.jsx';
import Checkbox from '@mui/material/Checkbox';
import toastr from 'toastr';
import { articleApi } from '../../../backend-adapter/BackendAdapter.js';
import {
    EXPORT_FONT_FAMILY_OPTIONS,
    EXPORT_PAGE_MARGIN_OPTIONS,
    editorTailwindToPt,
    EXPORT_FONT_SIZE_MIN_PT,
    EXPORT_FONT_SIZE_MAX_PT,
} from '../../../utils/exportFontOptions.js';
import { showExportSuccessToastr } from '../../../utils/exportToastr.js';

// A single labelled checkbox used throughout the content-selection cards.
const OptionCheckbox = ({ checked, onChange, label, disabled = false }) => (
    <label
        className={`flex items-center gap-2 rounded-md px-1 py-0.5 transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-[var(--bg-tertiary)]'}`}
    >
        <Checkbox checked={checked} onChange={onChange} size='small' disabled={disabled} />
        <span style={{ color: 'var(--text-primary)' }}>{label}</span>
    </label>
);

// A bordered card grouping a set of related options under a heading.
const OptionCard = ({ title, children }) => (
    <div
        className='flex flex-col gap-1 rounded-lg p-4'
        style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)' }}
    >
        <h3 className='text-sm font-semibold mb-1 uppercase tracking-wide' style={{ color: 'var(--text-secondary)' }}>
            {title}
        </h3>
        {children}
    </div>
);

const selectStyle = {
    backgroundColor: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    borderColor: 'var(--border-secondary)',
};

const ExportModal = ({ isOpen, onRequestClose, article, articleIds, isMultiArticle = false }) => {
    const { translate: t, editorSettings, getLanguage } = useContext(AppContext);
    const showBltOption = isMultiArticle ? (articleIds?.length > 0) : !!article;
    const isDocumentFormat = (format) => format === 'pdf' || format === 'docx';

    const [exportOptions, setExportOptions] = useState({
        explanation: true,
        mainText: true,
        comment: true,
        images: true,
        audios: true,
        videos: true,
        notes: true,
        tags: true,
        relatedArticles: true,
        collections: true,
        format: 'pdf',
        fontFamily: editorSettings?.fontFamily || 'system-ui',
        fontSize: editorTailwindToPt(editorSettings?.fontSize),
        pageMargin: 'normal',
        includeDocumentTitle: true,
        documentTitleSeparatePage: false,
        includeGenerationDate: false,
    });

    const [documentTitle, setDocumentTitle] = useState('');
    const [isExporting, setIsExporting] = useState(false);

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

    const handleLayoutChange = (option, value) => {
        setExportOptions(prev => ({
            ...prev,
            [option]: value
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
        saturday: t('saturday'),
    });

    const handleSingleArticleExport = async () => {
        try {
            setIsExporting(true);
            
            const exportData = {
                articleId: article.id,
                options: exportOptions,
                translations: getTranslations()
            };

            // Show loading toastr for PDF and Word exports
            let loadingToastr = null;
            if (exportOptions.format === 'pdf') {
                loadingToastr = LoadingToastr.show(t('generating pdf') + '...');
            } else if (exportOptions.format === 'docx') {
                loadingToastr = LoadingToastr.show(t('generating word') + '...');
            }

            // Close modal after showing toastr message
            onRequestClose();
            
            const result = await articleApi.exportArticle(exportData);
            
            // Clear loading toastr
            if (loadingToastr) {
                loadingToastr.hide();
            }
            
            if (result.success) {
                showExportSuccessToastr(t('article exported successfully'), result.filePath, t('show in folder'));
            } else {
                toastr.error(t('export failed'));
            }
            
        } catch (error) {
            console.error('Single article export error:', error);
            toastr.error(t('export failed'));
            // Close modal after showing error toastr message
            onRequestClose();
        } finally {
            setIsExporting(false);
        }
    };

    const handleMultiArticleExport = async () => {
        try {
            if (!articleIds || articleIds.length === 0) {
                toastr.warning(t('no articles selected for export'));
                onRequestClose();
                return;
            }

            setIsExporting(true);

            const exportData = {
                articleIds: articleIds,
                options: exportOptions,
                documentTitle: documentTitle.trim() || t('merged articles'),
                isMultiArticle: true,
                translations: getTranslations(),
                locale: getLanguage(),
            };

            // Show loading toastr for PDF and Word exports
            let loadingToastr = null;
            if (exportOptions.format === 'pdf') {
                loadingToastr = LoadingToastr.show(t('generating pdf') + '...');
            } else if (exportOptions.format === 'docx') {
                loadingToastr = LoadingToastr.show(t('generating word') + '...');
            }

            // Close modal after showing toastr message
            onRequestClose();

            const result = await articleApi.exportMultipleArticles(exportData);
            
            // Clear loading toastr
            if (loadingToastr) {
                loadingToastr.hide();
            }
            
            if (result.success) {
                showExportSuccessToastr(t('articles exported successfully'), result.filePath, t('show in folder'));
            } else {
                toastr.error(t('export failed'));
            }
            
        } catch (error) {
            console.error('Multi-article export error:', error);
            toastr.error(t('export failed'));
            // Close modal after showing error toastr message
            onRequestClose();
        } finally {
            setIsExporting(false);
        }
    };

    // const handleDbExport = async () => {
    //     try {
    //         const ids = isMultiArticle ? articleIds : [article.id];
    //         if (!ids || ids.length === 0) {
    //             toastr.warning(t('no articles selected for export'));
    //             onRequestClose();
    //             return;
    //         }
    //
    //         setIsExporting(true);
    //         onRequestClose();
    //
    //         const result = await dbApi.handleShareArticles(ids, exportOptions);
    //
    //         if (result) {
    //             toastr.success(t('articles shared to') + ' ' + result);
    //         }
    //     } catch (error) {
    //         console.error('DB export error:', error);
    //         toastr.error(t('export failed'));
    //     } finally {
    //         setIsExporting(false);
    //     }
    // };

    const handleBltExport = async () => {
        let loadingToastr = null;
        try {
            const ids = isMultiArticle ? articleIds : [article?.id];
            if (!ids || ids.length === 0) {
                toastr.warning(t('no articles selected for export'));
                return;
            }

            // Ask where to drop the .blt before doing any work; abort silently
            // if the directory dialog is cancelled.
            const outputDir = await window.api.sharing.chooseOutputDir({
                title: t('choose bundle folder'),
            });
            if (!outputDir) return; // keep the modal open so the user can retry

            setIsExporting(true);
            loadingToastr = LoadingToastr.show(t('generating bundle') + '...');
            onRequestClose();

            const result = await window.api.sharing.exportSingleArticleBundle({
                articleIds: ids,
                options: exportOptions,
                outputDir,
            });

            loadingToastr.hide();
            loadingToastr = null;

            if (result && result.filePath) {
                showExportSuccessToastr(
                    isMultiArticle ? t('articles exported successfully') : t('article exported successfully'),
                    result.filePath,
                    t('show in folder'),
                );
            } else {
                toastr.error(t('export failed'));
            }
        } catch (error) {
            console.error('BLT export error:', error);
            if (loadingToastr) loadingToastr.hide();
            toastr.error(t('export failed'));
            onRequestClose();
        } finally {
            setIsExporting(false);
        }
    };

    const handleExport = async () => {
        if (exportOptions.format === 'blt') {
            await handleBltExport();
        // } else if (exportOptions.format === 'db') {
        //     await handleDbExport();
        } else if (isMultiArticle) {
            await handleMultiArticleExport();
        } else {
            await handleSingleArticleExport();
        }
    };


    // Radio choices for the format selector, rendered as selectable cards.
    const formatOptions = [
        ...(showBltOption ? [{ value: 'blt', label: 'BLT' }] : []),
        { value: 'pdf', label: 'PDF' },
        { value: 'docx', label: 'Word (.docx)' },
        // { value: 'db', label: t('database (share)') },
    ];

    const showDocumentLayoutSettings = isDocumentFormat(exportOptions.format);
    const showMediaOptions = !isDocumentFormat(exportOptions.format);
    const showMultiDocumentTitleSettings = isMultiArticle && showDocumentLayoutSettings;

    return (
        <GeneralModal
            isOpen={isOpen}
            onRequestClose={onRequestClose}
            title={isMultiArticle ? t('export selected articles') : t('export article')}
            style={{ width: '90%', maxWidth: '820px', height: 'auto', maxHeight: '88vh' }}
        >
            <div className='flex flex-col h-full min-h-0'>
                {/* Scrollable Content Area */}
                <div className='flex-1 overflow-y-auto pr-2 -mr-2'>
                    <div className='flex flex-col gap-6'>
                        {/* Format Section — first thing the user picks */}
                        <div>
                            <h3 className='text-sm font-semibold mb-2 uppercase tracking-wide' style={{ color: 'var(--text-secondary)' }}>
                                {t('export format')}
                            </h3>
                            <div className='flex flex-wrap gap-2'>
                                {formatOptions.map((opt) => {
                                    const selected = exportOptions.format === opt.value;
                                    return (
                                        <label
                                            key={opt.value}
                                            className='flex items-center gap-2 cursor-pointer rounded-lg px-4 py-2 transition-all'
                                            style={{
                                                border: `1px solid ${selected ? 'var(--border-primary)' : 'var(--border-secondary)'}`,
                                                backgroundColor: selected ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                                                boxShadow: selected ? '0 0 0 1px var(--border-primary)' : 'none',
                                            }}
                                        >
                                            <input
                                                type="radio"
                                                name="format"
                                                value={opt.value}
                                                checked={selected}
                                                onChange={() => handleFormatChange(opt.value)}
                                            />
                                            <span className='font-medium' style={{ color: 'var(--text-primary)' }}>{opt.label}</span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>

                        {showMultiDocumentTitleSettings && (
                            <OptionCard title={t('document title')}>
                                <OptionCheckbox
                                    label={t('include document title')}
                                    checked={exportOptions.includeDocumentTitle}
                                    onChange={() => handleOptionChange('includeDocumentTitle')}
                                />
                                <input
                                    type="text"
                                    value={documentTitle}
                                    onChange={(e) => setDocumentTitle(e.target.value)}
                                    placeholder={t('enter document title (optional)')}
                                    disabled={!exportOptions.includeDocumentTitle}
                                    className='w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50'
                                    style={selectStyle}
                                />
                                <p className='text-sm' style={{ color: 'var(--text-tertiary)' }}>
                                    {t('if left empty, will use default title')}
                                </p>
                                <OptionCheckbox
                                    label={t('title on separate page')}
                                    checked={exportOptions.documentTitleSeparatePage}
                                    onChange={() => handleOptionChange('documentTitleSeparatePage')}
                                    disabled={!exportOptions.includeDocumentTitle}
                                />
                                <OptionCheckbox
                                    label={t('include generation date')}
                                    checked={exportOptions.includeGenerationDate}
                                    onChange={() => handleOptionChange('includeGenerationDate')}
                                />
                            </OptionCard>
                        )}

                        {showDocumentLayoutSettings && (
                            <OptionCard title={t('document layout')}>
                                <label className='flex flex-col gap-1'>
                                    <span className='text-sm' style={{ color: 'var(--text-secondary)' }}>{t('font family')}</span>
                                    <select
                                        value={exportOptions.fontFamily}
                                        onChange={(e) => handleLayoutChange('fontFamily', e.target.value)}
                                        className='w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                                        style={selectStyle}
                                    >
                                        {EXPORT_FONT_FAMILY_OPTIONS.map((option) => (
                                            <option key={option.value} value={option.value} style={{ fontFamily: option.value }}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label className='flex flex-col gap-1 mt-3'>
                                    <span className='text-sm' style={{ color: 'var(--text-secondary)' }}>{t('font size')}</span>
                                    <div className='flex items-center gap-2'>
                                        <input
                                            type='number'
                                            min={EXPORT_FONT_SIZE_MIN_PT}
                                            max={EXPORT_FONT_SIZE_MAX_PT}
                                            step={1}
                                            value={exportOptions.fontSize}
                                            onChange={(e) => {
                                                const next = parseInt(e.target.value, 10);
                                                if (Number.isFinite(next)) {
                                                    handleLayoutChange('fontSize', next);
                                                }
                                            }}
                                            onBlur={() => {
                                                handleLayoutChange('fontSize', editorTailwindToPt(exportOptions.fontSize));
                                            }}
                                            className='w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                                            style={selectStyle}
                                        />
                                        <span className='text-sm shrink-0' style={{ color: 'var(--text-secondary)' }}>pt</span>
                                    </div>
                                </label>

                                <label className='flex flex-col gap-1 mt-3'>
                                    <span className='text-sm' style={{ color: 'var(--text-secondary)' }}>{t('page margin')}</span>
                                    <select
                                        value={exportOptions.pageMargin}
                                        onChange={(e) => handleLayoutChange('pageMargin', e.target.value)}
                                        className='w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                                        style={selectStyle}
                                    >
                                        {EXPORT_PAGE_MARGIN_OPTIONS.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {t(option.labelKey)}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            </OptionCard>
                        )}

                        {/* Content Selection — what goes into the export */}
                        <div>
                            <h3 className='text-base font-semibold mb-3' style={{ color: 'var(--text-primary)' }}>
                                {t('content selection')}
                            </h3>
                            <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
                                <OptionCard title={t('text content')}>
                                    <OptionCheckbox label={t('explanation')} checked={exportOptions.explanation} onChange={() => handleOptionChange('explanation')} />
                                    <OptionCheckbox label={t('main text')} checked={exportOptions.mainText} onChange={() => handleOptionChange('mainText')} />
                                    <OptionCheckbox label={t('comment')} checked={exportOptions.comment} onChange={() => handleOptionChange('comment')} />
                                </OptionCard>

                                <OptionCard title={t('media')}>
                                    <OptionCheckbox label={t('images')} checked={exportOptions.images} onChange={() => handleOptionChange('images')} />
                                    {showMediaOptions && (
                                        <>
                                            <OptionCheckbox label={t('audio')} checked={exportOptions.audios} onChange={() => handleOptionChange('audios')} />
                                            <OptionCheckbox label={t('video')} checked={exportOptions.videos} onChange={() => handleOptionChange('videos')} />
                                        </>
                                    )}
                                </OptionCard>

                                <OptionCard title={t('relational information')}>
                                    <OptionCheckbox label={t('tags')} checked={exportOptions.tags} onChange={() => handleOptionChange('tags')} />
                                    <OptionCheckbox label={t('related articles')} checked={exportOptions.relatedArticles} onChange={() => handleOptionChange('relatedArticles')} />
                                    <OptionCheckbox label={t('collections')} checked={exportOptions.collections} onChange={() => handleOptionChange('collections')} />
                                    <OptionCheckbox label={t('notes')} checked={exportOptions.notes} onChange={() => handleOptionChange('notes')} />
                                </OptionCard>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Fixed Button Area */}
                <div className='flex justify-end gap-2 mt-6 pt-4 border-t' style={{ borderColor: 'var(--border-secondary)' }}>
                    <ActionButton onClick={onRequestClose} color='red'>{t('cancel')}</ActionButton>
                    <ActionButton
                        onClick={handleExport}
                        disabled={isExporting}
                    >
                        {isExporting ? t('exporting') + '...' : t('export')}
                    </ActionButton>
                </div>
            </div>
        </GeneralModal>
    );
};

export default ExportModal;
