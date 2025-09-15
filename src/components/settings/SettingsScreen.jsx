import React, { useContext, useState, useEffect } from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { Button, Typography, AccordionDetails, AccordionSummary, Accordion } from '@mui/material';
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { AppContext } from '../../store/app-context';
import { DBContext } from '../../store/db-context';
import { dbApi } from '../../backend-adapter/BackendAdapter';
import toastr from 'toastr';

const SettingsScreen = () => {
    const { translate: t, resetTabs, changeLanguage, getLanguage } = useContext(AppContext);
    const { fetchAllData } = useContext(DBContext);
    const [backupDir, setBackupDir] = useState('');

    const language = getLanguage();

    // Button styling to match HomeScreen
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

    const dangerButtonProps = {
        variant: 'contained',
        sx: { 
            fontWeight: '600', 
            fontSize: '1rem',
            backgroundColor: '#B53A16',
            color: '#f9fafb',
            '&:hover': {
                backgroundColor: '#991b1b'
            }
        }
    };

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
    }

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
    }

    return (
        <div className='max-w-6xl w-full min-h-screen p-4' style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
            <Accordion defaultExpanded sx={{ 
                backgroundColor: 'var(--bg-secondary)', 
                color: 'var(--text-primary)',
                '&:before': {
                    display: 'none',
                }
            }}>
                <AccordionSummary 
                    expandIcon={<ExpandMoreIcon sx={{ color: 'var(--text-primary)' }} />}
                    sx={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                >
                    <Typography variant='h5' sx={{ color: 'var(--text-primary)' }}>{t('general')}</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ backgroundColor: 'var(--bg-secondary)' }}>
                    <div className='flex flex-col gap-5'>
                        <FormControl variant="outlined" fullWidth>
                            <InputLabel sx={{ color: 'var(--text-primary)' }}>{t('language')}</InputLabel>
                            <Select
                                value={language}
                                onChange={changeLanguage}
                                label={t('language')}
                                MenuProps={{
                                    PaperProps: {
                                        sx: {
                                            backgroundColor: 'var(--bg-primary)',
                                            color: 'var(--text-primary)',
                                        }
                                    }
                                }}
                                sx={{
                                    color: 'var(--text-primary)',
                                    '.MuiOutlinedInput-notchedOutline': {
                                        borderColor: 'var(--border-secondary)',
                                    },
                                    '.MuiSvgIcon-root': {
                                        color: 'var(--text-primary)',
                                    },
                                    backgroundColor: 'var(--bg-primary)',
                                }}
                            >
                                <MenuItem 
                                    value="en" 
                                    sx={{ 
                                        color: 'var(--text-primary)', 
                                        backgroundColor: 'var(--bg-primary)',
                                        '&:hover': {
                                            backgroundColor: 'var(--bg-secondary)',
                                        }
                                    }}
                                >
                                    {t('english')}
                                </MenuItem>
                                <MenuItem 
                                    value="tr" 
                                    sx={{ 
                                        color: 'var(--text-primary)', 
                                        backgroundColor: 'var(--bg-primary)',
                                        '&:hover': {
                                            backgroundColor: 'var(--bg-secondary)',
                                        }
                                    }}
                                >
                                    {t('turkish')}
                                </MenuItem>
                            </Select>
                        </FormControl>
                    </div>
                </AccordionDetails>
            </Accordion>
            <Accordion defaultExpanded sx={{ 
                backgroundColor: 'var(--bg-secondary)', 
                color: 'var(--text-primary)',
                '&:before': {
                    display: 'none',
                }
            }}>
                <AccordionSummary 
                    expandIcon={<ExpandMoreIcon sx={{ color: 'var(--text-primary)' }} />}
                    sx={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                >
                    <Typography variant='h5' sx={{ color: 'var(--text-primary)' }}>{t('database')}</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ backgroundColor: 'var(--bg-secondary)' }}>
                    <div className='flex flex-row gap-3'>
                        <div className='flex flex-col gap-3 w-fit'>
                            <Button startIcon={<FileUploadIcon />} {...secondaryButtonProps} onClick={handleBackupDb}>
                                {t('backup')}
                            </Button>
                            <Button startIcon={<FileUploadIcon />} {...primaryButtonProps} onClick={handleExportDb}>
                                {t('export')}
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
                </AccordionDetails>
            </Accordion>
        </div>
    );
};

export default SettingsScreen;