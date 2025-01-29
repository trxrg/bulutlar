import React from 'react';
import { useTranslation } from 'react-i18next';

const SearchHeader = () => {
    const { t } = useTranslation();

    return (
        <div className={'overflow-auto px-6 py-3 bg-stone-100 border-b-4 border-red-300'}>
            <div className="text-3xl font-semibold text-gray-800">
                {t('article center')}
            </div>
        </div>
    );
};

export default SearchHeader;