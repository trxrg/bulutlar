import React, { useState, useContext } from 'react';
import GeneralModal from '../common/GeneralModal';
import GroupList from './GroupList';
import ActionButton from '../common/ActionButton';
import { AppContext } from '../../store/app-context';
import toastr from 'toastr';

const GroupModal = ({ isOpen, onRequestClose, onConfirm }) => {

    const { translate: t } = useContext(AppContext);

    const [selectedGroupName, setSelectedGroupName] = useState('');

    const handleConfirm = () => {
        if (!selectedGroupName) {
            toastr.warning(t('select a group'));
            return;
        } else {
            onConfirm(selectedGroupName);
            onRequestClose();
        }
    }

    return (
        <GeneralModal
            isOpen={isOpen}
            onRequestClose={onRequestClose}
            title={t('add to group')}
        >
            <GroupList onGroupChange={setSelectedGroupName} />
            <div className='flex justify-end gap-2 mt-4'>
                <ActionButton onClick={onRequestClose} color='red'>{t('cancel')}</ActionButton>
                <ActionButton onClick={handleConfirm}>{t('add')}</ActionButton>
            </div>
        </GeneralModal>
    );

};

export default GroupModal;
