import React, { useState, useContext, useEffect } from 'react';
import Checkbox from '@mui/material/Checkbox';
import { AppContext } from '../../../../store/app-context';
import ActionButton from '../../../common/ActionButton';
import DatePickerButton from '../../../common/DatePickerButton.jsx';
import { gregorianToHijri } from '../../../../utils/hijriDate.js';

const EMPTY_DATE = { day: '', month: '', year: '' };

const DateField = ({ label, value, onChange, min, max, defaultValue }) => {
    const enabled = value !== '';

    return (
        <label className="flex min-w-0 flex-1 items-center gap-1" title={label}>
            <Checkbox
                size="small"
                checked={enabled}
                onChange={(event) => onChange(event.target.checked ? String(defaultValue) : '')}
                inputProps={{ 'aria-label': `${label} filter` }}
                sx={{
                    padding: '2px',
                    color: 'var(--text-secondary)',
                    '&.Mui-checked': { color: 'var(--text-primary)' },
                }}
            />
            <input
                type="number"
                value={enabled ? value : ''}
                onChange={(event) => onChange(event.target.value)}
                placeholder={label}
                min={min}
                max={max}
                disabled={!enabled}
                className="min-w-0 flex-1 rounded p-1 disabled:opacity-50"
                style={{
                    border: '1px solid var(--border-secondary)',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                }}
            />
        </label>
    );
};

const DateBoundary = ({ label, value, onChange, t, locale, isHijri }) => {
    const today = new Date();
    const fallbackParts = isHijri
        ? gregorianToHijri(today)
        : { day: today.getDate(), month: today.getMonth() + 1, year: today.getFullYear() };

    const setPart = (part, nextValue) => {
        onChange({ ...value, [part]: nextValue });
    };

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
                <span>{label}</span>
                <DatePickerButton
                    value={value}
                    onSelect={onChange}
                    label={t('pick date from calendar')}
                    locale={locale}
                    t={t}
                    isHijri={isHijri}
                />
            </div>
            <div className="flex flex-row gap-1">
                <DateField label={t('day')} value={value.day} onChange={(next) => setPart('day', next)} min={1} max={isHijri ? 30 : 31} defaultValue={fallbackParts.day} />
                <DateField label={t('month')} value={value.month} onChange={(next) => setPart('month', next)} min={1} max={12} defaultValue={fallbackParts.month} />
                <DateField label={t('year')} value={value.year} onChange={(next) => setPart('year', next)} min={1} max={9999} defaultValue={fallbackParts.year} />
            </div>
        </div>
    );
};

const DateFiltering = ({ startDate, setStartDate, endDate, setEndDate, mode, setMode, isHijri = false }) => {
    const { translate: t } = useContext(AppContext);
    const [draftStart, setDraftStart] = useState(startDate);
    const [draftEnd, setDraftEnd] = useState(endDate);
    const [draftMode, setDraftMode] = useState(mode);

    const applyFiltering = () => {
        setMode(draftMode);
        setStartDate(draftStart);
        setEndDate(draftMode === 'exact' ? EMPTY_DATE : draftEnd);
    };

    useEffect(() => {
        setDraftStart(startDate || EMPTY_DATE);
        setDraftEnd(endDate || EMPTY_DATE);
        setDraftMode(mode || 'interval');
    }, [startDate, endDate, mode]);

    return (
        <div className="flex flex-col gap-4" style={{ color: 'var(--text-primary)' }}>
            <div
                className="grid grid-cols-2 overflow-hidden rounded"
                style={{ border: '1px solid var(--border-secondary)' }}
            >
                {['exact', 'interval'].map((option) => (
                    <button
                        key={option}
                        type="button"
                        onClick={() => setDraftMode(option)}
                        className="px-2 py-1.5 text-sm transition-colors"
                        style={{
                            backgroundColor: draftMode === option ? 'var(--bg-tertiary)' : 'var(--bg-primary)',
                            color: 'var(--text-primary)',
                            fontWeight: draftMode === option ? 600 : 400,
                        }}
                    >
                        {t(option === 'exact' ? 'exact date' : 'date interval')}
                    </button>
                ))}
            </div>

            <DateBoundary
                label={draftMode === 'exact' ? t('date') : `${t('start')}:`}
                value={draftStart}
                onChange={setDraftStart}
                t={t}
                locale={t('locale')}
                isHijri={isHijri}
            />

            {draftMode === 'interval' && (
                <DateBoundary
                    label={`${t('end')}:`}
                    value={draftEnd}
                    onChange={setDraftEnd}
                    t={t}
                    locale={t('locale')}
                    isHijri={isHijri}
                />
            )}

            <ActionButton onClick={applyFiltering}>{t('apply')}</ActionButton>
        </div>
    );
};

export default DateFiltering;
