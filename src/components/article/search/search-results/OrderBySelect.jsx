import React, { useContext } from 'react';
import { BarsArrowDownIcon } from '@heroicons/react/24/outline';
import { AppContext } from '../../../../store/app-context';

const OrderBySelect = ({ onOrderChange, initialSelection }) => {
    const { translate: t } = useContext(AppContext);

    const options = [
        { field: 'date', direction: 'asc', label: t('order by date ascending') },
        { field: 'date', direction: 'desc', label: t('order by date descending') },
        { field: 'ordering', direction: 'asc', label: t('order by number ascending') },
        { field: 'ordering', direction: 'desc', label: t('order by number descending') }
    ];

    const getLabelByValue = (value) => {
        const option = options.find(
            (option) => option.field === value.field && option.direction === value.direction
        );
        return option ? option.label : '';
    };

    return (
        <div className='flex items-center rounded-lg shadow-sm min-w-60' 
             style={{
                 backgroundColor: 'var(--bg-primary)',
                 border: '1px solid var(--border-secondary)'
             }}>
            <BarsArrowDownIcon className="w-5 h-5 ml-3" style={{ color: 'var(--text-tertiary)' }} />
            <select 
                onChange={(e) => onOrderChange(JSON.parse(e.target.value))} 
                className="flex-1 p-2 border-none outline-none bg-transparent cursor-pointer"
                style={{
                    color: 'var(--text-primary)'
                }}
                value={JSON.stringify(initialSelection)}
                label={getLabelByValue(initialSelection)}
            >
                {options.map((option, index) => (
                    <option key={index} value={JSON.stringify({ field: option.field, direction: option.direction })}>
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default OrderBySelect;