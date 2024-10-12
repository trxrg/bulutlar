import React from 'react';
import Modal from 'react-modal';

import ActionButton from '../common/ActionButton.jsx';

Modal.setAppElement('#root');

const ConfirmModal = ({ message, isOpen, onClose, onConfirm }) => {

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onClose}
            className="fixed inset-0 flex items-center justify-center p-4"
            overlayClassName="fixed top-0 left-0 z-50 w-full h-full bg-black bg-opacity-75"
            shouldCloseOnOverlayClick={true}
        >
            <div className="relative rounded-lg shadow-lg bg-white p-4">
                <div className="text-lg">{message}</div>
                <div className='flex justify-end gap-2 mt-4'>
                    <ActionButton onClick={onConfirm} color='blue'>Yes</ActionButton>
                    <ActionButton onClick={onClose} color='red'>No</ActionButton>
                </div>
            </div>
        </Modal>
    );
};

export default ConfirmModal;
