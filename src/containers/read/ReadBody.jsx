import React, { useRef, useContext } from "react";
import RichEditor from "./RichEditor";
import { ReadContext } from "../../store/read-context";

const ReadBody = React.forwardRef(({}, ref) => {

    const { article, setExplanationState, setMainTextState, setCommentState } = useContext(ReadContext);

    const mainTextEditorRef = useRef();
    const explanationEditorRef = useRef();
    const commentEditorRef = useRef();

    const editors = [mainTextEditorRef, explanationEditorRef, commentEditorRef];

    const addLink = (url) => editors.forEach((editor) => editor.current.addLink(url));
    const toggleBold = () => editors.forEach((editor) => editor.current.toggleBold());
    const toggleUnderline = () => editors.forEach((editor) => editor.current.toggleUnderline());

    React.useImperativeHandle(ref, () => ({
        addLink,
        toggleBold,
        toggleUnderline
    }));

    const handleExplanationChange   = (html, json) => setExplanationState({html, json});    
    const handleMainTextChange      = (html, json) => setMainTextState({html, json});    
    const handleCommentChange       = (html, json) => setCommentState({html, json});

    return (
        <div>
            <div className='border border-gray-300 rounded-lg shadow-lg p-4'>
                <RichEditor htmlContent={article.explanation} rawContent={article.explanationJson} handleContentChange={handleExplanationChange} ref={explanationEditorRef}></RichEditor>
            </div>

            <div className='my-6'>
                <RichEditor htmlContent={article.text} rawContent={article.textJson} handleContentChange={handleMainTextChange} ref={mainTextEditorRef}></RichEditor>
            </div>

            <h3 className="text-xl font-semibold my-4 pt-2 border-t border-gray-500">Comment</h3>

            <div>
                <RichEditor htmlContent={article.comments[0].text} rawContent={article.comments[0].textJson} handleContentChange={handleCommentChange} ref={commentEditorRef}></RichEditor>
            </div>
        </div>
    );
});

export default ReadBody;
