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

    return (
        <DatePicker
            selected={dispDate}
            onChange={(date) => onDateChange(date)}
            required
            className='border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring focus:border-blue-500'
            locale={t('locale')}
            dateFormat="dd/MM/yyyy"
        />
    );
};

export default DateInput;