import React from 'react';
import { PencilIcon } from '@heroicons/react/24/outline';

const ArticleRead = ({ article, onEditClicked }) => {
  const { title, category, owner, date, number, explanation, text, comments, tags } = article;

  console.log('article in the articleRead:');
  console.log(article);

  const handleEditClicked = (article) => {
    onEditClicked(article);
  }

  return (
    <div className="max-h-full overflow-auto mx-auto bg-white shadow-md rounded-lg mb-8">
      <div className="p-6">
        <div className='flex justify-between'>
          <h2 className="text-3xl font-semibold text-gray-800">{title}</h2>
          <button
            className="flex items-center bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            onClick={() => handleEditClicked(article)}
          >
            <PencilIcon className="w-4 h-4 mr-2" /> {/* Pencil icon */}
            Edit
          </button>
        </div>
        <p className="text-sm text-gray-600 mt-2">{owner && owner.name + " | "} {new Date(date).toLocaleDateString('tr')} ({number})</p>
        {/* <p className="text-gray-700 mt-4">{text}</p> */}
        <div className="text-gray-700 mt-4" dangerouslySetInnerHTML={{ __html: explanation }} />
        <div className='bg-green-100'>
          <h3 className="text-xl font-semibold my-4">Tags</h3>
          <div className="flex flex-wrap">
            {tags.map((tag, index) => (
              <span key={index} className="bg-gray-200 text-gray-800 rounded-full px-3 py-1 text-sm font-semibold mr-2 mb-2">{tag.name}</span>
            ))}
          </div>
        </div>
        <div className="text-gray-700 mt-4" dangerouslySetInnerHTML={{ __html: text }} />
      </div>

      <div className="p-6 bg-gray-100 border-t border-gray-200">
        <h3 className="text-xl font-semibold mb-4">{comments.size > 1 ? "Comments" : "Comment"}</h3>
        <ul className="divide-y divide-gray-200">
          {comments.map((comment, index) => (
            <li key={index} className="py-4">
              <div className="text-gray-700 mt-4" dangerouslySetInnerHTML={{ __html: comment.text }} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ArticleRead;
