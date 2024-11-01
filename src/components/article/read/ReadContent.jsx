import React, { useRef, useState, useContext, useEffect } from "react";

import { articleApi, commentApi, imageApi, } from '../../../backend-adapter/BackendAdapter.js';
import RichEditor from "./RichEditor.jsx";
import { ReadContext } from "../../../store/read-context.jsx";
import { AppContext } from "../../../store/app-context.jsx";
import ImageModal from "../../image/ImageModal.jsx";
import ImageInput from "../../image/ImageInput.jsx";

const ReadContent = () => {

    const { article, readBodyRef, fontSize, editable, syncArticleFromBE } = useContext(ReadContext);
    const { translate:t } = useContext(AppContext);

    const [imageDatasLoaded, setImageDatasLoaded] = useState(false);
    const [imageDatas, setImageDatas] = useState([]);
    const [activeEditorRef, setActiveEditorRef] = useState();
    const [selectedImage, setSelectedImage] = useState();
    const [imageModalIsOpen, setImageModalIsOpen] = useState(false);

    const imageInputRef = useRef(null);
    const mainTextEditorRef = useRef();
    const explanationEditorRef = useRef();
    const commentEditorRef = useRef();

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
        await articleApi.updateExplanation(article.id, explanation);
        await articleApi.updateMainText(article.id, mainText);
        await commentApi.updateText(article.comments[0].id, comment);
        await syncArticleFromBE();
    }

    const addLink = (url) => activeEditorRef && activeEditorRef.current.addLink(url);

    const toggleStyle = (style) => activeEditorRef && activeEditorRef.current.toggleInlineStyle(style);

    const saveContent = async () => {
        await updateArticleContent(explanationEditorRef.current.getContent(), mainTextEditorRef.current.getContent(), commentEditorRef.current.getContent());
    }

    const resetContent = () => {
        explanationEditorRef.current.resetContent();
        mainTextEditorRef.current.resetContent();
        commentEditorRef.current.resetContent();
    }

    React.useImperativeHandle(readBodyRef, () => ({
        addLink,
        saveContent,
        resetContent,
        toggleStyle,
        addImage,
    }));

    const handleImageSelect = async (images) => {
        const promises = [];
        images.forEach((image) => promises.push(articleApi.addImage(article.id, image)));
        await Promise.all(promises);
        syncArticleFromBE();
    };

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
        <div className={`leading-normal p-2 ${fontSize}`}>
            {(!isHtmlStringEmpty(article.explanation) || editable) && <div onClick={() => setActiveEditorRef(explanationEditorRef)} className='rounded-lg shadow-lg p-4'>
                <RichEditor name={'explanation'} htmlContent={article.explanation} rawContent={article.explanationJson} handleContentChange={updateExplanation} editable={editable} ref={explanationEditorRef}></RichEditor>
            </div>}
            <div onClick={() => setActiveEditorRef(mainTextEditorRef)} className='my-6'>
                <RichEditor name={'maintext'} htmlContent={article.text} rawContent={article.textJson} handleContentChange={updateMainText} editable={editable} ref={mainTextEditorRef}></RichEditor>
            </div>
            <div className="flex flex-col justify-center items-center w-full">
                {imageDatasLoaded && imageDatas.map(image =>
                    <div key={image.id} className="my-4 w-full max-w-4xl" onClick={() => openImageModal(image)}>
                        <img
                            src={image.data}
                            alt={image.description ? image.description : "image"}
                            className="w-full h-auto rounded cursor-pointer"
                        />
                    </div>
                )}
            </div>
            {(!isHtmlStringEmpty(article.comments[0].text) || editable) &&
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

            <ImageInput onSelectImages={handleImageSelect} ref={imageInputRef}></ImageInput>
            <div className='p-5'></div>
        </div>
    );
};

export default ReadContent;
