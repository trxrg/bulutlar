import React, { useContext } from 'react';

import { ReadContext } from '../../../store/read-context.jsx';
import { DBContext } from '../../../store/db-context.jsx';

const ReadHeader = () => {
  const { article, fullScreen } = useContext(ReadContext);
  const { getOwnerById, getCategoryById } = useContext(DBContext);

  return (
    <div className={fullScreen ? 'hidden' : 'overflow-auto p-6 bg-stone-100 border-b-4 border-red-300'}>
      <h2 className="text-3xl font-semibold text-gray-800">{article.title}</h2>
      <p className="text-md text-gray-600 mt-2">{getOwnerById(article.ownerId).name + " | " + getCategoryById(article.categoryId).name + " | "} {new Date(article.date).toLocaleDateString('tr')} ({article.number})</p>
    </div>
  );
}

export default ReadHeader;