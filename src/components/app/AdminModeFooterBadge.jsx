import React from 'react';
import { useSharingAdmin } from '../../contexts/SharingAdminContext';

const AdminModeFooterBadge = ({ label }) => {
    const { enabled } = useSharingAdmin();

    if (!enabled) return null;

    return (
        <span className='admin-mode-footer-badge' title={label} aria-label={label}>
            <span className='admin-mode-footer-badge__dot' aria-hidden='true' />
            <span className='admin-mode-footer-badge__label'>{label}</span>
        </span>
    );
};

export default AdminModeFooterBadge;
