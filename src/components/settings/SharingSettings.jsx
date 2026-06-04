import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Button, Typography, Box } from '@mui/material';
import ShareIcon from '@mui/icons-material/Share';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import toastr from 'toastr';
import { AppContext } from '../../store/app-context';
import { DBContext } from '../../store/db-context';
import LoadingToastr from '../common/LoadingToastr';
import SharingModal from './SharingModal';

const SharingSettings = () => {
    const { translate: t, getLanguage, resetTabs } = useContext(AppContext);
    const { fetchAllData } = useContext(DBContext);

    const [modalOpen, setModalOpen] = useState(false);
    const [lastExport, setLastExport] = useState(null);
    const [importing, setImporting] = useState(false);

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

    const handleImportBundle = useCallback(async () => {
        if (importing) return;
        setImporting(true);
        const loader = LoadingToastr.show(t('importing') + '...', LoadingToastr.colors.blue);
        try {
            const summary = await window.api.sharing.importBundle();
            if (!summary) return; // user cancelled the file picker
            await fetchAllData();
            resetTabs();
            if (summary.alreadyApplied) {
                toastr.info(t('bundle already imported'));
            } else {
                const count = summary.articleCount;
                toastr.success(t('bundle imported') + (count ? ` (${count})` : ''));
            }
        } catch (err) {
            console.error('Error importing bundle:', err);
            toastr.error(t('bundle import error') + (err?.message ? `: ${err.message}` : ''));
        } finally {
            loader.hide();
            setImporting(false);
        }
    }, [importing, t, fetchAllData, resetTabs]);

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
                <Button
                    variant='contained'
                    startIcon={<FileDownloadIcon />}
                    onClick={handleImportBundle}
                    disabled={importing}
                    sx={{ ...buttonSx, alignSelf: 'flex-start' }}
                >
                    {t('import bundle')}
                </Button>
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
