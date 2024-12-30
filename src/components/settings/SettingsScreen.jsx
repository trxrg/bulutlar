import React, { useContext, useRef } from 'react';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Button from '@mui/material/Button';
import { AppContext } from '../../store/app-context';
import { dbApi } from '../../backend-adapter/BackendAdapter';
import toastr from 'toastr';

const SettingsScreen = () => {
    const { translate: t } = useContext(AppContext);
    const fileInputRef = useRef(null);

    const handleExportDb = async (event) => {
        console.log('Exporting database...');
        try {
            const result = await dbApi.handleExport();
            if (result) {
                console.log('Database exported successfully to ', result);
                toastr.success(t('db exported to') + ' ' + result);
            }
        } catch (err) {
            console.error('Error exporting database', err);
            toastr.error(t('db export error'));
        }
    };

    return (
        <div className='max-w-6xl w-full'>
            <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>{t('database')}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <div className='flex-col'>
                        <Button variant="contained" color="primary" onClick={handleExportDb}>
                            {t('export')}
                        </Button>
                    </div>
                </AccordionDetails>
            </Accordion>
            <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>{t('appearance')}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Typography>
                        Manage your appearance settings here.
                    </Typography>
                </AccordionDetails>
            </Accordion>
            {/* Add more Accordion components for other settings categories */}
        </div>
    );
};

export default SettingsScreen;