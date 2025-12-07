import React, { useContext } from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Typography, AccordionDetails, AccordionSummary, Accordion } from '@mui/material';
import { AppContext } from '../../store/app-context';
import GeneralSettings from './GeneralSettings';
import EditorSettings from './EditorSettings';
import DatabaseSettings from './DatabaseSettings';

const SettingsScreen = () => {
    const { translate: t } = useContext(AppContext);

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
        <div className='w-full h-full overflow-y-auto' style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
            <div className='max-w-6xl w-full mx-auto p-4'>
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
            </div>
        </div>
    );
};

export default SettingsScreen;
