import React, { useState } from 'react';
import GeneralModal from '../common/GeneralModal';
import CategoryList from './CategoryList';
import ActionButton from '../common/ActionButton';

const CategoryModal = ({ isOpen, onRequestClose, initialCategoryName, onConfirm }) => {

    const [selectedCategory, setSelectedCategory] = useState(initialCategoryName);
    return (
        <GeneralModal
            isOpen={isOpen}
            onRequestClose={onRequestClose}
            title="Change Category"
        >
            <CategoryList initialValue={initialCategoryName} onCategoryChange={setSelectedCategory} />
            <div className='flex justify-end gap-2 mt-4'>
                <ActionButton onClick={() => onConfirm(selectedCategory)} color='blue'>Change</ActionButton>
                <ActionButton onClick={onRequestClose} color='red'>Cancel</ActionButton>
            </div>
        </GeneralModal>
    );

};

export default CategoryModal;
