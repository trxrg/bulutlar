import React, { useContext } from 'react';
import Modal from 'react-modal';

import ActionButton from './ActionButton.jsx';
import { AppContext } from '../../store/app-context.jsx';

Modal.setAppElement('#root');

const SaveConfirmModal = ({ isOpen, onClose, onSave, onDiscard }) => {
    const { translate: t } = useContext(AppContext);

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onClose}
            className="fixed inset-0 flex items-center justify-center p-4"
            overlayClassName="fixed top-0 left-0 z-50 w-full h-full bg-black bg-opacity-75"
            shouldCloseOnOverlayClick={true}
        >
            <div className="relative rounded-lg shadow-lg p-6 whitespace-pre-line" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                <div className="text-lg mb-4">{t('saveChangesMessage')}</div>
                <div className='flex justify-end gap-2 mt-4'>
                    <ActionButton onClick={onClose} color='gray'>{t('cancel')}</ActionButton>
                    <ActionButton onClick={onDiscard} color='red'>{t('dontSave')}</ActionButton>
                    <ActionButton onClick={onSave}>{t('save')}</ActionButton>
                </div>
            </div>
        </Modal>
    );
};

export default SaveConfirmModal;
