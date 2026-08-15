import React, { useMemo } from 'react';
import { format, getDaysInMonth } from 'date-fns';
import { resolveDateFnsLocale } from '../../utils/dateFnsLocale.js';
import CalendarPanel from './CalendarPanel.jsx';

const atNoon = (year, month, day) => new Date(year, month - 1, day, 12, 0, 0, 0);

const GregorianCalendar = ({ viewYear, viewMonth, onViewChange, locale, ...panelProps }) => {
    const days = useMemo(() => {
        const dayCount = getDaysInMonth(atNoon(viewYear, viewMonth, 1));
        return Array.from({ length: dayCount }, (_, i) => ({
            day: i + 1,
            date: atNoon(viewYear, viewMonth, i + 1),
        }));
    }, [viewYear, viewMonth]);

    const monthName = format(atNoon(viewYear, viewMonth, 1), 'LLLL', {
        locale: resolveDateFnsLocale(locale),
    });

    const shiftMonth = (delta) => {
        let month = viewMonth + delta;
        let year = viewYear;
        if (month < 1) {
            month += 12;
            year -= 1;
        } else if (month > 12) {
            month -= 12;
            year += 1;
        }
        onViewChange({ year, month });
    };

    return (
        <CalendarPanel
            {...panelProps}
            locale={locale}
            title={`${monthName} (${viewMonth}) ${viewYear}`}
            days={days}
            onShiftMonth={shiftMonth}
            onShiftYear={(delta) => onViewChange({ year: viewYear + delta, month: viewMonth })}
        />
    );
};

export default GregorianCalendar;
