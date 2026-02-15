import React, {useContext} from 'react';
import Modal from 'react-modal';

import ActionButton from './ActionButton.jsx';
import { AppContext } from '../../store/app-context.jsx';

Modal.setAppElement('#root');

const ConfirmModal = ({ message, isOpen, onClose, onConfirm }) => {

    const { translate: t } = useContext(AppContext);

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onClose}
            className="fixed inset-0 flex items-center justify-center p-4"
            overlayClassName="fixed top-0 left-0 z-50 w-full h-full bg-black bg-opacity-75"
            shouldCloseOnOverlayClick={true}
        >
            <div className="relative rounded-lg shadow-lg bg-white p-4 whitespace-pre-line">
                <div className="text-lg">{message}</div>
                <div className='flex justify-end gap-2 mt-4'>
                    <ActionButton onClick={onConfirm} color='red'>{t('yes')}</ActionButton>
                    <ActionButton onClick={onClose} >{t('cancel')}</ActionButton>
                </div>
            </div>
        </Modal>
    );
};

export default ConfirmModal;
