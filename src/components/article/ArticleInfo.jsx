import React, { useContext, useState } from 'react';
import { DBContext } from '../../store/db-context.jsx';
import { AppContext } from '../../store/app-context.jsx';

import { articleApi } from '../../backend-adapter/BackendAdapter.js';
import OwnerModal from '../owner/OwnerModal.jsx';
import CategoryModal from '../category/CategoryModal.jsx';
import RichInput from '../common/RichInput.jsx';
import toastr from 'toastr';

const ArticleInfo = ({ article, fontSize = 'text-xl', isEditable = true }) => {

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
        try {
            await articleApi.updateOwner(article.id, newOwnerName);
        } catch (err) {
            console.error(err);
            toastr.error(t('owner could not be changed'));
        }
        fetchAllData();
        setOwnerModalIsOpen(false);
    }

    const handleUpdateCategory = async (newCategoryName) => {
        try {
            await articleApi.updateCategory(article.id, newCategoryName);
        } catch (err) {
            console.error(err);
            toastr.error(t('category could not be changed'));
        }
        fetchAllData();
        setCategoryModalIsOpen(false);
    }

    const handleUpdateDate = async (newDate) => {
        await articleApi.updateDate(article.id, newDate);
        fetchArticleById(article.id);
    }

    const handleUpdateDate2 = async (newDate) => {
        await articleApi.updateDate2(article.id, newDate);
        fetchArticleById(article.id);
    }

    const owner = getOwnerById(article.ownerId);
    const category = getCategoryById(article.categoryId);

    return (
        <div 
            className={fontSize} 
            style={{ color: 'var(--text-primary)' }}
        >
            <span className={'select-none' + (isEditable && ' cursor-pointer')} style={{ color: 'var(--text-primary)' }} onDoubleClick={isEditable ? () => setOwnerModalIsOpen(true) : undefined}>{(owner && owner.name + " | ")}</span>
            <span className={'select-none' + (isEditable && ' cursor-pointer')} style={{ color: 'var(--text-primary)' }} onDoubleClick={isEditable ? () => setCategoryModalIsOpen(true) : undefined}>{category && category.name}</span>
            {!article.isDateUncertain && <>
                <span style={{ color: 'var(--text-primary)' }}>{" | "}</span>
                <span className='inline-flex' style={{ color: 'var(--text-primary)' }}>{isEditable ?
                    <RichInput className='flex' initialText={new Date(article.date).toLocaleDateString('tr')} inputType='date' handleSave={handleUpdateDate}></RichInput>
                    :
                    new Date(article.date).toLocaleDateString('tr')}</span>
                <span style={{ color: 'var(--text-primary)' }}>{" (" + article.number + ") | "}</span>
                <span style={{ color: 'var(--text-primary)' }}>{getDayOfWeek() + " | "}</span>
                <span className='inline-flex' style={{ color: 'var(--text-primary)' }}>{isEditable ?
                    <RichInput className='flex' initialText={new Date(article.date2).toLocaleDateString('tr')} inputType='date' handleSave={handleUpdateDate2}></RichInput>
                    :
                    new Date(article.date2).toLocaleDateString('tr')}</span>
                <span style={{ color: 'var(--text-primary)' }}>{" (" + article.number2 + ")"}</span>
            </>}
            <OwnerModal isOpen={ownerModalIsOpen} onRequestClose={() => setOwnerModalIsOpen(false)} initialOwnerName={owner && owner.name} onConfirm={handleUpdateOwner}></OwnerModal>
            <CategoryModal isOpen={categoryModalIsOpen} onRequestClose={() => setCategoryModalIsOpen(false)} initialCategoryName={category && category.name} onConfirm={handleUpdateCategory}></CategoryModal>
        </div >
    );
};

export default ArticleInfo;