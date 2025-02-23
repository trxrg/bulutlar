import React, { useContext, useState } from 'react';
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

const GroupList = ({ onGroupChange }) => {

    const { allGroups } = useContext(DBContext);
    const { translate: t } = useContext(AppContext);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const groupOptions = [
        { value: null, label: t('select group') },
        ...allGroups.map(group => ({
            value: group.name,
            label: group.name
        }))
    ];

    const [selectedGroup, setSelectedGroup] = useState();

    const handleChange = (selectedOption) => {
        setSelectedGroup(selectedOption);
        onGroupChange(selectedOption.value);
    };

    const handleNewClicked = (event) => {
        event.preventDefault();
        setIsModalOpen(true);
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
                <AddGroup onClose={()=>setIsModalOpen(false)} />
            </GeneralModal>
        </div>
    );
};

export default GroupList;

