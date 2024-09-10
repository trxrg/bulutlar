import React, { useContext } from 'react';
import { PencilIcon } from '@heroicons/react/24/outline';

import { ReadContext } from '../../store/read-context.jsx';
import ReadControls from './ReadControls.jsx';

const ReadHeader = ({ functions, handleEditClicked }) => {
  const { article } = useContext(ReadContext);

  return (
    <div className='overflow-auto h-full'>
      <div className='flex justify-between'>
        <h2 className="text-3xl font-semibold text-gray-800">{article.title}</h2>
        <button
          className="button flex items-center bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          onClick={() => handleEditClicked(article)}
        >
          <PencilIcon className="w-4 h-4 mr-2" />
          Edit
        </button>
      </div>
      <p className="text-sm text-gray-600 mt-2">{article.owner && article.owner.name + " | "} {new Date(article.date).toLocaleDateString('tr')} ({article.number})</p>

      <ReadControls functions={functions}></ReadControls>
    </div>
  );
}

export default ReadHeader;