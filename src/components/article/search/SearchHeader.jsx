import React from 'react';
import { useTranslation } from 'react-i18next';

const SearchHeader = () => {
    const { t } = useTranslation();

    return (
        <div className={'overflow-auto px-4 py-3 border-b-4'} 
             style={{ 
                 backgroundColor: 'var(--bg-secondary)', 
                 borderBottomColor: 'var(--border-primary)' 
             }}>
            <h1 className='text-3xl' style={{ color: 'var(--text-secondary)' }}>
                {t('search screen')}
            </h1>
        </div>
    );
};

export default SearchHeader;