import React, { useContext } from 'react';

import { ReadContext } from '../../../store/read-context.jsx';
import { DBContext } from '../../../store/db-context.jsx';
import { AppContext } from '../../../store/app-context.jsx';
import RichInput from '../../common/RichInput';
import { articleApi } from '../../../backend-adapter/BackendAdapter.js';

const ReadHeader = () => {
  const { article } = useContext(ReadContext);
  const { fullScreen } = useContext(AppContext);
  const { getOwnerById, getCategoryById, fetchArticleById } = useContext(DBContext);

  const handleTitleChange = async (newName) => {
    await articleApi.updateTitle(article.id, newName);
    fetchArticleById(article.id);
  }

  return (
    <div className={fullScreen ? 'hidden' : 'overflow-auto p-6 bg-stone-100 border-b-4 border-red-300'}>
      <RichInput initialText={article.title} handleSave={(newName) => handleTitleChange(newName)} className="text-3xl font-semibold text-gray-800"></RichInput>
      {/* <h2 className="text-3xl font-semibold text-gray-800">{article.title}</h2> */}
      <p className="text-md text-gray-600 mt-2">{getOwnerById(article.ownerId).name + " | " + getCategoryById(article.categoryId).name + " | "} {new Date(article.date).toLocaleDateString('tr')} ({article.number})</p>
    </div>
  );
}

export default ReadHeader;