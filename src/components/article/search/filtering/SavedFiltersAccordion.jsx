import React, { useContext } from 'react';
import { AppContext } from '../../../../store/app-context.jsx';
import { SearchContext } from '../../../../store/search-context.jsx';
import FilterAccordion from './FilterAccordion.jsx';
import SavedFilterCard from './SavedFilterCard.jsx';

const SavedFiltersAccordion = () => {
    const { translate: t } = useContext(AppContext);
    const { savedFilters, applyFilter, deleteFilter } = useContext(SearchContext);

    return (
        <FilterAccordion 
            title={t('saved filters')} 
            isFilterActive={false} 
            clearFilter={() => {}}
        >
            <div className='flex flex-col gap-2 p-2'>
                {savedFilters && savedFilters.length > 0 ? (
                    savedFilters.map((filter) => (
                        <SavedFilterCard
                            key={filter.id}
                            filter={filter}
                            onApply={applyFilter}
                            onDelete={deleteFilter}
                        />
                    ))
                ) : (
                    <div 
                        className='text-center py-4 select-none' 
                        style={{ color: 'var(--text-tertiary)' }}
                    >
                        {t('no saved filters')}
                    </div>
                )}
            </div>
        </FilterAccordion>
    );
};

export default SavedFiltersAccordion;
