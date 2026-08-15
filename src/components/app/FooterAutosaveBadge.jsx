import { useContext } from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { AppContext } from '../../store/app-context';

const FooterAutosaveBadge = () => {
    const { translate: t, editorSettings, editableTabIds, activeTabId } = useContext(AppContext);

    const show =
        editorSettings?.autosaveEnabled &&
        editableTabIds.includes(activeTabId);

    if (!show) return null;

    return (
        <span
            className="footer-autosave-badge"
            title={t('autosaveActive')}
            aria-label={t('autosaveActive')}
        >
            <ArrowPathIcon
                className="footer-autosave-badge__icon animate-spin"
                style={{ animationDuration: '3s' }}
            />
            <span className="footer-autosave-badge__label">{t('autosave')}</span>
        </span>
    );
};

export default FooterAutosaveBadge;
