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
import AdvancedExportDialog from './AdvancedExportDialog';

const SettingsScreen = () => {
    const { translate: t, resetTabs, changeLanguage, getLanguage, editorSettings, setEditorSettings } = useContext(AppContext);
    const { fetchAllData } = useContext(DBContext);
    const [backupDir, setBackupDir] = useState('');
    const [showAdvancedExport, setShowAdvancedExport] = useState(false);

    const language = getLanguage();

    // Font options - clean, modern, and readable fonts
    const fontOptions = [
        { value: 'system-ui', label: 'System UI' },
        // Modern Sans-Serif
        { value: '"Roboto", sans-serif', label: 'Roboto' },
        { value: '"Open Sans", sans-serif', label: 'Open Sans' },
        { value: '"Lato", sans-serif', label: 'Lato' },
        { value: '"Montserrat", sans-serif', label: 'Montserrat' },
        { value: '"Raleway", sans-serif', label: 'Raleway' },
        { value: '"Nunito", sans-serif', label: 'Nunito' },
        { value: '"Archivo", sans-serif', label: 'Archivo' },
        { value: '"Helvetica", sans-serif', label: 'Helvetica' },
        { value: '"Inter", sans-serif', label: 'Inter' },
        { value: '"Source Sans Pro", sans-serif', label: 'Source Sans Pro' },
        { value: '"Noto Sans", sans-serif', label: 'Noto Sans' },
        // Futuristic / Space Exploration
        { value: '"Exo 2", sans-serif', label: 'Exo 2' },
        { value: '"Audiowide", sans-serif', label: 'Audiowide' },
        { value: '"Electrolize", sans-serif', label: 'Electrolize' },
        { value: '"Saira", sans-serif', label: 'Saira' },
        // Classic Serif
        { value: '"Times New Roman", serif', label: 'Times New Roman' },
        { value: '"Georgia", serif', label: 'Georgia' },
        { value: '"Merriweather", serif', label: 'Merriweather' },
        { value: '"Playfair Display", serif', label: 'Playfair Display' },
        { value: '"Lora", serif', label: 'Lora' },
        { value: '"PT Serif", serif', label: 'PT Serif' },
        { value: '"Crimson Text", serif', label: 'Crimson Text' },
        { value: '"Libre Baskerville", serif', label: 'Libre Baskerville' },
        { value: '"EB Garamond", serif', label: 'EB Garamond' },
        { value: '"Bitter", serif', label: 'Bitter' },
        { value: '"Noto Serif", serif', label: 'Noto Serif' },
        // Vintage / Classical / Old Writing
        { value: '"Cinzel", serif', label: 'Cinzel' },
        { value: '"Cormorant Garamond", serif', label: 'Cormorant' },
        { value: '"Old Standard TT", serif', label: 'Old Standard' },
        { value: '"Spectral", serif', label: 'Spectral' },
        { value: '"Cardo", serif', label: 'Cardo' },
    ];

    const fontSizeOptions = [
        { value: 'text-xs', label: 'XS' },
        { value: 'text-sm', label: 'SM' },
        { value: 'text-base', label: 'Base' },
        { value: 'text-lg', label: 'LG' },
        { value: 'text-xl', label: 'XL' },
        { value: 'text-2xl', label: '2XL' },
        { value: 'text-3xl', label: '3XL' },
        { value: 'text-4xl', label: '4XL' },
        { value: 'text-5xl', label: '5XL' },
    ];

    const lineHeightOptions = [
        { value: 'tight', label: t('tight') },
        { value: 'normal', label: t('normal') },
        { value: 'relaxed', label: t('relaxed') },
        { value: 'loose', label: t('loose') },
        { value: 'very loose', label: t('very loose') },
    ];

    const handleEditorSettingChange = (setting, value) => {
        setEditorSettings({
            ...editorSettings,
            [setting]: value
        });
    };

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
        <div className='w-full h-full overflow-y-auto' style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
            <div className='max-w-6xl w-full mx-auto p-4'>
            <Accordion sx={{ 
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
            
            <Accordion sx={{ 
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
                    <Typography variant='h5' sx={{ color: 'var(--text-primary)' }}>{t('text editor settings')}</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ backgroundColor: 'var(--bg-secondary)' }}>
                    <div className='flex flex-col gap-5'>
                        {/* Sample Text Preview */}
                        <div 
                            className='p-6 rounded-lg border-2'
                            style={{ 
                                backgroundColor: 'var(--bg-primary)',
                                borderColor: 'var(--border-secondary)',
                            }}
                        >
                            <Typography 
                                variant='subtitle2' 
                                sx={{ 
                                    color: 'var(--text-secondary)', 
                                    marginBottom: 2,
                                    fontWeight: 600 
                                }}
                            >
                                {t('preview')}:
                            </Typography>
                            <div 
                                className={`${editorSettings?.fontSize || 'text-3xl'} ${
                                    editorSettings?.lineHeight === 'tight' ? 'leading-tight' :
                                    editorSettings?.lineHeight === 'normal' ? 'leading-normal' :
                                    editorSettings?.lineHeight === 'relaxed' ? 'leading-relaxed' :
                                    editorSettings?.lineHeight === 'very loose' ? 'leading-loose' :
                                    'leading-loose'
                                }`}
                                style={{ 
                                    fontFamily: editorSettings?.fontFamily || 'system-ui',
                                    color: 'var(--text-primary)'
                                }}
                            >
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.
                            </div>
                        </div>

                        <FormControl variant="outlined" fullWidth>
                            <InputLabel sx={{ color: 'var(--text-primary)' }}>{t('font family')}</InputLabel>
                            <Select
                                value={editorSettings?.fontFamily || 'system-ui'}
                                onChange={(e) => handleEditorSettingChange('fontFamily', e.target.value)}
                                label={t('font family')}
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
                                {fontOptions.map(option => (
                                    <MenuItem 
                                        key={option.value}
                                        value={option.value}
                                        sx={{ 
                                            color: 'var(--text-primary)', 
                                            backgroundColor: 'var(--bg-primary)',
                                            fontFamily: option.value,
                                            fontSize: '1.1rem',
                                            padding: '12px 16px',
                                            '&:hover': {
                                                backgroundColor: 'var(--bg-secondary)',
                                            }
                                        }}
                                    >
                                        <span style={{ fontFamily: option.value }}>
                                            {option.label}
                                        </span>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl variant="outlined" fullWidth>
                            <InputLabel sx={{ color: 'var(--text-primary)' }}>{t('font size')}</InputLabel>
                            <Select
                                value={editorSettings?.fontSize || 'text-3xl'}
                                onChange={(e) => handleEditorSettingChange('fontSize', e.target.value)}
                                label={t('font size')}
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
                                {fontSizeOptions.map(option => (
                                    <MenuItem 
                                        key={option.value}
                                        value={option.value}
                                        sx={{ 
                                            color: 'var(--text-primary)', 
                                            backgroundColor: 'var(--bg-primary)',
                                            '&:hover': {
                                                backgroundColor: 'var(--bg-secondary)',
                                            }
                                        }}
                                    >
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl variant="outlined" fullWidth>
                            <InputLabel sx={{ color: 'var(--text-primary)' }}>{t('line height')}</InputLabel>
                            <Select
                                value={editorSettings?.lineHeight || 'loose'}
                                onChange={(e) => handleEditorSettingChange('lineHeight', e.target.value)}
                                label={t('line height')}
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
                                {lineHeightOptions.map(option => (
                                    <MenuItem 
                                        key={option.value}
                                        value={option.value}
                                        sx={{ 
                                            color: 'var(--text-primary)', 
                                            backgroundColor: 'var(--bg-primary)',
                                            '&:hover': {
                                                backgroundColor: 'var(--bg-secondary)',
                                            }
                                        }}
                                    >
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </div>
                </AccordionDetails>
            </Accordion>

            <Accordion sx={{ 
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
                </AccordionDetails>
            </Accordion>
            
            <AdvancedExportDialog 
                isOpen={showAdvancedExport}
                onClose={() => setShowAdvancedExport(false)}
                onExport={handleAdvancedExport}
            />
            </div>
        </div>
    );
};

export default SettingsScreen;