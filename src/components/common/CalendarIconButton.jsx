import React, { forwardRef } from 'react';
import { CalendarDaysIcon } from '@heroicons/react/24/outline';

const CalendarIconButton = forwardRef(({ onClick, label }, ref) => (
    <button
        ref={ref}
        type="button"
        onClick={onClick}
        className="flex items-center justify-center rounded p-1.5 transition-opacity hover:opacity-80"
        style={{
            border: '1px solid var(--border-secondary)',
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--text-primary)',
        }}
        title={label}
        aria-label={label}
    >
        <CalendarDaysIcon className="h-5 w-5" />
    </button>
));

CalendarIconButton.displayName = 'CalendarIconButton';

export default CalendarIconButton;
