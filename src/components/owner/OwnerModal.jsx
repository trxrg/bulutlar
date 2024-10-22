import React, { useState, useContext } from 'react';
import GeneralModal from '../common/GeneralModal';
import OwnerList from './OwnerList';
import ActionButton from '../common/ActionButton';
import { AppContext } from '../../store/app-context';

const OwnerModal = ({ isOpen, onRequestClose, initialOwnerName, onConfirm }) => {

    const [selectedOwner, setSelectedOwner] = useState(initialOwnerName);
    const { translate: t } = useContext(AppContext);

    return (
        <GeneralModal
            isOpen={isOpen}
            onRequestClose={onRequestClose}
            title={t('change owner')}
        >
            <OwnerList initialValue={initialOwnerName} onOwnerChange={setSelectedOwner} />
            <div className='flex justify-end gap-2 mt-4'>
                <ActionButton onClick={() => onConfirm(selectedOwner)} color='blue'>{t('change')}</ActionButton>
                <ActionButton onClick={onRequestClose} color='red'>{t('cancel')}</ActionButton>
            </div>
        </GeneralModal>
    );
};

export default OwnerModal;