import React from 'react';
import { useTranslation } from 'react-i18next';

const SearchHeader = () => {
    const { t } = useTranslation();

    return (
        <div className={'overflow-auto px-6 py-3 bg-white border-b-4 border-[#809671]'}>
            <div className="text-3xl font-semibold text-gray-800">
                {t('search screen')}
            </div>
        </div>
    );
};

export default SearchHeader;