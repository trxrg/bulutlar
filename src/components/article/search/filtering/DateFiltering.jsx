import React, { useState, useContext } from 'react';
import { AppContext } from '../../../../store/app-context';
import ActionButton from '../../../common/ActionButton';

const DateFiltering = ({ startDate, setStartDate, endDate, setEndDate }) => {

    const { translate: t } = useContext(AppContext);
    const [startDay, setStartDay] = useState(startDate.day);
    const [startMonth, setStartMonth] = useState(startDate.month);
    const [startYear, setStartYear] = useState(startDate.year);
    const [endDay, setEndDay] = useState(endDate.day);
    const [endMonth, setEndMonth] = useState(endDate.month);
    const [endYear, setEndYear] = useState(endDate.year);

    const setFiltering = () => {
        setStartDate({ day: startDay, month: startMonth, year: startYear });
        setEndDate({ day: endDay, month: endMonth, year: endYear });
    }

    const inputStyle = 'flex-1 min-w-0 border border-black rounded p-1';

    return (
        <div className='flex flex-col gap-4'>
            <div className='flex flex-col gap-2'>
                <label>{t('start')}:</label>
                <div className='flex flex-row flex-wrap gap-2'>
                    <input
                        type="number"
                        value={startDay}
                        onChange={e => setStartDay(e.target.value)}
                        placeholder={t('day')}
                        className={inputStyle}
                    />
                    <input
                        type="number"
                        value={startMonth}
                        onChange={(e) => setStartMonth(e.target.value)}
                        placeholder={t('month')}
                        className={inputStyle}
                    />
                    <input
                        type="number"
                        value={startYear}
                        onChange={(e) => setStartYear(e.target.value)}
                        placeholder={t('year')}
                        className={inputStyle}
                    />
                </div>
            </div>
            <div className='flex flex-col gap-4'>
                <label>{t('end')}:</label>
                <div className='flex flex-row flex-wrap gap-2'>
                    <input
                        type="number"
                        value={endDay}
                        onChange={(e) => setEndDay(e.target.value)}
                        placeholder={t('day')}
                        className={inputStyle}
                    />
                    <input
                        type="number"
                        value={endMonth}
                        onChange={(e) => setEndMonth(e.target.value)}
                        placeholder={t('month')}
                        className={inputStyle}
                    />
                    <input
                        type="number"
                        value={endYear}
                        onChange={(e) => setEndYear(e.target.value)}
                        placeholder={t('year')}
                        className={inputStyle}
                    />
                </div>
            </div>
            <ActionButton onClick={setFiltering}>{t('apply')}</ActionButton>
        </div>
    );
};

export default DateFiltering;
