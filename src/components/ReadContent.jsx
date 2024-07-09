import React, { useEffect, useState, useRef } from 'react';
import { PencilIcon } from '@heroicons/react/24/outline';
import '../styles.css';
import LimitedEditor from './LimitedEditor';

const ReadContent =  React.forwardRef(({ article, onEditClicked, onLinkClicked }, ref) => {

  const editorRef = useRef();

  const { title, category, owner, date, number, explanation, text, comments } = article;

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
    editorRef.current.addLink(url);
  }

  const toggleBold = () => {
    editorRef.current.toggleBold();
  }

  const toggleUnderline = () => {
    editorRef.current.toggleUnderline();
  }

  React.useImperativeHandle(ref, () => ({
    addLink,
    toggleUnderline,
    toggleBold
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
        <div className="prose text-gray-700 mt-4 text-l" onClick={handleLinkClicked} dangerouslySetInnerHTML={{ __html: explanation }} />
        {/* <div className="prose text-gray-700 mt-4 text-xl" onClick={handleLinkClicked} dangerouslySetInnerHTML={{ __html: text }} /> */}
        <LimitedEditor htmlContent={text} ref={editorRef}></LimitedEditor>
      </div>

      <div className="p-6 border-t border-gray-500">
        <h3 className="text-xl font-semibold mb-4">{comments.size > 1 ? "Comments" : "Comment"}</h3>
        <ul className="divide-y divide-gray-200">
          {comments.map((comment, index) => (
            <li key={index} className="py-4">
              <div className="prose text-gray-700 text-xl mt-4" onClick={handleLinkClicked} dangerouslySetInnerHTML={{ __html: comment.text }} />
            </li>
          ))}
        </ul>
      </div>

      <div className='flex'>
        <h2 className='mx-2 cursor-pointer hover:text-green-500' onClick={(toggleShowCode)}>{showCode ? 'Hide' : 'Show'} Code</h2>
        {showCode && <h2>{article.code}</h2>}
      </div>
    </div>
  );
});

export default ReadContent;
