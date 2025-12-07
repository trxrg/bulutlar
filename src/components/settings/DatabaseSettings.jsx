import React, { useContext, useState, useEffect } from 'react';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { Button, Typography } from '@mui/material';
import { AppContext } from '../../store/app-context';
import { DBContext } from '../../store/db-context';
import { dbApi } from '../../backend-adapter/BackendAdapter';
import toastr from 'toastr';
import AdvancedExportDialog from './AdvancedExportDialog';

const DatabaseSettings = () => {
    const { translate: t, resetTabs } = useContext(AppContext);
    const { fetchAllData } = useContext(DBContext);
    const [backupDir, setBackupDir] = useState('');
    const [showAdvancedExport, setShowAdvancedExport] = useState(false);

    // Button styling
    const primaryButtonProps = {
        variant: 'contained',
        sx: {
            fontWeight: '600',
            fontSize: '1rem',
            backgroundColor: '#059669',
            color: '#f9fafb',
            '&:hover': {
                backgroundColor: '#047857',
            }
        }
    };

    const secondaryButtonProps = {
        variant: 'contained',
        sx: {
            fontWeight: '600',
            fontSize: '1rem',
            backgroundColor: 'var(--border-primary)',
            color: '#f9fafb',
            '&:hover': {
                backgroundColor: '#2f4f0bff',
            }
        }
    };

    useEffect(() => {
        const fetchBackupDir = async () => {
            try {
                setBackupDir(await dbApi.getBackupDir());
            } catch (err) {
                console.error('Error fetching backup directory', err);
            }
        };

        fetchBackupDir();
    }, []);

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
                await fetchAllData();
                resetTabs();
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
    };

    const handleChangeBackupDir = async () => {
        console.log('Changing backup directory...');
        try {
            const result = await dbApi.changeBackupDir();
            if (result) {
                setBackupDir(result);
                console.log('Backup directory changed successfully to ', result);
                toastr.success(t('backup dir changed to') + ' ' + result);
            }
        } catch (err) {
            console.error('Error changing backup directory', err);
            toastr.error(t('backup dir change error'));
        }
    };

    const handleAdvancedExport = async (options) => {
        console.log('Advanced exporting database with options:', options);
        try {
            const result = await dbApi.handleAdvancedExport(options);
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
        <>
            <div className='flex flex-row gap-3'>
                <div className='flex flex-col gap-3 w-fit'>
                    <Button startIcon={<FileUploadIcon />} {...secondaryButtonProps} onClick={handleBackupDb}>
                        {t('backup')}
                    </Button>
                    <Button startIcon={<FileUploadIcon />} {...primaryButtonProps} onClick={handleExportDb}>
                        {t('export all')}
                    </Button>
                    <Button startIcon={<FileUploadIcon />} {...primaryButtonProps} onClick={() => setShowAdvancedExport(true)}>
                        {t('export selected')}
                    </Button>
                    <Button startIcon={<FileDownloadIcon />} {...primaryButtonProps} onClick={handleImportDb}>
                        {t('import')}
                    </Button>
                </div>
                <div className='h-fit flex flex-row'>
                    <Typography variant="body1" className='p-1' sx={{ color: 'var(--text-primary)' }}>{t('backup folder')}: </Typography>
                    <Typography variant="body2" onClick={handleChangeBackupDir}
                        className='border-4 border-blue-500 rounded-lg p-1 cursor-pointer'
                        sx={{ color: 'var(--text-primary)' }}>
                        {backupDir}
                    </Typography>
                </div>
            </div>

            <AdvancedExportDialog
                isOpen={showAdvancedExport}
                onClose={() => setShowAdvancedExport(false)}
                onExport={handleAdvancedExport}
            />
        </>
    );
};

export default DatabaseSettings;
