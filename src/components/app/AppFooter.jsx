import { useContext, useEffect, useState } from 'react';
import { AppContext } from '../../store/app-context';
import {
    formatGregorianDate,
    formatGregorianWeekday,
    formatHijriDate,
} from '../../utils/formatFooterDateTime.js';
import FooterDateCalendar from './FooterDateCalendar.jsx';
import FooterHijriCalendar from './FooterHijriCalendar.jsx';

const FooterDivider = () => <span className="opacity-40">|</span>;

const dateTriggerStyle = {
    background: 'none',
    border: 'none',
    padding: 0,
    margin: 0,
    color: 'inherit',
    font: 'inherit',
    lineHeight: 'inherit',
    cursor: 'pointer',
};

const AppFooter = () => {
    const { translate: t, hijriDateEnabled } = useContext(AppContext);
    const [now, setNow] = useState(() => new Date());
    const [calendarOpen, setCalendarOpen] = useState(false);
    const [calendarMode, setCalendarMode] = useState(null);
    const [anchorRect, setAnchorRect] = useState(null);

    useEffect(() => {
        const syncNow = () => setNow(new Date());
        const id = setInterval(syncNow, 60_000);
        return () => clearInterval(id);
    }, []);

    const localeKey = t('locale');
    const gregorian = formatGregorianDate(now, localeKey);
    const weekday = formatGregorianWeekday(now, localeKey);
    const hijri = hijriDateEnabled ? formatHijriDate(now, t) : null;

    const openCalendar = (mode, event) => {
        setCalendarMode(mode);
        setAnchorRect(event.currentTarget.getBoundingClientRect());
        setCalendarOpen(true);
    };

    const closeCalendar = () => {
        setCalendarOpen(false);
        setCalendarMode(null);
        setAnchorRect(null);
    };

    useEffect(() => {
        if (!hijriDateEnabled && calendarMode === 'hijri') {
            closeCalendar();
        }
    }, [hijriDateEnabled, calendarMode]);

    return (
        <>
            <div
                className="app-footer flex flex-shrink-0 flex-nowrap items-center gap-x-2 px-2 w-full text-xs leading-none overflow-hidden"
                style={{
                    height: '22px',
                    borderTop: '1px solid var(--border-primary)',
                    backgroundColor: 'var(--bg-footer)',
                    color: 'var(--text-footer)',
                }}
            >
                <button
                    type="button"
                    className="footer-date-trigger hover:underline"
                    style={dateTriggerStyle}
                    onClick={(e) => openCalendar('gregorian', e)}
                    aria-label={t('gregorian date')}
                    aria-expanded={calendarOpen && calendarMode === 'gregorian'}
                >
                    {gregorian}
                </button>
                <FooterDivider />
                <span>{weekday}</span>
                {hijriDateEnabled && (
                    <>
                        <FooterDivider />
                        <button
                            type="button"
                            className="footer-date-trigger hover:underline"
                            style={dateTriggerStyle}
                            onClick={(e) => openCalendar('hijri', e)}
                            aria-label={t('hijri date')}
                            aria-expanded={calendarOpen && calendarMode === 'hijri'}
                        >
                            {hijri}
                        </button>
                    </>
                )}
                <div className="footer-extras flex-1 flex justify-end items-center gap-2 min-w-0" />
            </div>
            {calendarMode === 'gregorian' && (
                <FooterDateCalendar
                    open={calendarOpen}
                    anchorRect={anchorRect}
                    today={now}
                    onClose={closeCalendar}
                    locale={localeKey}
                />
            )}
            {hijriDateEnabled && calendarMode === 'hijri' && (
                <FooterHijriCalendar
                    open={calendarOpen}
                    anchorRect={anchorRect}
                    today={now}
                    onClose={closeCalendar}
                    locale={localeKey}
                    t={t}
                />
            )}
        </>
    );
};

export default AppFooter;
