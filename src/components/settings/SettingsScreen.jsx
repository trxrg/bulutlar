import React, { useContext } from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { Button, Typography, AccordionDetails, AccordionSummary, Accordion } from '@mui/material';
import { AppContext } from '../../store/app-context';
import { dbApi } from '../../backend-adapter/BackendAdapter';
import toastr from 'toastr';

const SettingsScreen = () => {
    const { translate: t } = useContext(AppContext);

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
                    <div className='flex flex-col gap-3 w-fit'>
                        <Button variant="contained" color="primary" onClick={handleExportDb} startIcon={<FileUploadIcon />}>
                            {t('export')}
                        </Button>
                        <Button variant="contained" color="primary" startIcon={<FileDownloadIcon />}>
                            {t('import')}
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