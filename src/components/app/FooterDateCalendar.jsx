import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import DatePicker from 'react-datepicker';
import { registerLocale } from 'react-datepicker';
import { enUS, tr } from 'date-fns/locale';

registerLocale('en-US', enUS);
registerLocale('tr', tr);

const FOOTER_HEIGHT_PX = 22;

const FooterDateCalendar = ({ open, anchorRect, today, onClose, locale }) => {
    useEffect(() => {
        if (!open) return;
        const onKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [open, onClose]);

    if (!open || !anchorRect) return null;

    const style = {
        position: 'fixed',
        left: Math.max(8, anchorRect.left),
        bottom: FOOTER_HEIGHT_PX,
        zIndex: 10000,
    };

    return createPortal(
        <>
            <div
                className="fixed inset-0"
                style={{ zIndex: 9999 }}
                onMouseDown={onClose}
                aria-hidden="true"
            />
            <div
                className="footer-date-calendar footer-date-calendar--view-only rounded shadow-lg"
                style={style}
                onMouseDown={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                <DatePicker
                    inline
                    selected={today}
                    onChange={() => {}}
                    locale={locale}
                    dateFormatCalendar="MMMM (M) yyyy"
                    disabledKeyboardNavigation={false}
                />
            </div>
        </>,
        document.body
    );
};

export default FooterDateCalendar;
