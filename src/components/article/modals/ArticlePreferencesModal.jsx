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
    const [ordering, setOrdering] = useState(article.ordering || article.id);

    console.log('article ordering: ', article.ordering);


    return (
        <GeneralModal
            isOpen={isOpen}
            onRequestClose={onRequestClose}
            title={t('preferences')}
        >
            <div className='flex flex-col gap-4 mb-4'>
                <div className='flex flex-row gap-2 items-center'>
                    <h2 className='text-xl'>{t('ordering') + ':'}</h2>
                    <input
                        type={'number'}
                        value={ordering}
                        onChange={(e) => setOrdering(e.target.value)}
                        className="rounded-md, p-1"
                    />
                </div>
                <div className='flex flex-row gap-4 items-center'>
                    <h2 className='text-xl'>{t('date') + ':'}</h2>
                    <label className={'select-none cursor-pointer'}>
                        <Checkbox
                            checked={isDateUncertain}
                            onChange={(e) => setDateUncertain(e.target.checked)}
                        />
                        {t('date is uncertain')}
                    </label>
                </div>
                <div className='flex flex-row gap-4 items-center'>
                    <h2 className='text-xl'>{t('owner') + ':'}</h2>
                    <OwnerList initialValue={selectedOwnerName} onOwnerChange={setSelectedOwnerName} />
                </div>
            </div>
            <div className='flex justify-end gap-2 mt-4'>
                <ActionButton onClick={onRequestClose} color='red'>{t('cancel')}</ActionButton>
                <ActionButton onClick={() => onConfirm({ isDateUncertain, ordering, selectedOwnerName })} color='blue'>{t('save')}</ActionButton>
            </div>
        </GeneralModal>
    );
};

export default ArticlePreferencesModal;