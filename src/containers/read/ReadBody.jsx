import React, { useRef, useState, useContext } from "react";
import RichEditor from "./RichEditor";
import { ReadContext } from "../../store/read-context";

const ReadBody = () => {

    const { article, updateMainText, updateExplanation, updateComment, readBodyRef, fontSize } = useContext(ReadContext);

    const [activeEditorRef, setActiveEditorRef] = useState();

    const mainTextEditorRef = useRef();
    const explanationEditorRef = useRef();
    const commentEditorRef = useRef();

    const addLink = (url) => activeEditorRef && activeEditorRef.current.addLink(url);
    const toggleBold = () => activeEditorRef && activeEditorRef.current.toggleBold();
    const toggleUnderline = () => activeEditorRef && activeEditorRef.current.toggleUnderline();


    React.useImperativeHandle(readBodyRef, () => ({
        addLink,
        toggleBold,
        toggleUnderline
    }));

    return (
        <div className={`${fontSize}`}>
            <div onClick={() => setActiveEditorRef(explanationEditorRef)} className='border border-gray-300 rounded-lg shadow-lg p-4'>
                <RichEditor name={'explanation'} htmlContent={article.explanation} rawContent={article.explanationJson} handleContentChange={updateExplanation} ref={explanationEditorRef}></RichEditor>
            </div>
            <div onClick={() => setActiveEditorRef(mainTextEditorRef)} className='my-6'>
                <RichEditor name={'maintext'} htmlContent={article.text} rawContent={article.textJson} handleContentChange={updateMainText} ref={mainTextEditorRef}></RichEditor>
            </div>
            <div>
                <h3 onClick={() => setActiveEditorRef()} className="text-xl font-semibold my-4 pt-2 border-t border-gray-500">Comment</h3>
            </div>
            <div onClick={() => setActiveEditorRef(commentEditorRef)} >
                <RichEditor name={'comment'} htmlContent={article.comments[0].text} rawContent={article.comments[0].textJson} handleContentChange={updateComment} ref={commentEditorRef}></RichEditor>
            </div>
        </div>
    );
};

export default ReadBody;
