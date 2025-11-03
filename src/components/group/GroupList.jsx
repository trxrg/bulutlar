import React, { useContext, useState, useEffect } from 'react';
import Select, { components } from 'react-select';
import { DBContext } from '../../store/db-context';
import { AppContext } from '../../store/app-context';
import ActionButton from '../common/ActionButton';
import GeneralModal from "../common/GeneralModal";
import AddGroup from './AddGroup';

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

const GroupList = ({ onGroupChange }) => {

    const { allGroups } = useContext(DBContext);
    const { translate: t } = useContext(AppContext);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [pendingGroupName, setPendingGroupName] = useState(null);

    const groupOptions = [
        { value: null, label: t('select group') },
        ...allGroups.map(group => ({
            value: group.name,
            label: group.name
        }))
    ];

    const [selectedGroup, setSelectedGroup] = useState();

    // Effect to select newly created group once it appears in the list
    useEffect(() => {
        if (pendingGroupName) {
            const newOption = groupOptions.find(option => option.label === pendingGroupName);
            if (newOption) {
                setSelectedGroup(newOption);
                onGroupChange(newOption.value);
                setPendingGroupName(null);
            }
        }
    }, [allGroups, pendingGroupName]);

    const handleChange = (selectedOption) => {
        setSelectedGroup(selectedOption);
        onGroupChange(selectedOption.value);
    };

    const handleNewClicked = (event) => {
        event.preventDefault();
        setIsModalOpen(true);
    };

    const handleGroupAdded = (newGroupName) => {
        setIsModalOpen(false);
        if (newGroupName) {
            setPendingGroupName(newGroupName);
        }
    }

    return (
        <div>
            <div className="flex gap-2 w-full">
                <Select
                    value={selectedGroup}
                    options={groupOptions}
                    onChange={handleChange}
                    components={{ Option: CustomOption }} // Use the custom option
                    className="react-select flex-1"
                    classNamePrefix="select"
                    styles={customStyles}
                    placeholder={t('select group')}
                    noOptionsMessage={() => t('no such group')}
                />
                <ActionButton color="blue" onClick={handleNewClicked}>{t('new')}</ActionButton>
            </div>
            <GeneralModal title={t('add new group')} isOpen={isModalOpen} onRequestClose={()=>setIsModalOpen(false)}>
                <AddGroup onClose={handleGroupAdded} />
            </GeneralModal>
        </div>
    );
};

export default GroupList;

