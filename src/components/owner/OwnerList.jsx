import React, { useContext, useState, useEffect } from 'react';
import Select, { components } from 'react-select';
import { DBContext } from '../../store/db-context';
import { AppContext } from '../../store/app-context';
import ActionButton from '../common/ActionButton';
import GeneralModal from "../common/GeneralModal";
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
        backgroundColor: 'var(--bg-primary)',
        border: '1px solid var(--border-secondary)',
        color: 'var(--text-primary)',
        boxShadow: 'none',
        '&:hover': {
            border: '1px solid var(--border-primary)',
        },
    }),
    option: (base, state) => {
        const border = state.isFocused ? '2px solid var(--border-primary)' : 'none';
        const backgroundColor = state.isFocused ? 'var(--bg-tertiary)' : 'var(--bg-primary)';
        const color = 'var(--text-primary)';

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
        color: 'var(--text-primary)',
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

const OwnerList = ({ initialValue, onOwnerChange }) => {

    const { allOwners } = useContext(DBContext);
    const { translate: t } = useContext(AppContext);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [pendingOwnerName, setPendingOwnerName] = useState(null);

    const ownerOptions = [
        { value: null, label: t('select owner') },
        ...allOwners.map(owner => ({
            value: owner.name,
            label: owner.name
        }))
    ];

    const [selectedOwner, setSelectedOwner] = useState(ownerOptions.find(option => option.label === initialValue));

    // Effect to select newly created owner once it appears in the list
    useEffect(() => {
        if (pendingOwnerName) {
            const newOption = ownerOptions.find(option => option.label === pendingOwnerName);
            if (newOption) {
                setSelectedOwner(newOption);
                onOwnerChange(newOption.value);
                setPendingOwnerName(null);
            }
        }
    }, [allOwners, pendingOwnerName]);

    const handleChange = (selectedOption) => {
        setSelectedOwner(selectedOption);
        onOwnerChange(selectedOption.value);
    };

    const handleNewClicked = (event) => {
        event.preventDefault();
        setIsModalOpen(true);
    };

    const handleOwnerAdded = (newOwnerName) => {
        setIsModalOpen(false);
        if (newOwnerName) {
            setPendingOwnerName(newOwnerName);
        }
    }

    return (
        <div>
            <div className="flex gap-2 w-full">
                <Select
                    value={selectedOwner}
                    options={ownerOptions}
                    onChange={handleChange}
                    components={{ Option: CustomOption }} // Use the custom option
                    className="react-select flex-1"
                    classNamePrefix="select"
                    styles={customStyles}
                    placeholder={t('select owner')}
                    noOptionsMessage={() => t('no such owner')}
                />
                <ActionButton color="blue" onClick={handleNewClicked}>{t('new')}</ActionButton>
            </div>
            <GeneralModal title={t('Add New Owner')} isOpen={isModalOpen} onRequestClose={()=>setIsModalOpen(false)}>
                <AddOwner onClose={handleOwnerAdded}></AddOwner>
            </GeneralModal>
        </div>
    );
};

export default OwnerList;

