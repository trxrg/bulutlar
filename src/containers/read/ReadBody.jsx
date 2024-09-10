import React, { useRef, useState, useContext } from "react";
import RichEditor from "./RichEditor";
import { ReadContext } from "../../store/read-context";

const ReadBody = React.forwardRef(({}, ref) => {

    const { article, updateMainText, updateExplanation, updateComment } = useContext(ReadContext);

    const [activeEditorRef, setActiveEditorRef] = useState();

    const mainTextEditorRef = useRef();
    const explanationEditorRef = useRef();
    const commentEditorRef = useRef();
    
    const addLink           = (url) => activeEditorRef && activeEditorRef.current.addLink(url);
    const toggleBold        = ()    => activeEditorRef && activeEditorRef.current.toggleBold();
    const toggleUnderline   = ()    => activeEditorRef && activeEditorRef.current.toggleUnderline();

    React.useImperativeHandle(ref, () => ({
        addLink,
        toggleBold,
        toggleUnderline
    }));

    return (
        <div>
            <div onClick={() => setActiveEditorRef(explanationEditorRef)} className='border border-gray-300 rounded-lg shadow-lg p-4'>
                <RichEditor htmlContent={article.explanation} rawContent={article.explanationJson} handleContentChange={updateExplanation} ref={explanationEditorRef}></RichEditor>
            </div>

            <div onClick={() => setActiveEditorRef(mainTextEditorRef)} className='my-6'>
                <RichEditor htmlContent={article.text} rawContent={article.textJson} handleContentChange={updateMainText} ref={mainTextEditorRef}></RichEditor>
            </div>

            <h3 onClick={() => setActiveEditorRef()} className="text-xl font-semibold my-4 pt-2 border-t border-gray-500">Comment</h3>

            <div onClick={() => setActiveEditorRef(commentEditorRef)} >
                <RichEditor htmlContent={article.comments[0].text} rawContent={article.comments[0].textJson} handleContentChange={updateComment} ref={commentEditorRef}></RichEditor>
            </div>
        </div>
    );
});

export default ReadBody;
