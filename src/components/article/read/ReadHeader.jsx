import React, { useContext, useState } from 'react';

import { ReadContext } from '../../../store/read-context.jsx';
import { DBContext } from '../../../store/db-context.jsx';
import { AppContext } from '../../../store/app-context.jsx';
import RichInput from '../../common/RichInput';
import { articleApi } from '../../../backend-adapter/BackendAdapter.js';
import OwnerModal from '../../owner/OwnerModal.jsx';
import CategoryModal from '../../category/CategoryModal.jsx';

const ReadHeader = () => {
  const { article } = useContext(ReadContext);
  const { fullScreen } = useContext(AppContext);
  const { getOwnerById, getCategoryById, fetchArticleById, fetchAllData } = useContext(DBContext);

  const [ ownerModalIsOpen, setOwnerModalIsOpen ] = useState(false);
  const [ categoryModalIsOpen, setCategoryModalIsOpen ] = useState(false);

  const handleChangeTitle = async (newName) => {
    await articleApi.updateTitle(article.id, newName);
    fetchArticleById(article.id);
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

  const owner = getOwnerById(article.ownerId);
  const category = getCategoryById(article.categoryId);

  return (
    <div className={fullScreen ? 'hidden' : 'overflow-auto p-6 bg-stone-100 border-b-4 border-red-300'}>
      <RichInput initialText={article.title} handleSave={(newName) => handleChangeTitle(newName)} className="text-3xl font-semibold text-gray-800"></RichInput>
      {/* <h2 className="text-3xl font-semibold text-gray-800">{article.title}</h2> */}
      <p className="text-md text-gray-600 mt-2">
        <span className='cursor-pointer select-none' onDoubleClick={() => setOwnerModalIsOpen(true)}>{owner.name + " | "}</span>
        <span className='cursor-pointer select-none' onDoubleClick={() => setCategoryModalIsOpen(true)}>{category.name + " | "}</span>
        <span>{new Date(article.date).toLocaleDateString('tr')} ({article.number})</span>
      </p>
      <OwnerModal isOpen={ownerModalIsOpen} onRequestClose={() => setOwnerModalIsOpen(false)} initialOwnerName={owner.name} onConfirm={handleUpdateOwner}></OwnerModal>
      <CategoryModal isOpen={categoryModalIsOpen} onRequestClose={() => setCategoryModalIsOpen(false)} initialCategoryName={category.name} onConfirm={handleUpdateCategory}></CategoryModal>
    </div>
  );
}

export default ReadHeader;
