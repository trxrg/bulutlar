import React, { useRef, useState, useContext, useEffect } from "react";

import { articleApi, commentApi, imageApi, } from '../../../backend-adapter/BackendAdapter.js';
import RichEditor from "./editor/RichEditor.jsx";
import { ReadContext } from "../../../store/read-context.jsx";
import { AppContext } from "../../../store/app-context.jsx";
import ImageModal from "../../image/ImageModal.jsx";
import ImageInput from "../../image/ImageInput.jsx";
import toastr from "toastr";
import RichEditor2 from "./RichEditor2.jsx";
import MyEditor from "./MyEditor.jsx";

const ReadContent = () => {

    const { article, readContentRef, fontSize, editable, syncArticleFromBE } = useContext(ReadContext);
    const { translate: t } = useContext(AppContext);

    const imageInputRef = useRef(null);
    const mainTextEditorRef = useRef(null);
    const explanationEditorRef = useRef(null);
    const commentEditorRef = useRef(null);

    const [imageDatasLoaded, setImageDatasLoaded] = useState(false);
    const [imageDatas, setImageDatas] = useState([]);
    const [activeEditorRef, setActiveEditorRef] = useState(mainTextEditorRef);
    const [selectedImage, setSelectedImage] = useState();
    const [imageModalIsOpen, setImageModalIsOpen] = useState(false);

    const fetchImageDatas = async () => {
        console.log('fetchImageDatas called');
        try {
            const datas = await Promise.all(article.images.map(async image => ({ ...image, data: await imageApi.getDataById(image.id) })));
            setImageDatas(datas);
            setImageDatasLoaded(true);
        } catch (err) {
            console.error('error in fetchImageDatas', err);
        }
    }

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
        comment && await commentApi.updateText(article.comments[0].id, comment);
        await syncArticleFromBE();
    }

    const addLink = (url) => activeEditorRef && activeEditorRef.current.addLink(url);

    const toggleStyle = (style) => activeEditorRef && activeEditorRef.current.toggleInlineStyle(style);
    const toggleBlockType = (blockType) => activeEditorRef && activeEditorRef.current.toggleBlockType(blockType);

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

    React.useImperativeHandle(readContentRef, () => ({
        addLink,
        saveContent,
        resetContent,
        toggleStyle,
        toggleBlockType,
        addImage,
    }));

    const handleImageSelect = async (images) => {
        const promises = [];
        images.forEach((image) => promises.push(articleApi.addImage(article.id, image)));
        await Promise.all(promises);
        syncArticleFromBE();
    };

    const handleImageSelect2 = async (images) => {

        try {
            images.forEach(async (image) => {
                if (activeEditorRef) {
                    const imageEntity = await articleApi.addImage(article.id, image);
                    activeEditorRef.current.addImage(imageEntity);
                }
            });
        } catch (error) {
            console.error('Error adding image:', error);
            toastr.error(t('errorAddingImage'));
        }
        syncArticleFromBE();
    }


    const addImage = () => {
        imageInputRef.current.addImage();
    };

    useEffect(() => {
        fetchImageDatas();
    }, [article]);

    const openImageModal = (image) => {
        setSelectedImage(image);
        setImageModalIsOpen(true);
    };

    const closeImageModal = () => {
        setImageModalIsOpen(false);
    }

    const isHtmlStringEmpty = (htmlString) => {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlString;

        // Check if the text content is empty
        return !tempDiv.textContent.trim();
    }

    return (
        <div className="flex flex-col items-center bg-white">
            <div className={`leading-loose p-2 max-w-7xl w-full ${fontSize}`}>
                {(!isHtmlStringEmpty(article.explanation) || editable) && <div onClick={() => setActiveEditorRef(explanationEditorRef)} className='border-b border-gray-700 p-4'>
                    <RichEditor name={'explanation'} htmlContent={article.explanation} rawContent={article.explanationJson} handleContentChange={updateExplanation} editable={editable} ref={explanationEditorRef}></RichEditor>
                </div>}
                <div onClick={() => setActiveEditorRef(mainTextEditorRef)} className='my-6'>
                    <RichEditor name={'maintext'} htmlContent={article.text} rawContent={article.textJson} handleContentChange={updateMainText} editable={editable} ref={mainTextEditorRef}></RichEditor>
                </div>
                {article.comments[0] && (!isHtmlStringEmpty(article.comments[0].text) || editable) &&
                    <div>
                        <div>
                            <h3 onClick={() => setActiveEditorRef()} className="text-xl font-semibold my-4 pt-2 border-t border-gray-500">{t('comment')}</h3>
                        </div>
                        <div onClick={() => setActiveEditorRef(commentEditorRef)} >
                            <RichEditor name={'comment'} htmlContent={article.comments[0].text} rawContent={article.comments[0].textJson} handleContentChange={updateComment} editable={editable} ref={commentEditorRef}></RichEditor>
                        </div>
                    </div>}

                {imageDatasLoaded &&
                    <ImageModal
                        isOpen={imageModalIsOpen}
                        onClose={closeImageModal}
                        image={selectedImage}
                    />}

                <ImageInput onSelectImages={handleImageSelect2} ref={imageInputRef}></ImageInput>
                <div className='p-5'></div>
            </div>
        </div>
    );
};

export default ReadContent;
