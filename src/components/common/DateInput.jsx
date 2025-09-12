import React, { useContext } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { registerLocale } from 'react-datepicker';
import { enUS, tr } from 'date-fns/locale';
import { AppContext } from '../../store/app-context';

registerLocale('en-US', enUS);
registerLocale('tr', tr);

const DateInput = ({ dispDate, onDateChange }) => {

    const { translate: t } = useContext(AppContext);

    const handleChanged = (date) => {
        onDateChange(new Date(date).toLocaleDateString());
    }

    return (
        <DatePicker
            selected={dispDate}
            onChange={(date) => handleChanged(date)}
            required
            className='rounded-md px-3 py-2 focus:outline-none focus:ring'
            style={{
                border: '1px solid var(--border-secondary)',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)'
            }}
            locale={t('locale')}
            dateFormat="dd/MM/yyyy"
        />
    );
};

export default DateInput;