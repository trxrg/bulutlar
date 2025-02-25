import React, { useState, useContext } from 'react';
import GeneralModal from '../../common/GeneralModal.jsx';
import ActionButton from '../../common/ActionButton.jsx';
import OwnerList from '../../owner/OwnerList.jsx';
import { AppContext } from '../../../store/app-context';
import { ReadContext } from '../../../store/read-context';
import { DBContext } from '../../../store/db-context.jsx';
import Checkbox from '@mui/material/Checkbox';

const ArticlePreferencesModal = ({ isOpen, onRequestClose, onConfirm }) => {

    const { translate: t } = useContext(AppContext);
    const { article } = useContext(ReadContext);
    const { getOwnerById } = useContext(DBContext);
    const initialOwnerName = article && article.ownerId && getOwnerById(article.ownerId);
    const [selectedOwnerName, setSelectedOwnerName] = useState(initialOwnerName);
    const [isDateUncertain, setDateUncertain] = useState(false);

    return (
        <GeneralModal
            isOpen={isOpen}
            onRequestClose={onRequestClose}
            title={t('preferences')}
        >
            <div className='flex flex-col gap-4 mb-4'>  
                <label className={'select-none cursor-pointer'}>
                    <Checkbox
                        checked={isDateUncertain}
                        onChange={(e) => setDateUncertain(e.target.checked)}
                    />
                    {t('date is uncertain')}
                </label>
                <h2>{t('owner')}</h2>
                <OwnerList initialValue={selectedOwnerName} onOwnerChange={setSelectedOwnerName} />
            </div>
            <div className='flex justify-end gap-2 mt-4'>
                <ActionButton onClick={onRequestClose} color='red'>{t('cancel')}</ActionButton>
                <ActionButton onClick={() => onConfirm({ isDateUncertain, selectedOwnerName })} color='blue'>{t('save')}</ActionButton>
            </div>
        </GeneralModal>
    );
};

export default ArticlePreferencesModal;