import React, { useEffect, useState, useRef, useContext } from 'react';
import { PencilIcon } from '@heroicons/react/24/outline';
import '../../styles.css';
import RichEditor from './RichEditor.jsx';
import { AppContext } from '../../store/app-context.jsx';
import { ReadContext } from '../../store/read-context';
import ReadControls from './ReadControls.jsx'
import { updateArticle } from '../../backend-adapter/BackendAdapter.js';

const ReadContent = () => {

  const { editClicked, linkClicked, syncWithDB, getArticleWithIdFromBE } = useContext(AppContext);
  const { article, readContentRef } = useContext(ReadContext);

  const ref = readContentRef;

  const mainTextEditorRef = useRef();
  const explanationEditorRef = useRef();
  const commentEditorRef = useRef();

  console.log('article in ReadContent:')
  console.log(article);

  const { title, category, owner, date, number, explanation, text, textJson, comments } = article;

  const saveArticle = async () => {
    const result = await updateArticle(article.id, {
      title: article.title,
      date: article.date,
      explanation: explanationState,
      text: mainTextState,
      textJson: mainTextRawState,
      owner: { name: article.owner.name },
      category: { name: article.category.name },
      comments: [{ text: commentState }],
      tags: article.tags
    });
    console.log('article updated:');
    console.log(result);
    getArticleWithIdFromBE(article.id);
  }

  const [activeEditor, setActiveEditor] = useState();
  const [explanationState, setExplanationState] = useState(article.explanation);
  const [mainTextState, setMainTextState] = useState(article.text);
  const [commentState, setCommentState] = useState(article.comments[0].text);

  const [mainTextRawState, setMainTextRawState] = useState(article.textJson);

  useEffect(() => {
    saveArticle();
  }, [explanationState, mainTextState, mainTextRawState, commentState]);

  const handleEditClicked = (article) => {
    editClicked(article);
  }

  const handleLinkClicked = (event) => {
    event.preventDefault();

    if (event.target.closest('a'))
      linkClicked(event.target.closest('a').getAttribute('href'));
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
  const getMainTextJson = () => mainTextEditorRef.current.getRawContent();
  const getComment = () => commentEditorRef.current.getHtmlContent();


  React.useImperativeHandle(ref, () => ({
    addLink,
    toggleUnderline,
    toggleBold,
    getComment,
    getExplanation,
    getMainText
  }));

  const handleExplanationChange = (html, raw) => {
    setExplanationState(html);
  }

  const handleMainTextChange = (html, raw) => {
    setMainTextState(html);
    setMainTextRawState(raw);
  }

  const handleCommentChange = (html, raw) => {
    setCommentState(html);
  }

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

        <ReadControls toggleBold={toggleBold} toggleUnderline={toggleUnderline} addLink={addLink}></ReadControls>

        <div onClick={() => setActiveEditor('explanationEditor')} className='border border-gray-300 rounded-lg shadow-lg p-4'>
          <RichEditor htmlContent={explanation} handleContentChange={handleExplanationChange} ref={explanationEditorRef}></RichEditor>
        </div>

        <div onClick={() => setActiveEditor('mainTextEditor')} className='my-6'>
          <RichEditor htmlContent={text} rawContent={textJson} handleContentChange={handleMainTextChange} ref={mainTextEditorRef}></RichEditor>
        </div>

        <h3 className="text-xl font-semibold my-4 pt-2 border-t border-gray-500">Comment</h3>

        <span onClick={() => setActiveEditor('commentEditor')}>
          <RichEditor htmlContent={comments[0].text} handleContentChange={handleCommentChange} ref={commentEditorRef}></RichEditor>
        </span>
      </div>

      <div className='flex'>
        <h2 className='mx-2 cursor-pointer hover:text-green-500' onClick={(toggleShowCode)}>{showCode ? 'Hide' : 'Show'} Code</h2>
        {showCode && <h2>{article.code}</h2>}
      </div>
    </div>
  );
};

export default ReadContent;
