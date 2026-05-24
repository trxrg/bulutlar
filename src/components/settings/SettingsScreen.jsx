import React, { useContext } from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Typography, AccordionDetails, AccordionSummary, Accordion } from '@mui/material';
import toastr from 'toastr';
import { AppContext } from '../../store/app-context';
import { useSharingAdmin } from '../../contexts/SharingAdminContext';
import AdminModeIndicator from './AdminModeIndicator';
import GeneralSettings from './GeneralSettings';
import EditorSettings from './EditorSettings';
import DatabaseSettings from './DatabaseSettings';
import UpdateSettings from './UpdateSettings';
import SharingSettings from './SharingSettings';

const SettingsScreenContent = () => {
    const { translate: t } = useContext(AppContext);
    const { enabled: adminModeEnabled, exitAdminMode } = useSharingAdmin();

    const handleExitAdminMode = async () => {
        await exitAdminMode();
        toastr.success(t('admin mode disabled'));
    };

    const accordionSx = {
        backgroundColor: 'var(--bg-secondary)',
        color: 'var(--text-primary)',
        '&:before': {
            display: 'none',
        }
    };

    const accordionSummarySx = {
        backgroundColor: 'var(--bg-secondary)',
        color: 'var(--text-primary)'
    };

    const accordionDetailsSx = {
        backgroundColor: 'var(--bg-secondary)'
    };

    return (
        <div
            className={`settings-screen w-full h-full overflow-y-auto${adminModeEnabled ? ' settings-screen--admin-mode' : ''}`}
            style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
        >
            <div className='max-w-6xl w-full mx-auto p-4'>
                {adminModeEnabled && (
                    <AdminModeIndicator onExit={handleExitAdminMode} t={t} />
                )}
                <Accordion sx={accordionSx}>
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon sx={{ color: 'var(--text-primary)' }} />}
                        sx={accordionSummarySx}
                    >
                        <Typography variant='h5' sx={{ color: 'var(--text-primary)' }}>{t('general')}</Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={accordionDetailsSx}>
                        <GeneralSettings />
                    </AccordionDetails>
                </Accordion>

                <Accordion sx={accordionSx}>
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon sx={{ color: 'var(--text-primary)' }} />}
                        sx={accordionSummarySx}
                    >
                        <Typography variant='h5' sx={{ color: 'var(--text-primary)' }}>{t('text editor settings')}</Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={accordionDetailsSx}>
                        <EditorSettings />
                    </AccordionDetails>
                </Accordion>

                <Accordion sx={accordionSx}>
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon sx={{ color: 'var(--text-primary)' }} />}
                        sx={accordionSummarySx}
                    >
                        <Typography variant='h5' sx={{ color: 'var(--text-primary)' }}>{t('database')}</Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={accordionDetailsSx}>
                        <DatabaseSettings />
                    </AccordionDetails>
                </Accordion>

                {adminModeEnabled && (
                    <Accordion sx={accordionSx} className='settings-accordion--sharing-admin'>
                        <AccordionSummary
                            expandIcon={<ExpandMoreIcon sx={{ color: 'var(--text-primary)' }} />}
                            sx={accordionSummarySx}
                        >
                            <Typography variant='h5' sx={{ color: 'var(--text-primary)' }}>
                                {t('sharing')}
                                <span className='settings-sharing-admin-mark' aria-hidden='true' />
                            </Typography>
                        </AccordionSummary>
                        <AccordionDetails sx={accordionDetailsSx}>
                            <SharingSettings />
                        </AccordionDetails>
                    </Accordion>
                )}

                <Accordion sx={accordionSx}>
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon sx={{ color: 'var(--text-primary)' }} />}
                        sx={accordionSummarySx}
                    >
                        <Typography variant='h5' sx={{ color: 'var(--text-primary)' }}>{t('updates')}</Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={accordionDetailsSx}>
                        <UpdateSettings />
                    </AccordionDetails>
                </Accordion>
            </div>
        </div>
    );
};

export default SettingsScreenContent;
