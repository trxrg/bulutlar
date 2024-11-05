import React, { useContext, useState } from 'react';
import { DBContext } from '../../store/db-context';
import { AppContext } from '../../store/app-context.jsx';

import { articleApi } from '../../backend-adapter/BackendAdapter.js';
import OwnerModal from '../owner/OwnerModal.jsx';
import CategoryModal from '../category/CategoryModal.jsx';
import RichInput from '../common/RichInput';

const ArticleInfo = ({ article, isEditable = true }) => {

    const { translate: t } = useContext(AppContext);
    const { fetchAllData, getOwnerById, fetchArticleById, getCategoryById } = useContext(DBContext);

    const [ownerModalIsOpen, setOwnerModalIsOpen] = useState(false);
    const [categoryModalIsOpen, setCategoryModalIsOpen] = useState(false);

    const getDayOfWeek = () => {
        const date = article.date;
        const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        return t(weekdays[date.getDay()]);
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
        fetchArticleById(article.id);
    }

    const owner = getOwnerById(article.ownerId);
    const category = getCategoryById(article.categoryId);

    return (
        <div className="text-lg text-gray-700 py-2" >
            <span className='cursor-pointer select-none' onDoubleClick={isEditable ? () => setOwnerModalIsOpen(true) : undefined}>{owner && owner.name + " | "}</span>
            <span className='cursor-pointer select-none' onDoubleClick={isEditable ? () => setCategoryModalIsOpen(true) : undefined}>{category && category.name + " | "}</span>
            <span className='inline-flex'>{isEditable ?
                <RichInput className='flex' initialText={new Date(article.date).toLocaleDateString('tr')} inputType='date' handleSave={handleUpdateDate}></RichInput>
                :
                new Date(article.date).toLocaleDateString('tr')}</span>
            <span>{" | " + getDayOfWeek() + ' | '}</span>
            <span>({article.number})</span>
            <OwnerModal isOpen={ownerModalIsOpen} onRequestClose={() => setOwnerModalIsOpen(false)} initialOwnerName={owner && owner.name} onConfirm={handleUpdateOwner}></OwnerModal>
            <CategoryModal isOpen={categoryModalIsOpen} onRequestClose={() => setCategoryModalIsOpen(false)} initialCategoryName={category && category.name} onConfirm={handleUpdateCategory}></CategoryModal>
        </div >
    );
};

export default ArticleInfo;