import React, { useRef, useState, useContext } from "react";
import RichEditor from "./RichEditor";
import { ReadContext } from "../../store/read-context";

const ReadBody = () => {

    console.log('rendering readbody');

    const { article, updateMainText, updateExplanation, updateComment, updateArticleContent, readBodyRef, fontSize, editable } = useContext(ReadContext);

    console.log('article in readbody:');
    console.log(article);

    const [activeEditorRef, setActiveEditorRef] = useState();

    const mainTextEditorRef = useRef();
    const explanationEditorRef = useRef();
    const commentEditorRef = useRef();

    const addLink = (url) => activeEditorRef && activeEditorRef.current.addLink(url);
    const toggleStyle = (style) => activeEditorRef && activeEditorRef.current.toggleInlineStyle(style);
    const saveContent = () => {
        updateArticleContent(explanationEditorRef.current.getContent(), mainTextEditorRef.current.getContent(), commentEditorRef.current.getContent());
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
    }));

    return (
        <div className={`overflow-auto h-full px-6 py-2 ${fontSize}`}>
            <div onClick={() => setActiveEditorRef(explanationEditorRef)} className='border border-gray-300 rounded-lg shadow-lg p-4'>
                <RichEditor name={'explanation'} htmlContent={article.explanation} rawContent={article.explanationJson} handleContentChange={updateExplanation} editable={editable} ref={explanationEditorRef}></RichEditor>
            </div>
            <div onClick={() => setActiveEditorRef(mainTextEditorRef)} className='my-6'>
                <RichEditor name={'maintext'} htmlContent={article.text} rawContent={article.textJson} handleContentChange={updateMainText} editable={editable} ref={mainTextEditorRef}></RichEditor>
            </div>
            <div>
                <h3 onClick={() => setActiveEditorRef()} className="text-xl font-semibold my-4 pt-2 border-t border-gray-500">Comment</h3>
            </div>
            <div onClick={() => setActiveEditorRef(commentEditorRef)} >
                <RichEditor name={'comment'} htmlContent={article.comments[0].text} rawContent={article.comments[0].textJson} handleContentChange={updateComment} editable={editable} ref={commentEditorRef}></RichEditor>
            </div>
        </div>
    );
};

export default ReadBody;
