import React, { useContext, useState, useEffect } from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { Button, Typography, AccordionDetails, AccordionSummary, Accordion } from '@mui/material';
import { AppContext } from '../../store/app-context';
import { dbApi } from '../../backend-adapter/BackendAdapter';
import toastr from 'toastr';

const SettingsScreen = () => {
    const { translate: t } = useContext(AppContext);
    const [backupDir, setBackupDir] = useState('');

    useEffect(() => {
        const fetchBackupDir = async () => {
            try {                
                setBackupDir(await dbApi.getBackupDir());
                console.log('Fetched backup directory:', backupDir);
            } catch (err) {
                console.error('Error fetching backup directory', err);
            }
        };

        fetchBackupDir();
    }, []);

    console.log('backupDir:', backupDir);  

    const handleExportDb = async () => {
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

    const handleImportDb = async () => {
        console.log('Importing database...');
        try {
            const result = await dbApi.handleImport();
            if (result) {
                console.log('Database imported successfully from ', result);
                toastr.success(t('db imported from') + ' ' + result);
            }
        } catch (err) {
            console.error('Error importing database', err);
            toastr.error(t('db import error'));
        }
    };

    const handleBackupDb = async () => {
        console.log('Backing up database...');
        try {
            const result = await dbApi.handleBackup();
            if (result) {
                console.log('Database backed up successfully to ', result);
                toastr.success(t('db backed up to') + ' ' + result);
            }
        } catch (err) {
            console.error('Error backing up database', err);
            toastr.error(t('db backup error'));
        }
    }

    const handleChangeBackupDir = async () => {
        console.log('Changing backup directory...');
        try {
            const result = await dbApi.changeBackupDir();
            if (result) {
                console.log('Backup directory changed successfully to ', result);
                toastr.success(t('backup dir changed to') + ' ' + result);
                setBackupDir(result);
            }
        } catch (err) {
            console.error('Error changing backup directory', err);
            toastr.error(t('backup dir change error'));
        }
    }

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
                        <Button variant="contained" color="primary" onClick={handleImportDb} startIcon={<FileDownloadIcon />}>
                            {t('import')}
                        </Button>
                        <Button variant="contained" color="secondary" onClick={handleBackupDb} startIcon={<FileUploadIcon />}>
                            {t('backup')}
                        </Button>
                        <Typography variant="body2" onClick={handleChangeBackupDir}>
                            {backupDir}
                        </Typography>
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