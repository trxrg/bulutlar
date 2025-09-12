import React, { useState, useContext, useEffect } from 'react';
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

    useEffect(() => {
        setStartDay(startDate.day ? startDate.day : '');
        setStartMonth(startDate.month ? startDate.month : '');
        setStartYear(startDate.year ? startDate.year : '');
        setEndDay(endDate.day ? endDate.day : '');
        setEndMonth(endDate.month ? endDate.month : '');
        setEndYear(endDate.year ? endDate.year : '');
    }, [startDate, endDate]);

    const inputStyle = {
        border: '1px solid var(--border-secondary)',
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        borderRadius: '4px',
        padding: '4px',
        flex: '1',
        minWidth: '0'
    };

    return (
        <div className='flex flex-col gap-4' style={{ color: 'var(--text-primary)' }}>
            <div className='flex flex-col gap-2'>
                <label style={{ color: 'var(--text-primary)' }}>{t('start')}:</label>
                <div className='flex flex-row flex-wrap gap-2'>
                    <input
                        type="number"
                        value={startDay}
                        onChange={e => setStartDay(e.target.value)}
                        placeholder={t('day')}
                        style={inputStyle}
                    />
                    <input
                        type="number"
                        value={startMonth}
                        onChange={(e) => setStartMonth(e.target.value)}
                        placeholder={t('month')}
                        style={inputStyle}
                    />
                    <input
                        type="number"
                        value={startYear}
                        onChange={(e) => setStartYear(e.target.value)}
                        placeholder={t('year')}
                        style={inputStyle}
                    />
                </div>
            </div>
            <div className='flex flex-col gap-4'>
                <label style={{ color: 'var(--text-primary)' }}>{t('end')}:</label>
                <div className='flex flex-row flex-wrap gap-2'>
                    <input
                        type="number"
                        value={endDay}
                        onChange={(e) => setEndDay(e.target.value)}
                        placeholder={t('day')}
                        style={inputStyle}
                    />
                    <input
                        type="number"
                        value={endMonth}
                        onChange={(e) => setEndMonth(e.target.value)}
                        placeholder={t('month')}
                        style={inputStyle}
                    />
                    <input
                        type="number"
                        value={endYear}
                        onChange={(e) => setEndYear(e.target.value)}
                        placeholder={t('year')}
                        style={inputStyle}
                    />
                </div>
            </div>
            <ActionButton onClick={setFiltering}>{t('apply')}</ActionButton>
        </div>
    );
};

export default DateFiltering;
