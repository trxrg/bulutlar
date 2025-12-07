import React, { useContext } from 'react';
import { Typography } from '@mui/material';
import { FormControl, InputLabel, Select, MenuItem, Switch, FormControlLabel } from '@mui/material';
import { AppContext } from '../../store/app-context';

const EditorSettings = () => {
    const { translate: t, editorSettings, setEditorSettings } = useContext(AppContext);

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

    const autosaveIntervalOptions = [
        { value: 15, label: '15' },
        { value: 30, label: '30' },
        { value: 60, label: '60' },
        { value: 120, label: '120' },
        { value: 300, label: '300' },
    ];

    const handleEditorSettingChange = (setting, value) => {
        setEditorSettings({
            ...editorSettings,
            [setting]: value
        });
    };

    return (
        <div className='flex flex-col gap-5'>
            {/* Autosave Settings */}
            <div
                className='p-4 rounded-lg border'
                style={{
                    backgroundColor: 'var(--bg-primary)',
                    borderColor: 'var(--border-secondary)',
                }}
            >
                <Typography
                    variant='subtitle1'
                    sx={{
                        color: 'var(--text-primary)',
                        marginBottom: 2,
                        fontWeight: 600
                    }}
                >
                    {t('autosave')}
                </Typography>

                <FormControlLabel
                    control={
                        <Switch
                            checked={editorSettings?.autosaveEnabled || false}
                            onChange={(e) => handleEditorSettingChange('autosaveEnabled', e.target.checked)}
                            sx={{
                                '& .MuiSwitch-switchBase.Mui-checked': {
                                    color: '#059669',
                                },
                                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                    backgroundColor: '#059669',
                                },
                            }}
                        />
                    }
                    label={t('autosaveEnabled')}
                    sx={{ color: 'var(--text-primary)', marginBottom: 2 }}
                />

                {editorSettings?.autosaveEnabled && (
                    <FormControl variant="outlined" fullWidth>
                        <InputLabel sx={{ color: 'var(--text-primary)' }}>{t('autosaveInterval')}</InputLabel>
                        <Select
                            value={editorSettings?.autosaveInterval || 30}
                            onChange={(e) => handleEditorSettingChange('autosaveInterval', e.target.value)}
                            label={t('autosaveInterval')}
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
                            {autosaveIntervalOptions.map(option => (
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
                                    {option.label} {t('seconds')}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                )}
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
                    className={`${editorSettings?.fontSize || 'text-3xl'} ${editorSettings?.lineHeight === 'tight' ? 'leading-tight' :
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
        </div>
    );
};

export default EditorSettings;
