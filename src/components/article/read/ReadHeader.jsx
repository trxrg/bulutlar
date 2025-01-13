import React, { useContext, useState } from 'react';

import { ReadContext } from '../../../store/read-context.jsx';
import { DBContext } from '../../../store/db-context.jsx';
import { AppContext } from '../../../store/app-context.jsx';
import RichInput from '../../common/RichInput.jsx';
import { articleApi } from '../../../backend-adapter/BackendAdapter.js';
import OwnerModal from '../../owner/OwnerModal.jsx';
import CategoryModal from '../../category/CategoryModal.jsx';
import ArticleInfo from '../ArticleInfo.jsx';

const ReadHeader = () => {
  const { article, syncArticleFromBE, getOwnerName, getCategoryName } = useContext(ReadContext);
  const { fullScreen } = useContext(AppContext);
  const { fetchAllData } = useContext(DBContext);

  const [ ownerModalIsOpen, setOwnerModalIsOpen ] = useState(false);
  const [ categoryModalIsOpen, setCategoryModalIsOpen ] = useState(false);

  const handleChangeTitle = async (newName) => {
    await articleApi.updateTitle(article.id, newName);
    syncArticleFromBE(article.id);
  }

  const handleUpdateOwner = async (newOwnerName) => {
    await articleApi.updateOwner(article.id, newOwnerName);
    fetchAllData();
    setOwnerModalIsOpen(false);
  }

  const handleUpdateCategory = async (newCategoryName) => {
    await articleApi.updateCategory(article.id, newCategoryName);
    fetchAllData();
    setCategoryModalIsOpen(false);
  }

  const handleUpdateDate = async (newDate) => {
    await articleApi.updateDate(article.id, newDate);
    syncArticleFromBE(article.id);
  }

  return (
    <div className={fullScreen ? 'hidden' : 'overflow-auto px-6 py-3 bg-stone-100 border-b-4 border-red-300'}>
      <RichInput initialText={article.title} handleSave={(newName) => handleChangeTitle(newName)} className="text-3xl font-semibold text-gray-800"></RichInput>
      <ArticleInfo article={article}></ArticleInfo>
    </div>
  );
}

export default ReadHeader;
