import React, { useContext, useState } from 'react';

import { ReadContext } from '../../../store/read-context.jsx';
import { DBContext } from '../../../store/db-context.jsx';
import { AppContext } from '../../../store/app-context.jsx';
import RichInput from '../../common/RichInput';
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
    <div className={fullScreen ? 'hidden' : 'overflow-auto p-6 bg-stone-100 border-b-4 border-red-300'}>
      <RichInput initialText={article.title} handleSave={(newName) => handleChangeTitle(newName)} className="text-3xl font-semibold text-gray-800"></RichInput>
      {/* <div className="text-md text-gray-600">
        <span className='cursor-pointer select-none' onDoubleClick={() => setOwnerModalIsOpen(true)}>{getOwnerName() + " | "}</span>
        <span className='cursor-pointer select-none' onDoubleClick={() => setCategoryModalIsOpen(true)}>{getCategoryName() + " | "}</span>
        <span className='inline-flex'><RichInput className='flex' initialText={new Date(article.date).toLocaleDateString('tr')} inputType='date' handleSave={handleUpdateDate}></RichInput></span>
        <span>({article.number})</span>
      </div>
      <OwnerModal isOpen={ownerModalIsOpen} onRequestClose={() => setOwnerModalIsOpen(false)} initialOwnerName={getOwnerName()} onConfirm={handleUpdateOwner}></OwnerModal>
      <CategoryModal isOpen={categoryModalIsOpen} onRequestClose={() => setCategoryModalIsOpen(false)} initialCategoryName={getCategoryName()} onConfirm={handleUpdateCategory}></CategoryModal> */}
      <ArticleInfo article={article}></ArticleInfo>
    </div>
  );
}

export default ReadHeader;
