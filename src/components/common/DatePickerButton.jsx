import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { gregorianToHijri } from '../../utils/hijriDate.js';
import CalendarIconButton from './CalendarIconButton.jsx';
import GregorianCalendar from './GregorianCalendar.jsx';
import HijriCalendar from './HijriCalendar.jsx';

const CALENDAR_WIDTH_PX = 282;
const CALENDAR_HEIGHT_PX = 320;
const VIEWPORT_MARGIN_PX = 8;

const todayParts = (isHijri) => {
    const today = new Date();
    return isHijri
        ? gregorianToHijri(today)
        : { day: today.getDate(), month: today.getMonth() + 1, year: today.getFullYear() };
};

/**
 * Calendar button whose popover renders in a portal, so it is never clipped by
 * a scrolling ancestor. Selection is reported as {day, month, year} strings in
 * the calendar's own system (Hijri parts when isHijri).
 */
const DatePickerButton = ({ value, onSelect, label, locale, t, isHijri = false }) => {
    const today = todayParts(isHijri);
    const buttonRef = useRef(null);
    const [anchorRect, setAnchorRect] = useState(null);
    const [view, setView] = useState({ year: today.year, month: today.month });

    const open = anchorRect !== null;

    useEffect(() => {
        if (!open) return;
        const onKeyDown = (e) => {
            if (e.key === 'Escape') setAnchorRect(null);
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [open]);

    const handleOpen = () => {
        setView({
            year: Number(value.year) || today.year,
            month: Number(value.month) || today.month,
        });
        setAnchorRect(buttonRef.current.getBoundingClientRect());
    };

    const handleSelectDay = (day) => {
        onSelect({
            day: String(day),
            month: String(view.month),
            year: String(view.year),
        });
        setAnchorRect(null);
    };

    const isViewingMonthOf = (parts) =>
        Number(parts.year) === view.year && Number(parts.month) === view.month;

    const renderPopover = () => {
        const fitsBelow =
            window.innerHeight - anchorRect.bottom >= CALENDAR_HEIGHT_PX + VIEWPORT_MARGIN_PX;
        const style = {
            position: 'fixed',
            top: fitsBelow
                ? anchorRect.bottom + 4
                : Math.max(VIEWPORT_MARGIN_PX, anchorRect.top - CALENDAR_HEIGHT_PX - 4),
            left: Math.min(
                Math.max(VIEWPORT_MARGIN_PX, anchorRect.right - CALENDAR_WIDTH_PX),
                window.innerWidth - CALENDAR_WIDTH_PX - VIEWPORT_MARGIN_PX
            ),
            zIndex: 10000,
        };

        const Calendar = isHijri ? HijriCalendar : GregorianCalendar;

        return createPortal(
            <>
                <div
                    className="fixed inset-0"
                    style={{ zIndex: 9999 }}
                    onMouseDown={() => setAnchorRect(null)}
                    aria-hidden="true"
                />
                <div
                    style={style}
                    onMouseDown={(e) => e.stopPropagation()}
                    role="dialog"
                    aria-modal="true"
                    aria-label={label}
                >
                    <Calendar
                        viewYear={view.year}
                        viewMonth={view.month}
                        onViewChange={setView}
                        onSelectDay={handleSelectDay}
                        selectedDay={value.day !== '' && isViewingMonthOf(value) ? Number(value.day) : null}
                        todayDay={isViewingMonthOf(today) ? today.day : null}
                        locale={locale}
                        t={t}
                        selectable
                        showYearNav
                    />
                </div>
            </>,
            document.body
        );
    };

    return (
        <>
            <CalendarIconButton ref={buttonRef} onClick={handleOpen} label={label} />
            {open && renderPopover()}
        </>
    );
};

export default DatePickerButton;
