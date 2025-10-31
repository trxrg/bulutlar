import React, { useState, useContext, useEffect } from 'react';

import GeneralModal from '../../common/GeneralModal.jsx';
import { AppContext } from '../../../store/app-context.jsx';
import { DBContext } from '../../../store/db-context.jsx';
import { ReadContext } from '../../../store/read-context.jsx';
import ActionButton from '../../common/ActionButton.jsx';
import ArticleList from '../ArticleList.jsx';
import ArticleInfo from '../ArticleInfo.jsx';
import toastr from 'toastr';

const PickAndViewArticleModal = ({ isOpen, onRequestClose, articleId, onAdd, title, excludedArticleIds, showSelect = true, initialArticleId = null }) => {
    const [selectedArticleId, setSelectedArticleId] = useState(initialArticleId);
    const { translate: t, handleAddTab, htmlToText, setActiveScreen } = useContext(AppContext);
    const { getRelatedArticlesByArticleId, getArticleById } = useContext(DBContext);
    const readContext = useContext(ReadContext);
    const fontSize = readContext?.fontSize || 'text-base';

    const selectedArticle = getArticleById(selectedArticleId);
    const relatedArticles = getRelatedArticlesByArticleId(articleId);

    // Determine modal title based on mode and article
    const getModalTitle = () => {
        if (!showSelect && selectedArticle) {
            // View mode: use article title
            return selectedArticle.title;
        }
        // Add mode: use provided title or default
        return title || t('pick and view article');
    };

    // Update selectedArticleId when initialArticleId changes
    useEffect(() => {
        setSelectedArticleId(initialArticleId);
    }, [initialArticleId]);

    // Clear selected article when modal is closed (only in add mode, not view mode)
    useEffect(() => {
        if (!isOpen && showSelect) {
            setSelectedArticleId(null);
        }
    }, [isOpen, showSelect]);

    const handleAdd = async () => {
        if (!selectedArticleId) {
            toastr.warning(t('select an article'));
            return;
        }
        
        if (onAdd) {
            await onAdd(selectedArticleId);
        }
        
        onRequestClose();
    }

    const handleViewInNewTab = (e) => {
        console.log('view in new tab clicked');
        handleAddTab(e, selectedArticleId);
        setActiveScreen('tabs');
        onRequestClose();
    }

    const handleArticleChange = (articleId) => {
        setSelectedArticleId(articleId);
    }

    // Determine excluded articles based on context
    const getExcludedArticleIds = () => {
        if (excludedArticleIds) {
            return excludedArticleIds;
        }
        
        if (articleId) {
            return [articleId, ...relatedArticles.map(art => art.id)];
        }
        
        return [];
    }

    return (
        <GeneralModal 
            isOpen={isOpen} 
            onRequestClose={onRequestClose} 
            title={getModalTitle()}
            style={{ width: '80%', height: '80%' }}
        >
            <div className="flex flex-col h-full max-h-full overflow-hidden">
                {/* Top - Article Selection (conditional) */}
                {showSelect && (
                    <div className="flex-shrink-0 mb-4">
                        <ArticleList 
                            onArticleChange={handleArticleChange} 
                            excludedArticleIds={getExcludedArticleIds()}
                            onViewClicked={handleArticleChange} // Use the same handler for both selection and view
                            clearSearch={!isOpen && showSelect}
                        />
                    </div>
                )}

                {/* Middle - Article Content */}
                <div className={`flex-1 ${showSelect ? 'pt-4' : ''} min-h-0`} style={showSelect ? { borderTop: '1px solid var(--border-secondary)' } : {}}>
                    {selectedArticle ? (
                        <div className="h-full flex flex-col min-h-0">
                            {/* Article Header */}
                            <div className='flex-shrink-0 rounded-lg shadow-sm p-3 mb-3' style={{ backgroundColor: 'var(--bg-primary)' }}>
                                {showSelect && <h2 className={fontSize + " font-bold pb-2"}>{selectedArticle.title}</h2>}
                                <ArticleInfo article={selectedArticle} isEditable={false}></ArticleInfo>
                            </div>
                            
                            {/* Article Content */}
                            <div className={'flex-1 overflow-y-auto p-4 rounded-lg leading-relaxed ' + fontSize} style={{ backgroundColor: 'var(--bg-primary)' }}>
                                <article>
                                    {htmlToText(selectedArticle.text)}
                                </article>
                                {selectedArticle.comments && selectedArticle.comments[0] && htmlToText(selectedArticle.comments[0].text) &&
                                    <>
                                        <div className='mt-6 pt-4' style={{ borderTop: '1px solid var(--border-secondary)' }}>
                                            <h3 className='text-center font-semibold mb-3' style={{ color: 'var(--text-secondary)' }}>{t('comment')}</h3>
                                            <article className='p-3 rounded-md' style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                                                {htmlToText(selectedArticle.comments[0].text)}
                                            </article>
                                        </div>
                                    </>}
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center" style={{ color: 'var(--text-tertiary)' }}>
                            <p>{t('select an article to view its content')}</p>
                        </div>
                    )}
                </div>

                {/* Bottom - Action Buttons */}
                <div className='flex-shrink-0 flex justify-between items-center mt-4'>
                    {/* Left side - Open in new tab button */}
                    <div>
                        {selectedArticle && (
                            <ActionButton color={'blue'} onClick={handleViewInNewTab}>{t('open in new tab')}</ActionButton>
                        )}
                    </div>
                    
                    {/* Right side - Cancel and Add buttons */}
                    <div className='flex gap-2'>
                        {showSelect && (
                            <ActionButton color={'red'} onClick={onRequestClose}>{t('cancel')}</ActionButton>
                        )}
                        {onAdd && showSelect && (
                            <ActionButton color={'blue'} onClick={handleAdd}>{t('add')}</ActionButton>
                        )}
                    </div>
                </div>
            </div>
        </GeneralModal>
    );
};

export default PickAndViewArticleModal;
