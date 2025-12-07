import React, { useContext } from 'react';
import { AppContext } from '../../../../store/app-context';

const DateSectionHeader = React.memo(({ month, year, isSticky = false, centerPosition }) => {
    const { translate: t } = useContext(AppContext);

    const monthNames = [
        'month_january', 'month_february', 'month_march', 'month_april',
        'month_may', 'month_june', 'month_july', 'month_august',
        'month_september', 'month_october', 'month_november', 'month_december'
    ];

    const monthName = t(monthNames[month]);

    if (isSticky) {
        return (
            <div 
                className="fixed z-50 px-4 py-2 rounded-full shadow-lg transition-all duration-300"
                style={{
                    top: '190px',
                    left: centerPosition ? `${centerPosition}px` : '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-primary)',
                    boxShadow: '0 4px 12px var(--shadow)',
                    backdropFilter: 'blur(8px)',
                    fontSize: '0.9rem',
                    fontWeight: '500'
                }}
            >
                {monthName} {year}
            </div>
        );
    }

    return (
        <div 
            className="flex items-center gap-3 py-2 px-1"
            data-date-section={`${year}-${month}`}
        >
            <div 
                className="flex-grow h-px"
                style={{ backgroundColor: 'var(--border-secondary)' }}
            />
            <span 
                className="text-sm font-medium px-3 py-1 rounded-full"
                style={{
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-secondary)'
                }}
            >
                {monthName} {year}
            </span>
            <div 
                className="flex-grow h-px"
                style={{ backgroundColor: 'var(--border-secondary)' }}
            />
        </div>
    );
});

export default DateSectionHeader;
