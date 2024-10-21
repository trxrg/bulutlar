import React, { useContext, useState } from 'react';
import { DBContext } from '../../store/db-context';

import { articleApi } from '../../backend-adapter/BackendAdapter.js';
import OwnerModal from '../owner/OwnerModal.jsx';
import CategoryModal from '../category/CategoryModal.jsx';
import RichInput from '../common/RichInput';

const ArticleInfo = ({ article }) => {

    const { fetchAllData, getOwnerById, fetchArticleById, getCategoryById } = useContext(DBContext);

    const [ownerModalIsOpen, setOwnerModalIsOpen] = useState(false);
    const [categoryModalIsOpen, setCategoryModalIsOpen] = useState(false);

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
        fetchArticleById(article.id);
    }

    const owner = getOwnerById(article.ownerId);
    const category = getCategoryById(article.categoryId);

    return (
        <div className="text-md text-gray-600" >
            <span className='cursor-pointer select-none' onClick={(e) => e.stopPropagation()} onDoubleClick={(e) => {e.stopPropagation(); setOwnerModalIsOpen(true)}}>{owner.name + " | "}</span>
            <span className='cursor-pointer select-none' onDoubleClick={() => setCategoryModalIsOpen(true)}>{category.name + " | "}</span>
            <span className='inline-flex'><RichInput className='flex' initialText={new Date(article.date).toLocaleDateString('tr')} inputType='date' handleSave={handleUpdateDate}></RichInput></span>
            <span>({article.number})</span>
            <OwnerModal isOpen={ownerModalIsOpen} onRequestClose={() => setOwnerModalIsOpen(false)} initialOwnerName={owner.name} onConfirm={handleUpdateOwner}></OwnerModal>
            <CategoryModal isOpen={categoryModalIsOpen} onRequestClose={() => setCategoryModalIsOpen(false)} initialCategoryName={category.name} onConfirm={handleUpdateCategory}></CategoryModal>
        </div >
    );
};

export default ArticleInfo;