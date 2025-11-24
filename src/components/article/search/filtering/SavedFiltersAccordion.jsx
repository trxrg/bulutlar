import React, { useContext } from 'react';
import { AppContext } from '../../../../store/app-context.jsx';
import { SearchContext } from '../../../../store/search-context.jsx';
import FilterAccordion from './FilterAccordion.jsx';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import IconButton from '@mui/material/IconButton';

const SavedFiltersAccordion = () => {
    const { translate: t } = useContext(AppContext);
    const { savedFilters, applyFilter, deleteFilter } = useContext(SearchContext);

    const handleApplyFilter = (filterId) => {
        applyFilter(filterId);
    };

    const handleDeleteFilter = (e, filterId) => {
        e.stopPropagation();
        deleteFilter(filterId);
    };

    return (
        <FilterAccordion 
            title={t('saved filters')} 
            isFilterActive={false} 
            clearFilter={() => {}}
        >
            <div className='flex flex-col gap-2 p-2'>
                {savedFilters && savedFilters.length > 0 ? (
                    savedFilters.map((filter) => (
                        <div
                            key={filter.id}
                            className='flex items-center justify-between p-3 rounded cursor-pointer hover:opacity-80 transition-opacity gap-2'
                            style={{ 
                                backgroundColor: 'var(--bg-secondary)', 
                                color: 'var(--text-primary)',
                                border: '1px solid var(--border-color)'
                            }}
                        >
                            <span 
                                className='flex-1 select-none overflow-hidden text-ellipsis whitespace-nowrap'
                                onClick={() => handleApplyFilter(filter.id)}
                                title={filter.name}
                            >
                                {filter.name}
                            </span>
                            <div className='flex gap-1 flex-shrink-0'>
                                <IconButton
                                    size="small"
                                    onClick={() => handleApplyFilter(filter.id)}
                                    sx={{ 
                                        color: '#059669',
                                        '&:hover': {
                                            backgroundColor: 'rgba(5, 150, 105, 0.1)',
                                        }
                                    }}
                                    title={t('apply filter')}
                                >
                                    <CheckIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                    size="small"
                                    onClick={(e) => handleDeleteFilter(e, filter.id)}
                                    sx={{ 
                                        color: '#B53A16',
                                        '&:hover': {
                                            backgroundColor: 'rgba(181, 58, 22, 0.1)',
                                        }
                                    }}
                                    title={t('delete filter')}
                                >
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </div>
                        </div>
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

