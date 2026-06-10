import React, { useContext, useState, useEffect } from 'react';
import { FormControl, InputLabel, Select, MenuItem, TextField, Button, CircularProgress, Switch, FormControlLabel, Typography } from '@mui/material';
import { AppContext } from '../../store/app-context';
import { DBContext } from '../../store/db-context';
import { articleApi } from '../../backend-adapter/BackendAdapter';
import toastr from 'toastr';
import ColorThemePicker from './ColorThemePicker';

const GeneralSettings = () => {
    const {
        translate: t,
        changeLanguage,
        getLanguage,
        wordsPerMinute,
        setWordsPerMinute,
        hijriDateEnabled,
        setHijriDateEnabled,
    } = useContext(AppContext);
    const { fetchAllData } = useContext(DBContext);
    const language = getLanguage();
    const [wpmInput, setWpmInput] = useState(wordsPerMinute?.toString() || '100');
    const [applying, setApplying] = useState(false);

    useEffect(() => {
        if (wordsPerMinute !== undefined && wordsPerMinute !== null) {
            setWpmInput(wordsPerMinute.toString());
        }
    }, [wordsPerMinute]);

    const handleWpmChange = (e) => {
        setWpmInput(e.target.value);
    };

    const handleApplyWpm = async () => {
        const num = parseInt(wpmInput, 10);
        if (!num || num <= 0 || !Number.isFinite(num)) {
            setWpmInput(wordsPerMinute?.toString() || '100');
            return;
        }

        setApplying(true);
        try {
            setWordsPerMinute(num);
            // Small delay to ensure the store is written before backend reads it
            await new Promise(resolve => setTimeout(resolve, 100));
            await articleApi.recalculateAllReadTimes();
            await fetchAllData();
            toastr.success(t('read times recalculated'));
        } catch (err) {
            console.error('Error recalculating read times', err);
            toastr.error(t('error recalculating read times'));
        } finally {
            setApplying(false);
        }
    };

    const textFieldSx = {
        '& .MuiOutlinedInput-root': {
            color: 'var(--text-primary)',
            backgroundColor: 'var(--bg-primary)',
            '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'var(--border-secondary)',
            },
        },
        '& .MuiInputLabel-root': {
            color: 'var(--text-primary)',
        },
    };

    const wpmChanged = parseInt(wpmInput, 10) !== wordsPerMinute;

    const accentSwitchSx = {
        '& .MuiSwitch-switchBase.Mui-checked': {
            color: 'var(--accent-primary)',
        },
        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
            backgroundColor: 'var(--accent-primary)',
        },
    };

    const accentButtonSx = {
        fontWeight: '600',
        backgroundColor: 'var(--accent-primary)',
        color: '#f9fafb',
        '&:hover': { backgroundColor: 'var(--accent-primary-hover)' },
        '&.Mui-disabled': {
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--text-secondary)',
        },
    };

    return (
        <div className='flex flex-col gap-5'>
            <ColorThemePicker t={t} />

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

            <FormControlLabel
                control={
                    <Switch
                        checked={hijriDateEnabled}
                        onChange={(e) => setHijriDateEnabled(e.target.checked)}
                        sx={accentSwitchSx}
                    />
                }
                label={t('show hijri date')}
                sx={{ color: 'var(--text-primary)', alignItems: 'flex-start', m: 0 }}
            />
            <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mt: -2, mb: 1, ml: 4.5 }}>
                {t('show hijri date description')}
            </Typography>

            <div className='flex flex-row items-start gap-3'>
                <TextField
                    label={t('words per minute')}
                    type="number"
                    value={wpmInput}
                    onChange={handleWpmChange}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleApplyWpm(); }}
                    inputProps={{ min: 1 }}
                    variant="outlined"
                    sx={{ ...textFieldSx, flex: 1 }}
                    helperText={t('words per minute description')}
                    FormHelperTextProps={{ sx: { color: 'var(--text-secondary)' } }}
                />
                <Button
                    variant="contained"
                    onClick={handleApplyWpm}
                    disabled={applying || !wpmChanged}
                    sx={{ mt: '8px', height: '56px', ...accentButtonSx }}
                >
                    {applying ? <CircularProgress size={24} sx={{ color: '#f9fafb' }} /> : t('apply')}
                </Button>
            </div>
        </div>
    );
};

export default GeneralSettings;
