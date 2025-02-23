import React, { useState, useContext } from 'react';
import GeneralModal from '../common/GeneralModal';
import CategoryList from './CategoryList';
import ActionButton from '../common/ActionButton';
import { AppContext } from '../../store/app-context';

const CategoryModal = ({ isOpen, onRequestClose, initialCategoryName, onConfirm }) => {

    const { translate: t } = useContext(AppContext);

    const [selectedCategory, setSelectedCategory] = useState(initialCategoryName);
    return (
        <GeneralModal
            isOpen={isOpen}
            onRequestClose={onRequestClose}
            title={t('change category')}
        >
            <CategoryList initialValue={initialCategoryName} onCategoryChange={setSelectedCategory} />
            <div className='flex justify-end gap-2 mt-4'>
                <ActionButton onClick={onRequestClose} color='red'>{t('cancel')}</ActionButton>
                <ActionButton onClick={() => onConfirm(selectedCategory)} color='blue'>{t('change')}</ActionButton>
            </div>
        </GeneralModal>
    );

};

export default CategoryModal;
