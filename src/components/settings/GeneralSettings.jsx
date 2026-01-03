import React, { useContext, useState, useEffect, useMemo } from 'react';
import { FormControl, InputLabel, Select, MenuItem, Typography } from '@mui/material';
import { AppContext } from '../../store/app-context';

const GeneralSettings = () => {
    const { translate: t, changeLanguage, getLanguage, ttsSettings, setTtsSettings } = useContext(AppContext);
    const language = getLanguage();
    const [availableVoices, setAvailableVoices] = useState([]);

    useEffect(() => {
        const updateVoices = () => {
            const voices = window.speechSynthesis.getVoices();
            setAvailableVoices(voices);
        };

        updateVoices();

        if (window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = updateVoices;
        }
    }, []);

    const filteredVoices = useMemo(() => {
        if (!availableVoices.length) return [];

        let targetLang = ttsSettings?.language;
        if (targetLang === 'app') targetLang = language;

        let langPrefix = 'en'; // default
        if (targetLang && targetLang.startsWith('tr')) langPrefix = 'tr';
        else if (targetLang && targetLang.startsWith('en')) langPrefix = 'en';

        // Also handle cases where language might be full locale like 'tr-TR'
        if (targetLang === 'app' && language.startsWith('tr')) langPrefix = 'tr';

        return availableVoices.filter(v => v.lang.startsWith(langPrefix));
    }, [availableVoices, ttsSettings?.language, language]);

    const handleTtsLanguageChange = (e) => {
        setTtsSettings({ ...ttsSettings, language: e.target.value, voiceURI: 'auto' });
    };

    const handleTtsVoiceChange = (e) => {
        setTtsSettings({ ...ttsSettings, voiceURI: e.target.value });
    }

    return (
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

            <FormControl variant="outlined" fullWidth>
                <InputLabel sx={{ color: 'var(--text-primary)' }}>{t('tts language')}</InputLabel>
                <Select
                    value={ttsSettings?.language || 'app'}
                    onChange={handleTtsLanguageChange}
                    label={t('tts language')}
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
                        value="app"
                        sx={{
                            color: 'var(--text-primary)',
                            backgroundColor: 'var(--bg-primary)',
                            '&:hover': {
                                backgroundColor: 'var(--bg-secondary)',
                            }
                        }}
                    >
                        {t('app language')}
                    </MenuItem>
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

            <FormControl variant="outlined" fullWidth>
                <InputLabel sx={{ color: 'var(--text-primary)' }}>{t('tts voice')}</InputLabel>
                <Select
                    value={ttsSettings?.voiceURI || 'auto'}
                    onChange={handleTtsVoiceChange}
                    label={t('tts voice')}
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
                        value="auto"
                        sx={{
                            color: 'var(--text-primary)',
                            backgroundColor: 'var(--bg-primary)',
                            '&:hover': {
                                backgroundColor: 'var(--bg-secondary)',
                            }
                        }}
                    >
                        {t('auto best quality')}
                    </MenuItem>
                    {filteredVoices.map(voice => (
                        <MenuItem
                            key={voice.voiceURI}
                            value={voice.voiceURI}
                            sx={{
                                color: 'var(--text-primary)',
                                backgroundColor: 'var(--bg-primary)',
                                '&:hover': {
                                    backgroundColor: 'var(--bg-secondary)',
                                }
                            }}
                        >
                            {voice.name} {voice.localService ? '(Offline)' : '(Online)'}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        </div>
    );
};

export default GeneralSettings;
