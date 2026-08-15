import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { gregorianToHijri } from '../../utils/hijriDate.js';
import HijriCalendar from '../common/HijriCalendar.jsx';

const FOOTER_HEIGHT_PX = 22;

const FooterHijriCalendar = ({ open, anchorRect, today, onClose, locale, t }) => {
    const todayHijri = gregorianToHijri(today);
    const [view, setView] = useState({ year: todayHijri.year, month: todayHijri.month });

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
        setView({ year: h.year, month: h.month });
    }, [open, today]);

    if (!open || !anchorRect) return null;

    const style = {
        position: 'fixed',
        left: Math.max(8, anchorRect.left),
        bottom: FOOTER_HEIGHT_PX,
        zIndex: 10000,
    };

    const isViewingCurrentHijriMonth =
        todayHijri.year === view.year && todayHijri.month === view.month;

    return createPortal(
        <>
            <div
                className="fixed inset-0"
                style={{ zIndex: 9999 }}
                onMouseDown={onClose}
                aria-hidden="true"
            />
            <div
                style={style}
                onMouseDown={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label={t('hijri date')}
            >
                <HijriCalendar
                    viewYear={view.year}
                    viewMonth={view.month}
                    onViewChange={setView}
                    todayDay={isViewingCurrentHijriMonth ? todayHijri.day : null}
                    locale={locale}
                    t={t}
                />
            </div>
        </>,
        document.body
    );
};

export default FooterHijriCalendar;
