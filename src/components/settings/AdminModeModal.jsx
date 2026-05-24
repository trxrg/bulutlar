import React, { useState } from 'react';
import { Button, TextField, Typography } from '@mui/material';
import GeneralModal from '../common/GeneralModal';

const AdminModeModal = ({ isOpen, onRequestClose, onEnable, t }) => {
    const [passphrase, setPassphrase] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleClose = () => {
        setPassphrase('');
        onRequestClose();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!passphrase || submitting) return;
        setSubmitting(true);
        try {
            await onEnable(passphrase);
        } finally {
            setSubmitting(false);
            setPassphrase('');
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

    return (
        <GeneralModal
            isOpen={isOpen}
            onRequestClose={handleClose}
            title={t('admin mode')}
            style={{ maxHeight: '40%', minWidth: '24rem' }}
        >
            <form className='flex flex-col gap-4' onSubmit={handleSubmit}>
                <Typography sx={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    {t('admin mode description')}
                </Typography>
                <TextField
                    type='password'
                    label={t('admin mode passphrase')}
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    autoFocus
                    fullWidth
                    sx={textFieldSx}
                />
                <div className='flex justify-end gap-2'>
                    <Button variant='outlined' onClick={handleClose} sx={{ color: 'var(--text-primary)' }}>
                        {t('cancel')}
                    </Button>
                    <Button
                        type='submit'
                        variant='contained'
                        disabled={!passphrase || submitting}
                        sx={{
                            backgroundColor: 'var(--admin-accent, var(--border-primary))',
                            color: '#fff',
                            '&:hover': {
                                backgroundColor: 'var(--admin-accent-hover, var(--accent-secondary))',
                            },
                        }}
                    >
                        {t('admin mode enable')}
                    </Button>
                </div>
            </form>
        </GeneralModal>
    );
};

export default AdminModeModal;
