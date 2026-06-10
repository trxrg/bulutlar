import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Button, Typography, Box } from '@mui/material';
import ShareIcon from '@mui/icons-material/Share';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { AppContext } from '../../store/app-context';
import { useSharingAdmin } from '../../contexts/SharingAdminContext';
import useBundleImport from '../../hooks/useBundleImport';
import SharingModal from './SharingModal';

const SharingSettings = () => {
    const { translate: t, getLanguage } = useContext(AppContext);
    const { enabled: adminModeEnabled } = useSharingAdmin();
    const { requestImport, importing, confirmModal, resultModal } = useBundleImport();

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
        const locale = getLanguage() === 'tr' ? 'tr-TR' : 'en-US';
        return `${t('last exported')}: ${d.toLocaleString(locale)}`;
    };

    const buttonSx = {
        fontWeight: 600,
        backgroundColor: 'var(--border-primary)',
        color: '#f9fafb',
        '&:hover': { backgroundColor: 'var(--accent-primary-hover)' },
    };

    return (
        <div className='flex flex-col gap-4'>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Export stays admin-gated; import is available to anyone. */}
                {adminModeEnabled && (
                    <>
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
                    </>
                )}
                <Button
                    variant='contained'
                    startIcon={<FileDownloadIcon />}
                    onClick={() => requestImport()}
                    disabled={importing}
                    sx={{ ...buttonSx, alignSelf: 'flex-start' }}
                >
                    {t('import bundle')}
                </Button>
            </Box>

            {confirmModal}
            {resultModal}

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
