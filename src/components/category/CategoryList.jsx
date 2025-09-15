import React, { useContext, useState } from 'react';
import Select, { components } from 'react-select';
import { DBContext } from '../../store/db-context';
import { AppContext } from '../../store/app-context';
import ActionButton from '../common/ActionButton';
import GeneralModal from "../common/GeneralModal";
import AddCategory from "./AddCategory";

const CustomOption = (props) => {
    return (
        <components.Option {...props}>
            <div className="flex items-center w-full p-2">
                <span>{props.data.label}</span>
            </div>
        </components.Option>
    );
};

const customStyles = {
    control: (base) => ({
        ...base,
        backgroundColor: 'var(--bg-primary)',
        border: '1px solid var(--border-secondary)',
        color: 'var(--text-primary)',
        boxShadow: 'none',
        '&:hover': {
            border: '1px solid var(--border-primary)',
        },
    }),
    option: (base, state) => {
        const borderLeft = '20px solid ' + state.data.color;
        const backgroundColor = state.isFocused ? 'var(--bg-tertiary)' : 'var(--bg-primary)';
        const color = 'var(--text-primary)';

        return {
            ...base,
            backgroundColor,
            color,
            borderLeft,
            cursor: 'pointer'
        };
    },
    singleValue: (base, state) => ({
        ...base,
        color: state.data.color || 'var(--text-primary)',
    }),
    menu: (base) => ({
        ...base,
        backgroundColor: 'var(--bg-primary)',
        border: '1px solid var(--border-secondary)',
    }),
    placeholder: (base) => ({
        ...base,
        color: 'var(--text-tertiary)',
    }),
    input: (base) => ({
        ...base,
        color: 'var(--text-primary)',
    }),
};

const CategoryList = ({ initialValue, onCategoryChange }) => {

    const { allCategories } = useContext(DBContext);
    const { translate: t } = useContext(AppContext);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const categoryOptions = [
        { value: null, label: t('select category') },
        ...allCategories.map(category => ({
            value: category.name,
            label: category.name,
            color: category.color,
            articleCount: category.articleCount
        }))
    ];

    const [selectedCategory, setSelectedCategory] = useState(categoryOptions.find(option => option.label === initialValue));

    const handleChange = (selectedOption) => {
        setSelectedCategory(selectedOption);
        onCategoryChange(selectedOption.value);
    };

    const handleNewClicked = (event) => {
        event.preventDefault();
        setIsModalOpen(true);
    }

    return (
        <div>
            <div className="flex gap-2 w-full">
                <Select
                    value={selectedCategory}
                    options={categoryOptions}
                    onChange={handleChange}
                    components={{ Option: CustomOption }} // Use the custom option
                    className="react-select flex-1"
                    classNamePrefix="select"
                    styles={customStyles}
                    placeholder={t('select category')}
                    noOptionsMessage={() => t('no such category')}
                />
                <ActionButton color="blue" onClick={handleNewClicked}>{t('new')}</ActionButton>
            </div>
            <GeneralModal title={'Add New Category'} isOpen={isModalOpen} onRequestClose={() => setIsModalOpen(false)}>
                <AddCategory onClose={() => setIsModalOpen(false)}></AddCategory>
            </GeneralModal>
        </div>
    );
};

export default CategoryList;
