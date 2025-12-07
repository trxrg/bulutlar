import React, { useContext } from 'react';
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { AppContext } from '../../store/app-context';

const GeneralSettings = () => {
    const { translate: t, changeLanguage, getLanguage } = useContext(AppContext);
    const language = getLanguage();

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
        </div>
    );
};

export default GeneralSettings;
