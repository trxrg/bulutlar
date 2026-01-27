import React, { useRef, useState, useContext, useEffect } from "react";
import { articleApi, commentApi } from '../../../backend-adapter/BackendAdapter.js';
import { ReadContext } from "../../../store/read-context.jsx";
import { AppContext } from "../../../store/app-context.jsx";
import { DBContext } from "../../../store/db-context.jsx";
import PickAndViewArticleModal from "../modals/PickAndViewArticleModal.jsx";
import RichEditor from "./editor/RichEditor.jsx";
import ContextMenu from "../../common/ContextMenu.jsx";
import InlineToolbar from "./editor/InlineToolbar.jsx";
import ArticleErrorFallback from "./ArticleErrorFallback.jsx";
import toastr from "toastr";

const ReadContent = () => {

    const mainTextEditorRef = useRef(null);
    const explanationEditorRef = useRef(null);
    const commentEditorRef = useRef(null);

    const [activeEditorRef, setActiveEditorRef] = useState(mainTextEditorRef);
    const [hasContentError, setHasContentError] = useState(false);
    
    const { article, readContentRef, fontSize, editable, syncArticleFromBE, 
        isAddLinkModalOpen, setAddLinkModalOpen, contextMenuIsOpen,
        contextMenuPosition, setContextMenuIsOpen,
        showExplanationEditor, setShowExplanationEditor,
        showCommentEditor, setShowCommentEditor,
        hasExplanationContent, hasCommentContent, isHtmlStringEmpty } = useContext(ReadContext);

    const { translate: t, closeTab, editorSettings } = useContext(AppContext);
    const { fetchAllData } = useContext(DBContext);

    // Map editor settings to Tailwind classes
    const lineHeightMap = {
        'tight': 'leading-tight',
        'normal': 'leading-normal',
        'relaxed': 'leading-relaxed',
        'loose': 'leading-loose',
        'very loose': 'leading-loose'
    };

    const lineHeight = lineHeightMap[editorSettings?.lineHeight] || 'leading-loose';
    const fontFamily = editorSettings?.fontFamily || 'system-ui';

    const updateMainText = async (html, json) => {
        await articleApi.updateMainText(article.id, { html, json });
        await syncArticleFromBE();
    }

    const updateExplanation = async (html, json) => {
        await articleApi.updateExplanation(article.id, { html, json });
        await syncArticleFromBE();
    }

    const updateComment = async (html, json) => {
        await commentApi.updateText(article.comments[0].id, { html, json });
        await syncArticleFromBE();
    }

    const updateArticleContent = async (explanation, mainText, comment) => {
        explanation && await articleApi.updateExplanation(article.id, explanation);
        mainText && await articleApi.updateMainText(article.id, mainText);
        comment && await articleApi.updateComment(article.id, comment);
        await syncArticleFromBE();
    }

    const saveContent = async () => {
        const explanation = explanationEditorRef.current ? explanationEditorRef.current.getContent() : null;
        const mainText = mainTextEditorRef.current ? mainTextEditorRef.current.getContent() : null;
        const comment = commentEditorRef.current ? commentEditorRef.current.getContent() : null;

        await updateArticleContent(explanation, mainText, comment);
    }

    const resetContent = () => {
        explanationEditorRef && explanationEditorRef.current && explanationEditorRef.current.resetContent();
        mainTextEditorRef && mainTextEditorRef.current && mainTextEditorRef.current.resetContent();
        commentEditorRef && commentEditorRef.current && commentEditorRef.current.resetContent();
    }

    const addLink = (url) => activeEditorRef && activeEditorRef.current.addLink(url);
    const addQuote = () => activeEditorRef && activeEditorRef.current.addQuote();
    const toggleStyle = (style) => activeEditorRef && activeEditorRef.current.toggleInlineStyle(style);
    const toggleBlockType = (blockType) => activeEditorRef && activeEditorRef.current.toggleBlockType(blockType);


    const handleInsertImageClicked = async () => {
        try {
            const imageEntities = await articleApi.openDialogToAddImages(article.id);

            if (!imageEntities)
                return;

            for (const imageEntity of imageEntities) {
                if (activeEditorRef) {
                    console.info('Inserting image to article:', imageEntity);
                    activeEditorRef.current.addImage(imageEntity);
                }
            }
        } catch (error) {
            console.error('Error inserting image:', error);
            toastr.error(t('errorAddingImage'));
        }
        syncArticleFromBE();
    };

    const handleInsertAudioClicked = async () => {
        try {
            const audioEntities = await articleApi.openDialogToAddAudios(article.id);

            if (!audioEntities)
                return;

            for (const audioEntity of audioEntities) {
                if (activeEditorRef) {
                    console.info('Inserting audio to article:', audioEntity);
                    activeEditorRef.current.addAudio(audioEntity);
                }
            }
        } catch (error) {
            console.error('Error inserting audio:', error);
            toastr.error(t('errorAddingAudio'));
        }
        syncArticleFromBE();
    };

    const handleInsertVideoClicked = async () => {
        try {
            const videoEntities = await articleApi.openDialogToAddVideos(article.id);

            if (!videoEntities)
                return;

            for (const videoEntity of videoEntities) {
                if (activeEditorRef) {
                    console.info('Inserting video to article:', videoEntity);
                    activeEditorRef.current.addVideo(videoEntity);
                }
            }
        } catch (error) {
            console.error('Error inserting video:', error);
            toastr.error(t('errorAddingVideo'));
        }
        syncArticleFromBE();
    };

    React.useImperativeHandle(readContentRef, () => ({
        addLink,
        addQuote,
        saveContent,
        resetContent,
        toggleStyle,
        toggleBlockType,
        handleInsertImageClicked,
        handleInsertAudioClicked,
        handleInsertVideoClicked,
    }));

    const addRelatedArticleWhenLinkAdded = async (url) => {
        const id = parseInt(url.substring(8));
        const relatedArticle = await articleApi.getById(id);
        if (relatedArticle) {
            await articleApi.addRelatedArticle(article.id, relatedArticle.id);
            await syncArticleFromBE();
        }
    }

    const handleAddLink = async (selectedArticleId) => {
        const url = "article:" + selectedArticleId;
        addRelatedArticleWhenLinkAdded(url); // only relevant for article links
        addLink(url);
        setAddLinkModalOpen(false);
    }

    // Handle blur for explanation editor - hide if empty
    const handleExplanationBlur = () => {
        // Use setTimeout to allow the content to be checked after any final changes
        setTimeout(() => {
            if (explanationEditorRef.current) {
                const content = explanationEditorRef.current.getContent();
                if (isHtmlStringEmpty(content?.html)) {
                    setShowExplanationEditor(false);
                }
            }
        }, 100);
    };

    // Handle blur for comment editor - hide if empty
    const handleCommentBlur = () => {
        // Use setTimeout to allow the content to be checked after any final changes
        setTimeout(() => {
            if (commentEditorRef.current) {
                const content = commentEditorRef.current.getContent();
                if (isHtmlStringEmpty(content?.html)) {
                    setShowCommentEditor(false);
                }
            }
        }, 100);
    };

    // Check if any editor has errors after component mounts
    useEffect(() => {
        // Small delay to ensure refs are populated
        const checkErrors = setTimeout(() => {
            const hasError = 
                (mainTextEditorRef.current?.hasError && mainTextEditorRef.current.hasError()) ||
                (explanationEditorRef.current?.hasError && explanationEditorRef.current.hasError()) ||
                (commentEditorRef.current?.hasError && commentEditorRef.current.hasError());
            
            if (hasError) {
                setHasContentError(true);
            }
        }, 100);

        return () => clearTimeout(checkErrors);
    }, [article.id]);

    const handleDeleteArticle = async () => {
        try {
            await articleApi.deleteArticle(article.id);
            closeTab(article.id);
            await fetchAllData();
        } catch (error) {
            console.error('Failed to delete article:', error);
        }
    };

    // If there's a content error, show the error UI
    if (hasContentError) {
        return (
            <ArticleErrorFallback 
                article={article} 
                onDelete={handleDeleteArticle}
                onClose={() => closeTab(article.id)}
            />
        );
    }

    return (
        <div className="flex flex-col items-center">
            <div 
                className={`read-content-container w-full ${fontSize} ${lineHeight} pb-5 px-2`}
                style={{ fontFamily: fontFamily }}
            >
                {/* Explanation Editor - show if has content OR if manually shown while editable */}
                {(hasExplanationContent || (editable && showExplanationEditor)) && (
                    <div 
                        onClick={() => setActiveEditorRef(explanationEditorRef)} 
                        className='border-b border-gray-700 p-4'
                        onBlur={!hasExplanationContent ? handleExplanationBlur : undefined}
                    >
                        <RichEditor prompt={t('explanation prompt')} htmlContent={article.explanation} rawContent={article.explanationJson} handleContentChange={updateExplanation} editable={editable} ref={explanationEditorRef} editorId="explanation"></RichEditor>
                    </div>
                )}
                <div onClick={() => setActiveEditorRef(mainTextEditorRef)} className='my-6'>
                    <RichEditor prompt={t('maintext prompt')} htmlContent={article.text} rawContent={article.textJson} handleContentChange={updateMainText} editable={editable} ref={mainTextEditorRef} editorId="mainText"></RichEditor>
                </div>
                {/* Comment Editor - show if has content OR if manually shown while editable */}
                {(hasCommentContent || (editable && showCommentEditor)) && (
                    <div className="mt-8">
                        <div>
                            <h3 onClick={() => setActiveEditorRef()} className={"text-center font-semibold my-4 pt-2 border-t border-gray-500 " + fontSize}>{t('comment')}</h3>
                        </div>
                        <div 
                            onClick={() => setActiveEditorRef(commentEditorRef)} 
                            className="px-2 rounded-md"
                            onBlur={!hasCommentContent ? handleCommentBlur : undefined}
                            style={{                                 
                                border: '4px solid rgba(128, 128, 128, 0.5)'
                            }}
                        >
                            <RichEditor prompt={t('comment prompt')} htmlContent={article.comments[0]?.text} rawContent={article.comments[0]?.textJson} handleContentChange={updateComment} editable={editable} ref={commentEditorRef} editorId="comment"></RichEditor>
                        </div>
                    </div>
                )}
            </div>
            <PickAndViewArticleModal 
                isOpen={isAddLinkModalOpen} 
                onRequestClose={() => setAddLinkModalOpen(false)} 
                title={t('add link')}
                showSelect={true}
                excludedArticleIds={[article.id]}
                onAdd={handleAddLink}
            />
            <ContextMenu isOpen={contextMenuIsOpen} onClose={() => setContextMenuIsOpen(false)} position={contextMenuPosition}>
                <InlineToolbar />
            </ContextMenu>
        </div>
    );
};

export default ReadContent;
