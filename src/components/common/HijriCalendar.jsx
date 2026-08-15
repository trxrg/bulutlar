import React, { useMemo } from 'react';
import {
    getDisplayHijriMonthDays,
    shiftDisplayHijriMonth,
} from '../../utils/hijriDate.js';
import CalendarPanel from './CalendarPanel.jsx';

const HIJRI_MONTH_KEYS = Array.from({ length: 12 }, (_, i) => `hijri_month_${i + 1}`);

const HijriCalendar = ({ viewYear, viewMonth, onViewChange, t, ...panelProps }) => {
    const days = useMemo(
        () => getDisplayHijriMonthDays(viewYear, viewMonth),
        [viewYear, viewMonth]
    );

    return (
        <CalendarPanel
            {...panelProps}
            title={`${t(HIJRI_MONTH_KEYS[viewMonth - 1])} (${viewMonth}) ${viewYear}`}
            days={days}
            onShiftMonth={(delta) => onViewChange(shiftDisplayHijriMonth(viewYear, viewMonth, delta))}
            onShiftYear={(delta) => onViewChange({ year: viewYear + delta, month: viewMonth })}
        />
    );
};

export default HijriCalendar;
