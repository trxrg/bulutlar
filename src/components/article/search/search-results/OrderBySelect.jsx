import React, { useContext } from 'react';
import { AppContext } from '../../../../store/app-context';

const OrderBySelect = ({ onOrderChange, initialSelection }) => {
    const { translate: t } = useContext(AppContext);

    const options = [
        { field: 'date', direction: 'asc', label: t('order by date ascending') },
        { field: 'date', direction: 'desc', label: t('order by date descending') },
        { field: 'ordering', direction: 'asc', label: t('order by number ascending') },
        { field: 'ordering', direction: 'desc', label: t('order by number descending') }
    ];

    console.log('initialSelection', initialSelection);

    const getLabelByValue = (value) => {
        const option = options.find(
            (option) => option.field === value.field && option.direction === value.direction
        );
        return option ? option.label : '';
    };

    return (
        <select 
            onChange={(e) => onOrderChange(JSON.parse(e.target.value))} 
            className="border rounded px-2 py-1 max-h-10"
            value={JSON.stringify(initialSelection)}
            label={getLabelByValue(initialSelection)}
        >
            {options.map((option, index) => (
                <option key={index} value={JSON.stringify({ field: option.field, direction: option.direction })}>
                    {option.label}
                </option>
            ))}
        </select>
    );
};

export default OrderBySelect;