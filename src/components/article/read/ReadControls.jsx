import React, { useState, useContext, useEffect, useRef } from 'react';
import { XMarkIcon, MagnifyingGlassIcon, PencilIcon, PhotoIcon, SpeakerWaveIcon, FilmIcon, ChevronLeftIcon, ChevronRightIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon, ListBulletIcon, NumberedListIcon, ChevronUpIcon, ChevronDownIcon, DocumentArrowDownIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { ReadContext } from '../../../store/read-context.jsx';
import { AppContext } from '../../../store/app-context.jsx';
import { DBContext } from '../../../store/db-context.jsx';
import FormatButton from '../../common/FormatButton.jsx';
import ActionButton from '../../common/ActionButton.jsx';
import ConfirmModal from '../../common/ConfirmModal.jsx';
import { articleApi } from '../../../backend-adapter/BackendAdapter.js';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { EllipsisHorizontalIcon } from '@heroicons/react/24/solid';
import ArticlePreferencesModal from '../modals/ArticlePreferencesModal.jsx';
import ExportModal from '../modals/ExportModal.jsx';
import toastr from 'toastr';

const ReadControls = () => {

    const { article, increaseFontSize, decreaseFontSize, toggleBlockType, setEditable, editable, saveContent, resetContent, handleInsertImageClicked, handleInsertAudioClicked, handleInsertVideoClicked, rightPanelCollapsed, setRightPanelCollapsed, leftPanelCollapsed, setLeftPanelCollapsed, setSearchTerm, setCurrentHighlightIndex, scrollToNextHighlight, scrollToPreviousHighlight, scrollToHighlight, getHighlightInfo, searchTerm, allHighlightRefs, beforeFullScreenToggleRef, showExplanationEditor, setShowExplanationEditor, showCommentEditor, setShowCommentEditor, hasExplanationContent, hasCommentContent } = useContext(ReadContext);
    const { beforeDeleteArticle, afterDeleteArticle, fullScreen, setFullScreen, translate: t, editorSettings, activeTabId } = useContext(AppContext);
    
    // Wrapper to capture scroll before toggling fullscreen
    const toggleFullScreen = (newFullScreen) => {
        beforeFullScreenToggleRef.current?.();
        setFullScreen(newFullScreen);
    };
    const { fetchArticleById } = useContext(DBContext);

    const [isDeleteConfirmModalOpen, setDeleteConfirmModalOpen] = useState(false);
    const [isPreferencesModalOpen, setPreferencesModalOpen] = useState(false);
    const [isExportModalOpen, setExportModalOpen] = useState(false);
    const [searchBarOpen, setSearchBarOpen] = useState(false);
    const [localSearchTerm, setLocalSearchTerm] = useState('');
    const [shouldScrollToFirst, setShouldScrollToFirst] = useState(false);
    
    const searchInputRef = useRef(null);

    // Effect to scroll to first highlight when highlights become available
    useEffect(() => {
        if (shouldScrollToFirst && allHighlightRefs.length > 0) {
            scrollToHighlight(0);
            setShouldScrollToFirst(false);
        }
    }, [allHighlightRefs, shouldScrollToFirst, scrollToHighlight]);

    const handleToggleBlockType = (event, blockType) => {
        event.preventDefault();
        toggleBlockType(blockType);
    }

    const handleStarClick = async (e) => {
        e.stopPropagation();
        await articleApi.setIsStarred(article.id, !article.isStarred);
        fetchArticleById(article.id);
    }

    const handleIsReadClick = async (e) => {
        e.stopPropagation();
        await articleApi.setIsRead(article.id, !article.isRead);
        fetchArticleById(article.id);
    }

    const handleSearchClick = () => {
        if (searchBarOpen) {
            // If search bar is open and we have a term, reset and search
            if (localSearchTerm) {
                // Clear the current search first to reset highlight system
                setSearchTerm('');
                setCurrentHighlightIndex(-1);
                // Set new term after a brief delay to allow reset to complete
                setTimeout(() => {
                    setSearchTerm(localSearchTerm);
                    setCurrentHighlightIndex(0);
                    // Mark that we should scroll to first highlight when refs are ready
                    setShouldScrollToFirst(true);
                }, 50);
            }
        } else {
            setSearchBarOpen(true);
        }
    }

    const handleCloseSearchBar = () => {
        setSearchBarOpen(false);
        setSearchTerm('');
        setLocalSearchTerm('');
        setCurrentHighlightIndex(-1);
        setShouldScrollToFirst(false);
    }

    const handleNextHighlight = () => {
        scrollToNextHighlight();
    }

    const handlePreviousHighlight = () => {
        scrollToPreviousHighlight();
    }

    // Keyboard event handler
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Ctrl+F or Cmd+F to open search - only if this tab is active
            if ((e.ctrlKey || e.metaKey) && (e.key === 'f' || e.key === 'F') && activeTabId === article.id) {
                e.preventDefault();
                
                // Get selected text if any
                const selection = window.getSelection();
                const selectedText = selection && !selection.isCollapsed 
                    ? selection.toString().trim() 
                    : '';
                
                // If there's selected text, use it as the search term and trigger search
                if (selectedText) {
                    setLocalSearchTerm(selectedText);
                    // Trigger the search automatically
                    setSearchTerm('');
                    setCurrentHighlightIndex(-1);
                    setTimeout(() => {
                        setSearchTerm(selectedText);
                        setCurrentHighlightIndex(0);
                        setShouldScrollToFirst(true);
                    }, 50);
                }
                
                if (!searchBarOpen) {
                    setSearchBarOpen(true);
                }
                
                // Focus the search input and select all text
                setTimeout(() => {
                    if (searchInputRef.current) {
                        searchInputRef.current.focus();
                        searchInputRef.current.select(); // Select all text so user can immediately type
                    }
                }, 50); // Increased timeout to ensure rendering is complete
            }
            
            // Escape to close search
            if (e.key === 'Escape' && searchBarOpen) {
                handleCloseSearchBar();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [searchBarOpen, t, activeTabId, article.id]);

    const handleSearchInputChange = (e) => {
        const newValue = e.target.value;
        setLocalSearchTerm(newValue);
        
        // Clear the search term to remove highlights when user starts typing
        // Only if the new value is different from the current search term
        if (newValue !== searchTerm && searchTerm !== '') {
            setSearchTerm('');
            setCurrentHighlightIndex(-1);
        }
    };

    const handleSearchKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (searchBarOpen && localSearchTerm) {
                // If search term is not set yet, set it first
                if (localSearchTerm !== searchTerm) {
                    // Clear the current search first to reset highlight system
                    setSearchTerm('');
                    setCurrentHighlightIndex(-1);
                    // Set new term after a brief delay to allow reset to complete
                    setTimeout(() => {
                        setSearchTerm(localSearchTerm);
                        setCurrentHighlightIndex(0);
                        // Mark that we should scroll to first highlight when refs are ready
                        setShouldScrollToFirst(true);
                    }, 50);
                } else {
                    // If search term is already set, go to next highlight
                    handleNextHighlight();
                }
            }
        }
    };

    const handleSavePreferences = async ({ isDateUncertain, ordering, selectedOwnerName }) => {
        try {
            const orderingToSet = ordering ? ordering : null;
            await articleApi.updateOwner(article.id, selectedOwnerName);
            await articleApi.setOrdering(article.id, orderingToSet);
            await articleApi.setIsDateUncertain(article.id, isDateUncertain);
            fetchArticleById(article.id);
            setPreferencesModalOpen(false);
            toastr.success(t('changes saved'));
        } catch (error) {
            console.error(error);
            toastr.error(t('error occurred'));
        }
    }

    return (
        <div 
            className='flex flex-col gap-2 shadow-lg p-2 items-center'
            style={{ 
                backgroundColor: fullScreen ? 'var(--bg-primary)' : 'var(--bg-secondary)', 
                boxShadow: '0 10px 15px -3px var(--shadow), 0 4px 6px -2px var(--shadow)',
                position: 'relative',
                zIndex: 10
            }}
        >
            <div className='flex justify-between w-full'>
                {/* left */}
                <div className={'flex gap-1 ' + (fullScreen || ' flex-wrap')}>
                    {leftPanelCollapsed ?
                        <FormatButton onClick={() => setLeftPanelCollapsed(false)} title={t('show left panel')}>
                            <ChevronRightIcon className="w-5 h-5" />
                        </FormatButton>
                        :
                        <FormatButton onClick={() => setLeftPanelCollapsed(true)} title={t('hide left panel')}>
                            <ChevronLeftIcon className="w-5 h-5" />
                        </FormatButton>}
                    <FormatButton onClick={decreaseFontSize} title={t('decrease font')}>
                        <span className="text-xs font-bold">A</span>
                    </FormatButton>
                    <FormatButton onClick={increaseFontSize} title={t('increase font')}>
                        <span className="text-lg font-bold">A</span>
                    </FormatButton>
                    <FormatButton
                        onClick={() => setPreferencesModalOpen(true)}
                        title={t('preferences')}>
                        <EllipsisHorizontalIcon className="w-5 h-5" />
                    </FormatButton>
                    {searchBarOpen && (
                        <>
                            <input
                                ref={searchInputRef}
                                type="text"
                                className="border rounded p-1"
                                style={{
                                    backgroundColor: 'var(--bg-primary)',
                                    color: 'var(--text-primary)',
                                    borderColor: 'var(--border-secondary)'
                                }}
                                placeholder={t('search')}
                                value={localSearchTerm}
                                onChange={handleSearchInputChange}
                                onKeyDown={handleSearchKeyDown}
                                autoFocus
                            />
                            <FormatButton onClick={handleCloseSearchBar} title={t('close search bar')}>
                                <XMarkIcon className="w-5 h-5" />
                            </FormatButton>
                        </>
                    )}
                    <FormatButton onClick={handleSearchClick} title={t('search in the article')}><MagnifyingGlassIcon className="w-5 h-5" /></FormatButton>
                    {searchBarOpen && getHighlightInfo && (
                        getHighlightInfo().hasMatches ? (
                            <>
                                <FormatButton onClick={handlePreviousHighlight} title={t('previous match')}>
                                    <ChevronUpIcon className="w-5 h-5" />
                                </FormatButton>
                                <span 
                                    className="text-sm px-2 py-1"
                                    style={{ color: 'var(--text-primary)' }}
                                >
                                    {getHighlightInfo().current}/{getHighlightInfo().total}
                                </span>
                                <FormatButton onClick={handleNextHighlight} title={t('next match')}>
                                    <ChevronDownIcon className="w-5 h-5" />
                                </FormatButton>
                            </>
                        ) : searchTerm && (
                            <span 
                                className="flex text-sm px-2 py-1 items-center"
                                style={{ color: 'var(--text-secondary)' }}
                            >
                                {t('no results found')}
                            </span>
                        )
                    )}
                </div>
                {/* center */}
                <div className='gap-1'>
                    {editable ?
                        <div className='flex flex-wrap gap-1'>
                            <FormatButton onMouseDown={(e) => handleToggleBlockType(e, 'unordered-list-item')} title={t('unordered list')}><ListBulletIcon className='w-6 h-6' /></FormatButton>
                            <FormatButton onMouseDown={(e) => handleToggleBlockType(e, 'ordered-list-item')} title={t('ordered list')}><NumberedListIcon className='w-6 h-6' /></FormatButton>
                            <FormatButton onClick={handleInsertImageClicked} title={t('add image')}><PhotoIcon className="w-5 h-5" /></FormatButton>
                            <FormatButton onClick={handleInsertAudioClicked} title={t('add audio')}><SpeakerWaveIcon className="w-5 h-5" /></FormatButton>
                            <FormatButton onClick={handleInsertVideoClicked} title={t('add video')}><FilmIcon className="w-5 h-5" /></FormatButton>
                        </div>
                        :
                        (fullScreen &&
                            <div className='flex items-center h-full'>
                                <h2 
                                    className='text-xl whitespace-normal break-words mx-10'
                                    style={{ color: 'var(--text-secondary)' }}
                                >
                                    {article.title + (article.isDateUncertain ? '' : ` (${new Date(article.date).toLocaleDateString('tr')})`)}
                                </h2>
                            </div>
                        )}
                </div>
                {/* right */}
                <div className={'flex gap-1 ' + (fullScreen || ' flex-wrap')}>
                    {fullScreen && <div onClick={handleStarClick} className='flex items-center px-1' title={article.isStarred ? t('starred') : t('starred')}>
                        {article.isStarred ? (
                            <StarIcon style={{ fontSize: '1.7rem', color: '#FFD700' }} className="hover:scale-125" />
                        ) : (
                            <StarBorderIcon style={{ fontSize: '1.7rem', color: '#B0B0B0' }} className="hover:scale-125" />
                        )}
                    </div>}
                    {fullScreen && <div onClick={handleIsReadClick} className='flex items-center px-1' title={article.isRead ? t('mark as unread') : t('mark as read')}>
                        {article.isRead ? (
                            <CheckCircleIcon style={{ fontSize: '1.7rem', color: '#4CAF50' }} className="hover:scale-125" />
                        ) : (
                            <CheckCircleOutlineIcon style={{ fontSize: '1.7rem', color: '#B0B0B0' }} className="hover:scale-125" />
                        )}
                    </div>}
                    {!editable &&
                        <FormatButton
                            onClick={() => setEditable(true)}
                            title={t('edit article')}>
                            <PencilIcon className="w-5 h-5" />
                        </FormatButton>
                    }
                    <FormatButton
                        onClick={() => setExportModalOpen(true)}
                        title={t('export article')}>
                        <DocumentArrowDownIcon className="w-5 h-5" />
                    </FormatButton>                    
                    {!leftPanelCollapsed || !rightPanelCollapsed ?
                        <FormatButton onClick={() => {
                            setLeftPanelCollapsed(true);
                            setRightPanelCollapsed(true);
                        }} title={t('show panels')}>
                            <ChevronLeftIcon className="w-5 h-5" />
                            <ChevronRightIcon className="w-5 h-5" />
                        </FormatButton>
                        :
                        <FormatButton onClick={() => {
                            setLeftPanelCollapsed(false);
                            setRightPanelCollapsed(false);
                        }} title={t('hide panels')}>
                            <ChevronRightIcon className="w-5 h-5" />
                            <ChevronLeftIcon className="w-5 h-5" />
                        </FormatButton>
                    }
                    {fullScreen ?
                        <FormatButton onClick={() => toggleFullScreen(false)} title={t('exit full screen')}>
                            <ArrowsPointingInIcon className="w-5 h-5" />
                        </FormatButton>
                        :
                        <FormatButton onClick={() => toggleFullScreen(true)} title={t('full screen')}>
                            <ArrowsPointingOutIcon className="w-5 h-5" />
                        </FormatButton>}
                    {rightPanelCollapsed ?
                        <FormatButton onClick={() => setRightPanelCollapsed(false)} title={t('show right panel')}>
                            <ChevronLeftIcon className="w-5 h-5" />
                        </FormatButton>
                        :
                        <FormatButton onClick={() => setRightPanelCollapsed(true)} title={t('hide right panel')}>
                            <ChevronRightIcon className="w-5 h-5" />
                        </FormatButton>}
                </div>
            </div>
            {editable &&
                <div className='flex gap-1 justify-between w-full'>
                    <ActionButton onClick={() => setDeleteConfirmModalOpen(true)} color='red'>{t('delete article')}</ActionButton>
                    {/* Add Explanation / Add Comment buttons in the middle */}
                    <div className='flex gap-2 items-center'>
                        {!hasExplanationContent && !showExplanationEditor && (
                            <button 
                                onClick={() => setShowExplanationEditor(true)}
                                className='text-sm px-3 py-1.5 rounded transition-colors hover:opacity-80'
                                style={{
                                    backgroundColor: 'var(--bg-tertiary)',
                                    color: 'var(--text-secondary)',
                                    border: '1px dashed var(--border-secondary)'
                                }}
                            >
                                + {t('add explanation')}
                            </button>
                        )}
                        {!hasCommentContent && !showCommentEditor && (
                            <button 
                                onClick={() => setShowCommentEditor(true)}
                                className='text-sm px-3 py-1.5 rounded transition-colors hover:opacity-80'
                                style={{
                                    backgroundColor: 'var(--bg-tertiary)',
                                    color: 'var(--text-secondary)',
                                    border: '1px dashed var(--border-secondary)'
                                }}
                            >
                                + {t('add comment')}
                            </button>
                        )}
                    </div>
                    <div className='flex gap-1 items-center'>
                        {editorSettings?.autosaveEnabled && (
                            <div 
                                className='flex items-center gap-1 px-2 py-1 rounded text-sm'
                                style={{ 
                                    backgroundColor: 'var(--bg-primary)', 
                                    color: 'var(--text-secondary)',
                                    border: '1px solid var(--border-secondary)'
                                }}
                                title={t('autosaveActive')}
                            >
                                <ArrowPathIcon className="w-4 h-4 animate-spin" style={{ animationDuration: '3s' }} />
                                <span>{t('autosave')}</span>
                            </div>
                        )}
                        <ActionButton
                            onClick={() => { resetContent(); setEditable(false); }}
                            color={'red'}>
                            {t('cancel')}
                        </ActionButton>
                        <ActionButton
                            onClick={() => { saveContent(); setEditable(false); }}
                            color={'blue'}>
                            {t('save')}
                        </ActionButton>
                    </div>
                </div>}
            <ConfirmModal message={t('article delete confirmation question')}
                onClose={() => setDeleteConfirmModalOpen(false)}
                onConfirm={async () => {
                    beforeDeleteArticle(article.id);
                    await articleApi.deleteById(article.id);
                    setDeleteConfirmModalOpen(false);
                    afterDeleteArticle(article.id);
                }}
                isOpen={isDeleteConfirmModalOpen}
            />
            <ArticlePreferencesModal isOpen={isPreferencesModalOpen} onRequestClose={() => setPreferencesModalOpen(false)} onConfirm={handleSavePreferences} />
            <ExportModal isOpen={isExportModalOpen} onRequestClose={() => setExportModalOpen(false)} article={article} />
        </div>
    );
};

export default ReadControls;
