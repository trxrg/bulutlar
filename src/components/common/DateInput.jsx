import React, { useContext } from 'react';
import DatePicker from 'react-datepicker';
import { registerLocale } from 'react-datepicker';
import { enUS, tr } from 'date-fns/locale';
import { format } from 'date-fns';
import { AppContext } from '../../store/app-context';

registerLocale('en-US', enUS);
registerLocale('tr', tr);

const DateInput = ({ dispDate, onDateChange }) => {

    const { translate: t } = useContext(AppContext);

    // Convert string date to Date object for DatePicker
    const selectedDate = dispDate ? new Date(dispDate) : null;

    const handleChanged = (date) => {
        // Format date as 'yyyy-MM-dd' to match what the parent expects
        const formattedDate = format(date, 'yyyy-MM-dd');
        onDateChange(formattedDate);
    }

    return (
        <DatePicker
            selected={selectedDate}
            onChange={(date) => handleChanged(date)}
            required
            className='rounded-md px-3 py-2 focus:outline-none date-input-custom'
            style={{
                border: '1px solid var(--border-secondary)',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                width: '100%'
            }}
            locale={t('locale')}
            dateFormat="dd/MM/yyyy"
            popperClassName="date-picker-popper"
        />
    );
};

export default DateInput;