import React, { useContext } from 'react';

import { ReadContext } from '../../../store/read-context.jsx';
import { DBContext } from '../../../store/db-context.jsx';
import ReadControls from './ReadControls.jsx';

const ReadHeader = () => {
  const { article } = useContext(ReadContext);
  const { getOwnerById } = useContext(DBContext);

  return (
    <div className='overflow-auto'>
      <h2 className="text-3xl font-semibold text-gray-800">{article.title}</h2>
      <p className="text-sm text-gray-600 mt-2">{getOwnerById(article.ownerId).name + " | "} {new Date(article.date).toLocaleDateString('tr')} ({article.number})</p>
      <ReadControls></ReadControls>
    </div>
  );
}

export default ReadHeader;