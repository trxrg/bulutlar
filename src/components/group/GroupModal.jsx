import React, { useState, useContext } from 'react';
import GeneralModal from '../common/GeneralModal';
import GroupList from './GroupList';
import ActionButton from '../common/ActionButton';
import { AppContext } from '../../store/app-context';

const GroupModal = ({ isOpen, onRequestClose, onConfirm }) => {

    const { translate: t } = useContext(AppContext);

    const [selectedGroupName, setSelectedGroupName] = useState('');
    return (
        <GeneralModal
            isOpen={isOpen}
            onRequestClose={onRequestClose}
            title={t('select group')}
        >
            <GroupList onGroupChange={setSelectedGroupName} />
            <div className='flex justify-end gap-2 mt-4'>
                <ActionButton onClick={() => onConfirm(selectedGroupName)} color='blue'>{t('add')}</ActionButton>
                <ActionButton onClick={onRequestClose} color='red'>{t('cancel')}</ActionButton>
            </div>
        </GeneralModal>
    );

};

export default GroupModal;
