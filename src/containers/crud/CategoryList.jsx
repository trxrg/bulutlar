import React, { useContext, useState } from 'react';
import Select, { components } from 'react-select';
import { AppContext } from '../../store/app-context';
import ActionButton from '../../components/ActionButton';
import GeneralModal from "../../components/GeneralModal";
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
        border: '1px solid #ccc',
        boxShadow: 'none',
        '&:hover': {
            border: '1px solid #007bff',
        },
    }),
    option: (base, state) => {
        const border = state.isFocused ? '2px solid' : 'none';
        const backgroundColor = state.data.color;
        const color = '#333';

        return {
            ...base,
            backgroundColor,
            color,
            border,
            cursor: 'pointer'
        };
    },
    singleValue: (base, state) => ({
        ...base,
        color: state.data.color || '#333',
    }),
};

const CategoryList = ({ onCategoryChange }) => {

    const { allCategories } = useContext(AppContext);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const categoryOptions = allCategories.map(category => ({
        value: category.name,
        label: category.name,
        color: category.color,
        articleCount: category.articleCount
    }));

    const handleChange = (selectedOption) => {
        onCategoryChange(selectedOption.label);
    };

    const handleNewClicked = (event) => {
        event.preventDefault();
        setIsModalOpen(true);
    }

    return (
        <div className='my-2'>
            <label className="block text-gray-700 font-bold mb-2" htmlFor="category">Category:</label>
            <div className="flex gap-2 w-full">
                <Select
                    options={categoryOptions}
                    onChange={handleChange}
                    components={{ Option: CustomOption }} // Use the custom option
                    className="react-select flex-1"
                    classNamePrefix="select"
                    styles={customStyles}
                    placeholder="Select Category"
                    noOptionsMessage={() => 'No such category'}
                />
                <ActionButton color="blue" onClick={handleNewClicked}>New</ActionButton>
            </div>
            <GeneralModal title={'Add New Category'} isOpen={isModalOpen} onClose={()=>setIsModalOpen(false)}>
                <AddCategory onClose={()=>setIsModalOpen(false)}></AddCategory>
            </GeneralModal>
        </div>
    );
};

export default CategoryList;
