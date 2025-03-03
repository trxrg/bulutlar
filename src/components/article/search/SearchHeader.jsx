import React from 'react';
import { useTranslation } from 'react-i18next';

const SearchHeader = () => {
    const { t } = useTranslation();

    return (
        <div className={'overflow-auto px-4 py-3 bg-white border-b-4 border-[#809671]'}>
            <h1 className='text-3xl text-gray-600'>{t('search screen')}</h1>
        </div>
    );
};

export default SearchHeader;