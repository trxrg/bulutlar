import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

const AdminModeIndicator = ({ onExit, t }) => (
    <Box className='admin-mode-indicator' role='status' aria-live='polite'>
        <Box className='admin-mode-indicator__glow' aria-hidden='true' />
        <Box className='admin-mode-indicator__content'>
            <Box className='admin-mode-indicator__label'>
                <AdminPanelSettingsOutlinedIcon className='admin-mode-indicator__icon' fontSize='small' />
                <Typography component='span' className='admin-mode-indicator__text'>
                    {t('admin mode active')}
                </Typography>
                <span className='admin-mode-indicator__pulse' aria-hidden='true' />
            </Box>
            <Button
                size='small'
                variant='outlined'
                startIcon={<CloseRoundedIcon fontSize='small' />}
                onClick={onExit}
                className='admin-mode-indicator__exit'
            >
                {t('exit admin mode')}
            </Button>
        </Box>
    </Box>
);

export default AdminModeIndicator;
