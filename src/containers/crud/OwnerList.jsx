import React, { useContext, useState } from 'react';
import Select, { components } from 'react-select';
import { DBContext } from '../../store/db-context';
import ActionButton from '../../components/ActionButton';
import GeneralModal from "../../components/GeneralModal";
import AddOwner from './AddOwner';

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
        const color = '#333';

        return {
            ...base,
            color,
            border,
            cursor: 'pointer'
        };
    },
    singleValue: (base, state) => ({
        ...base,
        color: '#333',
    }),
};

const OwnerList = ({ onOwnerChange }) => {

    const { allOwners } = useContext(DBContext);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const ownerOptions = allOwners.map(owner => ({
        value: owner.name,
        label: owner.name
    }));

    const handleChange = (selectedOption) => {
        onOwnerChange(selectedOption.label);
    };

    const handleNewClicked = (event) => {
        event.preventDefault();
        setIsModalOpen(true);
    }

    return (
        <div className='my-2'>
            <label className="block text-gray-700 font-bold mb-2">Owner:</label>
            <div className="flex gap-2 w-full">
                <Select
                    options={ownerOptions}
                    onChange={handleChange}
                    components={{ Option: CustomOption }} // Use the custom option
                    className="react-select flex-1"
                    classNamePrefix="select"
                    styles={customStyles}
                    placeholder="Select Owner"
                    noOptionsMessage={() => 'No such owner'}
                />
                <ActionButton color="blue" onClick={handleNewClicked}>New</ActionButton>
            </div>
            <GeneralModal title={'Add New Owner'} isOpen={isModalOpen} onClose={()=>setIsModalOpen(false)}>
                <AddOwner onClose={()=>setIsModalOpen(false)}></AddOwner>
            </GeneralModal>
        </div>
    );
};

export default OwnerList;

