import React, { useRef, useState, useContext, useEffect } from "react";

import { updateArticleMainText, updateArticleExplanation, updateCommentText, addImageToArticle, getImageData } from '../../backend-adapter/BackendAdapter.js';
import RichEditor from "./RichEditor";
import { ReadContext } from "../../store/read-context";
import ImageModal from "./ImageModal.jsx";

const ReadBody = () => {

    const { article, readBodyRef, fontSize, editable, syncArticleFromBE } = useContext(ReadContext);

    const [imageDatasLoaded, setImageDatasLoaded] = useState(false);
    const [imageDatas, setImageDatas] = useState([]);
    const [activeEditorRef, setActiveEditorRef] = useState();
    const [selectedImage, setSelectedImage] = useState();
    const [imageModalIsOpen, setImageModalIsOpen] = useState(false);

    const fileInputRef = useRef(null);
    const mainTextEditorRef = useRef();
    const explanationEditorRef = useRef();
    const commentEditorRef = useRef();

    const fetchImageDatas = async () => {
        console.log('fetchImageDatas called');
        try {
            const datas = await Promise.all(article.images.map(async image => ({ ...image, data: await getImageData(image.id) })));
            setImageDatas(datas);
            setImageDatasLoaded(true);
        } catch (err) {
            console.error('error in fetchImageDatas', err);
        }
    }

    const updateMainText = async (html, json) => {
        await updateArticleMainText(article.id, { html, json });
        await syncArticleFromBE();
    }

    const updateExplanation = async (html, json) => {
        await updateArticleExplanation(article.id, { html, json });
        await syncArticleFromBE();
    }

    const updateComment = async (html, json) => {
        await updateCommentText(article.comments[0].id, { html, json });
        await syncArticleFromBE();
    }

    const updateArticleContent = async (explanation, mainText, comment) => {
        await updateArticleExplanation(article.id, explanation);
        await updateArticleMainText(article.id, mainText);
        await updateCommentText(article.comments[0].id, comment);
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

    // Handle file selection
    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (file) {

            console.log('file:');
            console.log(file);

            await addImageToArticle(article.id, { name: file.name, path: file.path, type: file.type, size: file.size });
            syncArticleFromBE();
        }
    };

    const addImage = () => {
        fileInputRef.current.click();
    };

    useEffect(() => {
        fetchImageDatas();
    }, [article]);

    const openImageModal = (imageData) => {
        setSelectedImage(imageData);
        setImageModalIsOpen(true);
    };

    const closeImageModal = () => {
        setImageModalIsOpen(false);
    }

    return (
        <div className={`overflow-auto h-full px-6 py-2 ${fontSize}`}>
            <div onClick={() => setActiveEditorRef(explanationEditorRef)} className='border border-gray-300 rounded-lg shadow-lg p-4'>
                <RichEditor name={'explanation'} htmlContent={article.explanation} rawContent={article.explanationJson} handleContentChange={updateExplanation} editable={editable} ref={explanationEditorRef}></RichEditor>
            </div>
            <div onClick={() => setActiveEditorRef(mainTextEditorRef)} className='my-6'>
                <RichEditor name={'maintext'} htmlContent={article.text} rawContent={article.textJson} handleContentChange={updateMainText} editable={editable} ref={mainTextEditorRef}></RichEditor>
            </div>
            <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                ref={fileInputRef}
                style={{ display: 'none' }}
            />
            {imageDatasLoaded && imageDatas.map(image =>
                <div key={image.id} className="mt-4" onClick={() => openImageModal(image.data)}>
                    <img
                        src={image.data}
                        alt={image.description ? image.description : "image"}
                        className="max-w-full h-auto border border-gray-300 rounded"
                    />
                </div>
            )}
            <div>
                <h3 onClick={() => setActiveEditorRef()} className="text-xl font-semibold my-4 pt-2 border-t border-gray-500">Comment</h3>
            </div>
            <div onClick={() => setActiveEditorRef(commentEditorRef)} >
                <RichEditor name={'comment'} htmlContent={article.comments[0].text} rawContent={article.comments[0].textJson} handleContentChange={updateComment} editable={editable} ref={commentEditorRef}></RichEditor>
            </div>

            <ImageModal
                isOpen={imageModalIsOpen}
                onRequestClose={closeImageModal}
                imageUrl={selectedImage}
            />
        </div>
    );
};

export default ReadBody;
