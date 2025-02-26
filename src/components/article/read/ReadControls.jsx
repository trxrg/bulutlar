import React, { useState, useContext } from 'react';
import { XMarkIcon, MagnifyingGlassIcon, PencilIcon, PhotoIcon, ChevronLeftIcon, ChevronRightIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon, ListBulletIcon, NumberedListIcon } from '@heroicons/react/24/outline';
import { ReadContext } from '../../../store/read-context.jsx';
import { AppContext } from '../../../store/app-context.jsx';
import { DBContext } from '../../../store/db-context.jsx';
import FormatButton from '../../common/FormatButton.jsx';
import ActionButton from '../../common/ActionButton.jsx';
import ConfirmModal from '../../common/ConfirmModal.jsx';
import { articleApi } from '../../../backend-adapter/BackendAdapter.js';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import { EllipsisHorizontalIcon } from '@heroicons/react/24/solid';
import ArticlePreferencesModal from '../modals/ArticlePreferencesModal.jsx';
import toastr from 'toastr';

const ReadControls = () => {

    const { article, increaseFontSize, decreaseFontSize, toggleBlockType, setEditable, editable, saveContent, resetContent, handleInsertImageClicked, rightPanelCollapsed, setRightPanelCollapsed, leftPanelCollapsed, setLeftPanelCollapsed, setSearchTerm } = useContext(ReadContext);
    const { beforeDeleteArticle, afterDeleteArticle, fullScreen, setFullScreen, translate: t } = useContext(AppContext);
    const { fetchArticleById } = useContext(DBContext);

    const [isDeleteConfirmModalOpen, setDeleteConfirmModalOpen] = useState(false);
    const [isPreferencesModalOpen, setPreferencesModalOpen] = useState(false);
    const [searchBarOpen, setSearchBarOpen] = useState(false);
    const [localSearchTerm, setLocalSearchTerm] = useState('');

    const handleToggleBlockType = (event, blockType) => {
        event.preventDefault();
        toggleBlockType(blockType);
    }

    const handleStarClick = async (e) => {
        e.stopPropagation();
        await articleApi.setIsStarred(article.id, !article.isStarred);
        fetchArticleById(article.id);
    }

    const handleSearchClick = () => {
        if (searchBarOpen)
            setSearchTerm(localSearchTerm);
        else
            setSearchBarOpen(true);
    }

    const handleCloseSearchBar = () => {
        setSearchBarOpen(false);
        setSearchTerm('');
    }

    const handleSavePreferences = async ({ isDateUncertain, ordering, selectedOwnerName }) => {
        try {
            await articleApi.updateOwner(article.id, selectedOwnerName);
            await articleApi.setOrdering(article.id, ordering);
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
        <div className='flex flex-col gap-2 shadow-lg bg-white p-2 items-center'>
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
                    <FormatButton onClick={decreaseFontSize} title={t('decrease font')}>A-</FormatButton>
                    <FormatButton onClick={increaseFontSize} title={t('increase font')}>A+</FormatButton>
                    {searchBarOpen && (
                        <>
                            <input
                                type="text"
                                className="border rounded p-1"
                                placeholder={t('search')}
                                onChange={(e) => setLocalSearchTerm(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleSearchClick();
                                    }
                                }}
                            />
                            <FormatButton onClick={handleCloseSearchBar} title={t('close search bar')}>
                                <XMarkIcon className="w-5 h-5" />
                            </FormatButton>
                        </>
                    )}
                    <FormatButton onClick={handleSearchClick} title={t('search in the article')}><MagnifyingGlassIcon className="w-5 h-5" /></FormatButton>
                </div>
                {/* center */}
                <div className='gap-1'>
                    {editable ?
                        <div className='flex flex-wrap gap-1'>
                            <FormatButton onMouseDown={(e) => handleToggleBlockType(e, 'unordered-list-item')} title={t('unordered list')}><ListBulletIcon className='w-6 h-6' /></FormatButton>
                            <FormatButton onMouseDown={(e) => handleToggleBlockType(e, 'ordered-list-item')} title={t('ordered list')}><NumberedListIcon className='w-6 h-6' /></FormatButton>
                            <FormatButton onClick={handleInsertImageClicked} title={t('add image')}><PhotoIcon className="w-5 h-5" /></FormatButton>
                        </div>
                        :
                        (fullScreen &&
                            <div className='flex items-center h-full'>
                                <h2 className='text-xl whitespace-normal break-words mx-10'>{`${article.title} (${new Date(article.date).toLocaleDateString('tr')})`}</h2>
                            </div>
                        )}
                </div>
                {/* right */}
                <div className={'flex gap-1 ' + (fullScreen || ' flex-wrap')}>
                    {fullScreen && <div onClick={handleStarClick} className='flex items-center px-1'>
                        {article.isStarred ? (
                            <StarIcon style={{ fontSize: '1.7rem', color: '#FFD700' }} className="hover:scale-125" />
                        ) : (
                            <StarBorderIcon style={{ fontSize: '1.7rem', color: '#B0B0B0' }} className="hover:scale-125" />
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
                        onClick={() => setPreferencesModalOpen(true)}
                        title={t('preferences')}>
                        <EllipsisHorizontalIcon className="w-5 h-5" />
                    </FormatButton>
                    {fullScreen ?
                        <FormatButton onClick={() => setFullScreen(false)} title={t('exit full screen')}>
                            <ArrowsPointingInIcon className="w-5 h-5" />
                        </FormatButton>
                        :
                        <FormatButton onClick={() => setFullScreen(true)} title={t('full screen')}>
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
                    <div className='flex gap-1'>
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
        </div>
    );
};

export default ReadControls;
