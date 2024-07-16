import React, { useEffect, useState, useRef } from 'react';
import { PencilIcon } from '@heroicons/react/24/outline';
import '../styles.css';
import LimitedEditor from './LimitedEditor';

import { updateArticle } from '../backend-adapter/BackendAdapter';

const ReadContent = React.forwardRef(({ article, onEditClicked, onLinkClicked, syncWithDB }, ref) => {

  const mainTextEditorRef = useRef();
  const explanationEditorRef = useRef();
  const commentEditorRef = useRef();

  const { title, category, owner, date, number, explanation, text, comments } = article;


  const saveArticle = async () => {
    const result = await updateArticle(article.id, {
      title: article.title,
      date: article.date,
      explanation: explanationState,
      text: mainTextState,
      owner: { name: article.owner.name },
      category: { name: article.category.name },
      comments: [{ text: commentState }],
      tags: article.tags
    });
    console.log('article updated:');
    console.log(result);
    syncWithDB();
  }

  const [activeEditor, setActiveEditor] = useState();
  const [explanationState, setExplanationState] = useState(article.explanation);
  const [mainTextState, setMainTextState] = useState(article.text);
  const [commentState, setCommentState] = useState(article.comments[0].text);

  useEffect(() => {
    saveArticle();
  }, [explanationState, mainTextState, commentState]);

  const handleEditClicked = (article) => {
    onEditClicked(article);
  }

  const handleLinkClicked = (event) => {
    event.preventDefault();

    if (event.target.closest('a'))
      onLinkClicked(event.target.closest('a').getAttribute('href'));
  };

  const [showCode, setShowCode] = useState(false);

  const toggleShowCode = () => {
    setShowCode(prev => !prev);
  }

  const addLink = (url) => {
    getActiveEditorRef() && getActiveEditorRef().current.addLink(url);
  }

  const toggleBold = () => {
    getActiveEditorRef() && getActiveEditorRef().current.toggleBold();
  }

  const toggleUnderline = () => {
    getActiveEditorRef() && getActiveEditorRef().current.toggleUnderline();
  }

  const getActiveEditorRef = () => {
    if (activeEditor === 'mainTextEditor')
      return mainTextEditorRef;
    if (activeEditor === 'explanationEditor')
      return explanationEditorRef;
    if (activeEditor === 'commentEditor')
      return commentEditorRef;

    return null;
  }

  const getExplanation = () => explanationEditorRef.current.getHtmlContent();
  const getMainText = () => mainTextEditorRef.current.getHtmlContent();
  const getComment = () => commentEditorRef.current.getHtmlContent();


  React.useImperativeHandle(ref, () => ({
    addLink,
    toggleUnderline,
    toggleBold,
    getComment,
    getExplanation,
    getMainText
  }));

  return (
    <div className="max-h-full overflow-auto mx-auto bg-stone-50">
      <div className="p-6">
        <div className='flex justify-between'>
          <h2 className="text-3xl font-semibold text-gray-800">{title}</h2>
          <button
            className="button flex items-center bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            onClick={() => handleEditClicked(article)}
          >
            <PencilIcon className="w-4 h-4 mr-2" />
            Edit
          </button>
        </div>
        <p className="text-sm text-gray-600 mt-2">{owner && owner.name + " | "} {new Date(date).toLocaleDateString('tr')} ({number})</p>
        {/* <p className="text-gray-700 mt-4">{text}</p> */}
        {/* <div className="prose text-gray-700 mt-4 text-l" onClick={handleLinkClicked} dangerouslySetInnerHTML={{ __html: explanation }} /> */}
        {/* <div className="prose text-gray-700 mt-4 text-xl" onClick={handleLinkClicked} dangerouslySetInnerHTML={{ __html: text }} /> */}
        <span onClick={() => setActiveEditor('explanationEditor')}>
          <LimitedEditor htmlContent={explanation} handleContentChange={setExplanationState} ref={explanationEditorRef}></LimitedEditor>
        </span>
        <span onClick={() => setActiveEditor('mainTextEditor')}>
          <LimitedEditor htmlContent={text} handleContentChange={setMainTextState} ref={mainTextEditorRef}></LimitedEditor>
        </span>
      </div>

      <div className={comments.length > 0 && comments[0] && comments[0].text ? 'hidden' : ''}>
        <div className="p-6 border-t border-gray-500">
          <h3 className="text-xl font-semibold mb-4">Comment</h3>
          <ul className="divide-y divide-gray-200">
            <span onClick={() => setActiveEditor('commentEditor')}>
              <LimitedEditor htmlContent={comments[0]} handleContentChange={setCommentState} ref={commentEditorRef}></LimitedEditor>
            </span>
          </ul>
        </div>
      </div>

      <div className='flex'>
        <h2 className='mx-2 cursor-pointer hover:text-green-500' onClick={(toggleShowCode)}>{showCode ? 'Hide' : 'Show'} Code</h2>
        {showCode && <h2>{article.code}</h2>}
      </div>
    </div>
  );
});

export default ReadContent;
