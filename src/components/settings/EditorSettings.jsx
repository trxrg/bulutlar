import React, { useContext, useState } from 'react';
import { Typography, Button, CircularProgress } from '@mui/material';
import { FormControl, InputLabel, Select, MenuItem, Switch, FormControlLabel } from '@mui/material';
import { AppContext } from '../../store/app-context';
import { dbApi } from '../../backend-adapter/BackendAdapter';
import { FONT_OPTIONS } from '../../shared/fontCatalog.js';
import toastr from 'toastr';

const EditorSettings = () => {
    const { translate: t, editorSettings, setEditorSettings } = useContext(AppContext);
    const [isMigrating, setIsMigrating] = useState(false);

    const fontOptions = FONT_OPTIONS.map(({ label, value }) => ({ label, value }));

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
                                    color: 'var(--accent-primary)',
                                },
                                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                    backgroundColor: 'var(--accent-primary)',
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

            {/* Legacy Draft.js data migration */}
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
                    {t('migrate existing data to tiptap')}
                </Typography>

                <Button
                    variant="outlined"
                    disabled={isMigrating}
                    onClick={async () => {
                        setIsMigrating(true);
                        try {
                            const result = await dbApi.migrateDraftToTiptap();
                            const msg = `${result.convertedArticles} articles, ${result.convertedComments} comments converted.`;
                            if (result.errors.length > 0) {
                                toastr.warning(`${msg} ${result.errors.length} errors.`, t('migration completed with errors'));
                                console.warn('Migration errors:', result.errors);
                            } else {
                                toastr.success(msg, t('migration completed'));
                            }
                        } catch (e) {
                            toastr.error(e.message, t('migration failed'));
                        } finally {
                            setIsMigrating(false);
                        }
                    }}
                    sx={{
                        marginTop: 2,
                        color: 'var(--text-primary)',
                        borderColor: 'var(--border-secondary)',
                        '&:hover': { borderColor: 'var(--text-primary)' },
                    }}
                >
                    {isMigrating ? <CircularProgress size={20} sx={{ marginRight: 1 }} /> : null}
                    {isMigrating ? t('migrating...') : t('migrate existing data to tiptap')}
                </Button>
            </div>

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
