import React, { useMemo } from 'react';
import { addDays, format, startOfWeek } from 'date-fns';
import { resolveDateFnsLocale } from '../../utils/dateFnsLocale.js';

const GRID_ROWS = 6;
const GRID_COLS = 7;
const GRID_CELLS = GRID_ROWS * GRID_COLS;

/**
 * Month view shared by the Gregorian and Hijri calendars. Callers supply the
 * days of the month; this only lays them out and reports interactions.
 */
const CalendarPanel = ({
    title,
    days,
    locale,
    selectedDay = null,
    todayDay = null,
    onSelectDay,
    onShiftMonth,
    onShiftYear,
    selectable = false,
    showYearNav = false,
}) => {
    const dateFnsLocale = resolveDateFnsLocale(locale);

    const weekdayLabels = useMemo(() => {
        const monday = startOfWeek(new Date(), { weekStartsOn: 1, locale: dateFnsLocale });
        return Array.from({ length: 7 }, (_, i) =>
            format(addDays(monday, i), 'EEE', { locale: dateFnsLocale })
        );
    }, [dateFnsLocale]);

    const gridCells = useMemo(() => {
        const leadingBlanks = days.length > 0 ? (days[0].date.getDay() + 6) % 7 : 0;
        const cells = [];
        for (let i = 0; i < leadingBlanks; i++) {
            cells.push({ key: `lead-${i}`, empty: true });
        }
        days.forEach(({ day }) => {
            cells.push({ key: `day-${day}`, empty: false, day });
        });
        while (cells.length < GRID_CELLS) {
            cells.push({ key: `trail-${cells.length}`, empty: true });
        }
        return cells;
    }, [days]);

    const dayClassName = (day) =>
        'calendar-panel__day' +
        (day === selectedDay ? ' calendar-panel__day--selected' : '') +
        (day === todayDay ? ' calendar-panel__day--today' : '');

    return (
        <div
            className={
                'calendar-panel rounded shadow-lg' +
                (selectable ? ' calendar-panel--selectable' : ' calendar-panel--view-only')
            }
        >
            <div className="calendar-panel__header">
                {showYearNav && (
                    <button
                        type="button"
                        className="calendar-panel__nav"
                        onClick={() => onShiftYear(-1)}
                        aria-label="Previous year"
                    >
                        «
                    </button>
                )}
                <button
                    type="button"
                    className="calendar-panel__nav"
                    onClick={() => onShiftMonth(-1)}
                    aria-label="Previous month"
                >
                    ‹
                </button>
                <span className="calendar-panel__title">{title}</span>
                <button
                    type="button"
                    className="calendar-panel__nav"
                    onClick={() => onShiftMonth(1)}
                    aria-label="Next month"
                >
                    ›
                </button>
                {showYearNav && (
                    <button
                        type="button"
                        className="calendar-panel__nav"
                        onClick={() => onShiftYear(1)}
                        aria-label="Next year"
                    >
                        »
                    </button>
                )}
            </div>
            <div className="calendar-panel__weekdays">
                {weekdayLabels.map((label) => (
                    <span key={label} className="calendar-panel__weekday">
                        {label}
                    </span>
                ))}
            </div>
            <div className="calendar-panel__grid">
                {gridCells.map((cell) => {
                    if (cell.empty) {
                        return (
                            <span
                                key={cell.key}
                                className="calendar-panel__day calendar-panel__day--empty"
                            />
                        );
                    }
                    return selectable ? (
                        <button
                            key={cell.key}
                            type="button"
                            className={dayClassName(cell.day)}
                            onClick={() => onSelectDay(cell.day)}
                        >
                            {cell.day}
                        </button>
                    ) : (
                        <span key={cell.key} className={dayClassName(cell.day)}>
                            {cell.day}
                        </span>
                    );
                })}
            </div>
        </div>
    );
};

export default CalendarPanel;
