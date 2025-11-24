import React, { useState, useContext, useEffect } from 'react';
import GeneralModal from '../../../common/GeneralModal';
import ActionButton from '../../../common/ActionButton';
import { AppContext } from '../../../../store/app-context';
import toastr from 'toastr';

const SaveFilterModal = ({ isOpen, onRequestClose, onConfirm }) => {

    const { translate: t } = useContext(AppContext);

    const [filterName, setFilterName] = useState('');

    useEffect(() => {
        if (isOpen) {
            // Generate default name with current timestamp
            const now = new Date();
            const defaultName = `${t('filter')} ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
            setFilterName(defaultName);
        }
    }, [isOpen, t]);

    const handleConfirm = () => {
        if (!filterName || filterName.trim() === '') {
            toastr.warning(t('please enter a filter name'));
            return;
        }
        onConfirm(filterName.trim());
        onRequestClose();
    };

    return (
        <GeneralModal
            isOpen={isOpen}
            onRequestClose={onRequestClose}
            title={t('save filter')}
        >
            <div className='flex flex-col gap-4'>
                <div>
                    <label className='block text-lg mb-2' style={{ color: 'var(--text-primary)' }}>
                        {t('filter name')}:
                    </label>
                    <input
                        type="text"
                        value={filterName}
                        onChange={(e) => setFilterName(e.target.value)}
                        className='w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                        style={{ 
                            backgroundColor: 'var(--bg-secondary)', 
                            color: 'var(--text-primary)',
                            borderColor: 'var(--border-color)'
                        }}
                        autoFocus
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                                handleConfirm();
                            }
                        }}
                    />
                </div>
            </div>
            <div className='flex justify-end gap-2 mt-4'>
                <ActionButton onClick={onRequestClose} color='red'>{t('cancel')}</ActionButton>
                <ActionButton onClick={handleConfirm} color='blue'>{t('save')}</ActionButton>
            </div>
        </GeneralModal>
    );
};

export default SaveFilterModal;

