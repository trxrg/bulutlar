import React, { useRef, useState, useContext } from "react";
import { articleApi, commentApi } from '../../../backend-adapter/BackendAdapter.js';
import { ReadContext } from "../../../store/read-context.jsx";
import { AppContext } from "../../../store/app-context.jsx";
import AddLinkModal from "../modals/AddLinkModal.jsx";
import RichEditor from "./editor/RichEditor.jsx";
import ContextMenu from "../../common/ContextMenu.jsx";
import InlineToolbar from "./editor/InlineToolbar.jsx";
import toastr from "toastr";

const ReadContent = () => {

    const mainTextEditorRef = useRef(null);
    const explanationEditorRef = useRef(null);
    const commentEditorRef = useRef(null);

    const [activeEditorRef, setActiveEditorRef] = useState(mainTextEditorRef);
    const { article, readContentRef, fontSize, editable, syncArticleFromBE, isAddLinkModalOpen, setAddLinkModalOpen, contextMenuIsOpen, contextMenuPosition, setContextMenuIsOpen } = useContext(ReadContext);
    const { translate: t } = useContext(AppContext);

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

    React.useImperativeHandle(readContentRef, () => ({
        addLink,
        saveContent,
        resetContent,
        toggleStyle,
        toggleBlockType,
        handleInsertImageClicked,
    }));

    const addRelatedArticleWhenLinkAdded = async (url) => {
        const id = parseInt(url.substring(8));
        const relatedArticle = await articleApi.getById(id);
        if (relatedArticle) {
            await articleApi.addRelatedArticle(article.id, relatedArticle.id);
            await syncArticleFromBE();
        }
    }

    const handleAddLink = async (url) => {
        addRelatedArticleWhenLinkAdded(url); // only relevant for article links
        addLink(url);
        setAddLinkModalOpen(false);
    }

    const isHtmlStringEmpty = (htmlString) => {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlString;

        // Check if the text content is empty
        return !tempDiv.textContent.trim();
    }

    return (
        <div className="flex flex-col items-center">
            <div className={`leading-loose w-full ${fontSize} pb-5`}>
                {(!isHtmlStringEmpty(article.explanation) || editable) && <div onClick={() => setActiveEditorRef(explanationEditorRef)} className='border-b border-gray-700 p-4'>
                    <RichEditor prompt={t('explanation prompt')} htmlContent={article.explanation} rawContent={article.explanationJson} handleContentChange={updateExplanation} editable={editable} ref={explanationEditorRef}></RichEditor>
                </div>}
                <div onClick={() => setActiveEditorRef(mainTextEditorRef)} className='my-6'>
                    <RichEditor prompt={t('maintext prompt')} htmlContent={article.text} rawContent={article.textJson} handleContentChange={updateMainText} editable={editable} ref={mainTextEditorRef}></RichEditor>
                </div>
                {((article.comments[0] && !isHtmlStringEmpty(article.comments[0].text)) || editable) &&
                    <div>
                        <div>
                            <h3 onClick={() => setActiveEditorRef()} className={"text-center font-semibold my-4 pt-2 border-t border-gray-500 " + fontSize}>{t('comment')}</h3>
                        </div>
                        <div onClick={() => setActiveEditorRef(commentEditorRef)} >
                            <RichEditor prompt={t('comment prompt')} htmlContent={article.comments[0]?.text} rawContent={article.comments[0]?.textJson} handleContentChange={updateComment} editable={editable} ref={commentEditorRef}></RichEditor>
                        </div>
                    </div>}
            </div>
            <AddLinkModal isOpen={isAddLinkModalOpen} onRequestClose={() => setAddLinkModalOpen(false)} handleAdd={handleAddLink} />
            <ContextMenu isOpen={contextMenuIsOpen} onClose={() => setContextMenuIsOpen(false)} position={contextMenuPosition}>
                <InlineToolbar />
            </ContextMenu>
        </div>
    );
};

export default ReadContent;
