import React, { useEffect, useState, useRef, useContext } from 'react';
import '../../styles.css';

import { AppContext } from '../../store/app-context.jsx';
import { ReadContext } from '../../store/read-context';
import { updateArticle } from '../../backend-adapter/BackendAdapter.js';
import ReadHeader from './ReadHeader.jsx';
import ReadBody from './ReadBody.jsx';

const ReadMainPanel = () => {

  const { editClicked, linkClicked, syncWithDB, syncArticleWithIdFromBE } = useContext(AppContext);
  const { article } = useContext(ReadContext);

  const readBodyRef = useRef();

  console.log('article in ReadContent:')
  console.log(article);

  const { title, category, owner, date, number, explanation, text, textJson, comments } = article;

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

  const toggleBold = () => readBodyRef.current.toggleBold();
  const toggleUnderline = () => readBodyRef.current.toggleUnderline();
  const addLink = () => readBodyRef.current.addLink();

  let functions = {
    toggleBold,
    toggleUnderline,
    addLink
  }

  return (
    <div className="max-h-full overflow-auto mx-auto bg-stone-50">
      <div className="p-6">

        <ReadHeader handleEditClicked={handleEditClicked} functions={functions}></ReadHeader>

        <ReadBody ref={readBodyRef}></ReadBody>
      </div>

      <div className='flex'>
        <h2 className='mx-2 cursor-pointer hover:text-green-500' onClick={(toggleShowCode)}>{showCode ? 'Hide' : 'Show'} Code</h2>
        {showCode && <h2>{article.code}</h2>}
      </div>
    </div>
  );
};

export default ReadMainPanel;
