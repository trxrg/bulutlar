import React, { useContext } from 'react';
import SaveIcon from '@mui/icons-material/Save';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { AppContext } from '../../../../store/app-context.jsx';
import FormatButton from '../../../common/FormatButton.jsx';

const SearchFilteringsHeader = ({ onSaveFilter, onClearAll }) => {
    const { translate: t } = useContext(AppContext);

    return (
        <div className='flex flex-wrap justify-between p-2 shadow-lg items-center' style={{ backgroundColor: 'var(--bg-secondary)', minHeight: '70px' }}>
            <h2
                className='ml-2 text-xl font-semibold'
                style={{ color: 'var(--text-primary)' }}
            >
                {t('filters')}
            </h2>
            <div className='flex gap-1'>
                <FormatButton onClick={onClearAll} title={t('clear all filters')}>
                    <XMarkIcon className="w-5 h-5" />
                </FormatButton>
                <FormatButton onClick={onSaveFilter} title={t('save current filter')}>
                    <SaveIcon sx={{ fontSize: 20 }} />
                </FormatButton>
            </div>
        </div>
    );
};

export default SearchFilteringsHeader;

