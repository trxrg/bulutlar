import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { addDays, format, startOfWeek } from 'date-fns';
import { enUS, tr } from 'date-fns/locale';
import {
    gregorianToHijri,
    getDisplayHijriMonthDays,
    shiftDisplayHijriMonth,
} from '../../utils/hijriDate.js';

const HIJRI_MONTH_KEYS = [
    'hijri_month_1',
    'hijri_month_2',
    'hijri_month_3',
    'hijri_month_4',
    'hijri_month_5',
    'hijri_month_6',
    'hijri_month_7',
    'hijri_month_8',
    'hijri_month_9',
    'hijri_month_10',
    'hijri_month_11',
    'hijri_month_12',
];

const localeMap = {
    'en-US': enUS,
    tr,
};

const FOOTER_HEIGHT_PX = 22;
const GRID_ROWS = 6;
const GRID_COLS = 7;
const GRID_CELLS = GRID_ROWS * GRID_COLS;

const FooterHijriCalendar = ({ open, anchorRect, today, onClose, locale, t }) => {
    const todayHijri = gregorianToHijri(today);
    const [viewYear, setViewYear] = useState(todayHijri.year);
    const [viewMonth, setViewMonth] = useState(todayHijri.month);

    useEffect(() => {
        if (!open) return;
        const onKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [open, onClose]);

    useEffect(() => {
        if (!open) return;
        const h = gregorianToHijri(today);
        setViewYear(h.year);
        setViewMonth(h.month);
    }, [open, today]);

    const monthDays = useMemo(
        () => getDisplayHijriMonthDays(viewYear, viewMonth),
        [viewYear, viewMonth]
    );

    const dateFnsLocale = localeMap[locale] || tr;
    const weekdayLabels = useMemo(() => {
        const monday = startOfWeek(new Date(), { weekStartsOn: 1, locale: dateFnsLocale });
        return Array.from({ length: 7 }, (_, i) =>
            format(addDays(monday, i), 'EEE', { locale: dateFnsLocale })
        );
    }, [dateFnsLocale]);

    const leadingBlanks =
        monthDays.length > 0 ? (monthDays[0].date.getDay() + 6) % 7 : 0;
    const monthTitle = `${t(HIJRI_MONTH_KEYS[viewMonth - 1])} (${viewMonth}) ${viewYear}`;

    const gridCells = useMemo(() => {
        const cells = [];
        for (let i = 0; i < leadingBlanks; i++) {
            cells.push({ key: `lead-${i}`, empty: true });
        }
        monthDays.forEach(({ day }) => {
            cells.push({ key: `day-${day}`, empty: false, day });
        });
        while (cells.length < GRID_CELLS) {
            cells.push({ key: `trail-${cells.length}`, empty: true });
        }
        return cells;
    }, [leadingBlanks, monthDays]);

    const goPrevMonth = () => {
        const next = shiftDisplayHijriMonth(viewYear, viewMonth, -1);
        setViewYear(next.year);
        setViewMonth(next.month);
    };

    const goNextMonth = () => {
        const next = shiftDisplayHijriMonth(viewYear, viewMonth, 1);
        setViewYear(next.year);
        setViewMonth(next.month);
    };

    if (!open || !anchorRect) return null;

    const style = {
        position: 'fixed',
        left: Math.max(8, anchorRect.left),
        bottom: FOOTER_HEIGHT_PX,
        zIndex: 10000,
    };

    const isToday = (day) =>
        todayHijri.year === viewYear &&
        todayHijri.month === viewMonth &&
        todayHijri.day === day;

    return createPortal(
        <>
            <div
                className="fixed inset-0"
                style={{ zIndex: 9999 }}
                onMouseDown={onClose}
                aria-hidden="true"
            />
            <div
                className="footer-hijri-calendar footer-hijri-calendar--view-only footer-date-calendar rounded shadow-lg"
                style={style}
                onMouseDown={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label={t('hijri date')}
            >
                <div className="footer-hijri-calendar__header">
                    <button type="button" className="footer-hijri-calendar__nav" onClick={goPrevMonth} aria-label="Previous month">
                        ‹
                    </button>
                    <span className="footer-hijri-calendar__title">{monthTitle}</span>
                    <button type="button" className="footer-hijri-calendar__nav" onClick={goNextMonth} aria-label="Next month">
                        ›
                    </button>
                </div>
                <div className="footer-hijri-calendar__weekdays">
                    {weekdayLabels.map((label) => (
                        <span key={label} className="footer-hijri-calendar__weekday">
                            {label}
                        </span>
                    ))}
                </div>
                <div className="footer-hijri-calendar__grid">
                    {gridCells.map((cell) =>
                        cell.empty ? (
                            <span
                                key={cell.key}
                                className="footer-hijri-calendar__day footer-hijri-calendar__day--empty"
                            />
                        ) : (
                            <span
                                key={cell.key}
                                className={
                                    'footer-hijri-calendar__day' +
                                    (isToday(cell.day) ? ' footer-hijri-calendar__day--today' : '')
                                }
                            >
                                {cell.day}
                            </span>
                        )
                    )}
                </div>
            </div>
        </>,
        document.body
    );
};

export default FooterHijriCalendar;
