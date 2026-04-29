import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Button, Typography, Box } from '@mui/material';
import ShareIcon from '@mui/icons-material/Share';
import { AppContext } from '../../store/app-context';
import SharingModal from './SharingModal';

const SharingSettings = () => {
    const { translate: t } = useContext(AppContext);

    const [modalOpen, setModalOpen] = useState(false);
    const [lastExport, setLastExport] = useState(null);

    const refreshLastExport = useCallback(async () => {
        try {
            const res = await window.api.sharing.getLastExport();
            setLastExport(res || null);
        } catch (err) {
            console.error('Failed to load last export:', err);
            setLastExport(null);
        }
    }, []);

    useEffect(() => { refreshLastExport(); }, [refreshLastExport]);

    const formatLastExport = () => {
        if (!lastExport) return t('no bundles yet');
        const d = new Date(lastExport.createdAt);
        return `${t('last exported')}: ${d.toLocaleString()}`;
    };

    const buttonSx = {
        fontWeight: 600,
        backgroundColor: 'var(--border-primary)',
        color: '#f9fafb',
        '&:hover': { backgroundColor: '#2f4f0bff' },
    };

    return (
        <div className='flex flex-col gap-4'>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                    variant='contained'
                    startIcon={<ShareIcon />}
                    onClick={() => setModalOpen(true)}
                    sx={{ ...buttonSx, alignSelf: 'flex-start' }}
                >
                    {t('generate update bundle')}
                </Button>
                <Typography sx={{ color: 'var(--text-secondary)' }}>
                    {formatLastExport()}
                </Typography>
            </Box>

            {modalOpen && (
                <SharingModal
                    isOpen={modalOpen}
                    onRequestClose={() => {
                        setModalOpen(false);
                        refreshLastExport();
                    }}
                />
            )}
        </div>
    );
};

export default SharingSettings;
