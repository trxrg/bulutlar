import React from 'react';
import { useTranslation } from 'react-i18next';

const SearchHeader = () => {
    const { t } = useTranslation();

    return (
        <div className='bg-stone-50 py-1 px-2 border-b-4 border-red-300'>
            <h1>{t('filters')}:</h1>
        </div>
    );
};

export default SearchHeader;