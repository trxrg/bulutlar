import { useTranslation } from 'react-i18next';

const SearchHeader = () => {
    const { t } = useTranslation();

    return (
        <div className={'overflow-auto px-4 py-3 border-b-4'} 
             style={{ 
                 backgroundColor: 'var(--bg-primary)', 
                 borderBottomColor: 'var(--border-primary)' 
             }}>
            <h1 className='flex text-3xl justify-center' style={{ color: 'var(--text-primary)' }}>
                {t('search screen')}
            </h1>
        </div>
    );
};

export default SearchHeader;