import React, { useState, useContext } from 'react';
import { PencilIcon, PhotoIcon, ChevronLeftIcon, ChevronRightIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon, ListBulletIcon, NumberedListIcon } from '@heroicons/react/24/outline';
import { ReadContext } from '../../../store/read-context.jsx';
import { AppContext } from '../../../store/app-context.jsx';
import FormatButton from '../../common/FormatButton.jsx';
import ActionButton from '../../common/ActionButton.jsx';
import ConfirmModal from '../../common/ConfirmModal.jsx';
import { articleApi } from '../../../backend-adapter/BackendAdapter.js';
import ArticleInfo from '../ArticleInfo.jsx';

const ReadControls = () => {

    const { article, increaseFontSize, decreaseFontSize, toggleBlockType, setEditable, editable, saveContent, resetContent, handleInsertImageClicked, rightPanelCollapsed, setRightPanelCollapsed, leftPanelCollapsed, setLeftPanelCollapsed } = useContext(ReadContext);

    const { beforeDeleteArticle, afterDeleteArticle, fullScreen, setFullScreen, translate: t } = useContext(AppContext);

    const [isDeleteConfirmModalOpen, setDeleteConfirmModalOpen] = useState(false);

    const handleToggleBlockType = (event, blockType) => {
        event.preventDefault();
        toggleBlockType(blockType);
    }

    return (
        <div className='flex flex-wrap justify-between p-2 shadow-lg bg-white'>
            {/* left */}
            <div className='flex flex-wrap gap-1'>
                {leftPanelCollapsed ?
                    <FormatButton onClick={() => setLeftPanelCollapsed(false)}>
                        <ChevronRightIcon className="w-5 h-5" />
                    </FormatButton>
                    :
                    <FormatButton onClick={() => setLeftPanelCollapsed(true)}>
                        <ChevronLeftIcon className="w-5 h-5" />
                    </FormatButton>}
                <FormatButton onClick={decreaseFontSize}>A-</FormatButton>
                <FormatButton onClick={increaseFontSize}>A+</FormatButton>
            </div>
            {/* center */}
            <div className='flex flex-wrap gap-1'>
                {editable ?
                    <div className='flex flex-wrap gap-1'>
                        <FormatButton onMouseDown={(e) => handleToggleBlockType(e, 'unordered-list-item')}><ListBulletIcon className='w-6 h-6' /></FormatButton>
                        <FormatButton onMouseDown={(e) => handleToggleBlockType(e, 'ordered-list-item')}><NumberedListIcon className='w-6 h-6' /></FormatButton>
                        <FormatButton onClick={handleInsertImageClicked}><PhotoIcon className="w-5 h-5" /></FormatButton>                        
                        <ActionButton onClick={() => setDeleteConfirmModalOpen(true)} color='red'>{t('delete article')}</ActionButton>
                        <ActionButton
                            onClick={() => { saveContent(); setEditable(false); }}
                            color={'blue'}>
                            {t('save')}
                        </ActionButton>
                        <ActionButton
                            onClick={() => { resetContent(); setEditable(false); }}
                            color={'blue'}>
                            {t('cancel')}
                        </ActionButton>
                    </div>
                    :
                    (fullScreen &&
                        <div className='flex flex-row items-center text-xl'>
                            <h2>{`${article.title} (${new Date(article.date).toLocaleDateString('tr')})`}</h2>
                        </div>)}
            </div>
            {/* right */}
            <div className='flex flex-wrap gap-1'>
                {!editable &&
                    <FormatButton
                        onClick={() => setEditable(true)}
                    ><PencilIcon className="w-5 h-5" /></FormatButton>
                }
                {fullScreen ?
                    <FormatButton onClick={() => setFullScreen(false)}>
                        <ArrowsPointingInIcon className="w-5 h-5" />
                    </FormatButton>
                    :
                    <FormatButton onClick={() => setFullScreen(true)}>
                        <ArrowsPointingOutIcon className="w-5 h-5" />
                    </FormatButton>}
                {rightPanelCollapsed ?
                    <FormatButton onClick={() => setRightPanelCollapsed(false)}>
                        <ChevronLeftIcon className="w-5 h-5" />
                    </FormatButton>
                    :
                    <FormatButton onClick={() => setRightPanelCollapsed(true)}>
                        <ChevronRightIcon className="w-5 h-5" />
                    </FormatButton>}
            </div>
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
        </div>
    );
};

export default ReadControls;
