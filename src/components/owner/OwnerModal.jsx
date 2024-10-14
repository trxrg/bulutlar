import React, { useState } from 'react';
import GeneralModal from '../common/GeneralModal';
import OwnerList from './OwnerList';
import ActionButton from '../common/ActionButton';

const OwnerModal = ({ isOpen, onRequestClose, initialOwnerName, onConfirm }) => {

    const [selectedOwner, setSelectedOwner] = useState(initialOwnerName);
    return (
        <GeneralModal
            isOpen={isOpen}
            onRequestClose={onRequestClose}
            title="Change Owner"
        >
            <OwnerList initialValue={initialOwnerName} onOwnerChange={setSelectedOwner} />
            <div className='flex justify-end gap-2 mt-4'>
                <ActionButton onClick={() => onConfirm(selectedOwner)} color='blue'>Change</ActionButton>
                <ActionButton onClick={onRequestClose} color='red'>Cancel</ActionButton>
            </div>
        </GeneralModal>
    );
};

export default OwnerModal;