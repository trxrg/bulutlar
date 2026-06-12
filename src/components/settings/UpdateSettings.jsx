import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { Button, Typography, LinearProgress, Box, Alert } from '@mui/material';
import { AppContext } from '../../store/app-context';
import { useSharingAdmin } from '../../contexts/SharingAdminContext';
import RefreshIcon from '@mui/icons-material/Refresh';
import DownloadIcon from '@mui/icons-material/Download';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import toastr from 'toastr';
import AdminModeModal from './AdminModeModal';
import ReleaseNotesDisplay from './ReleaseNotesDisplay';

const ADMIN_TAP_COUNT = 7;
const ADMIN_TAP_RESET_MS = 2000;

const versionTriggerStyle = {
    background: 'none',
    border: 'none',
    padding: 0,
    margin: 0,
    color: 'inherit',
    font: 'inherit',
    lineHeight: 'inherit',
    cursor: 'default',
};

const UpdateSettings = () => {
    const { translate: t } = useContext(AppContext);
    const { unlock } = useSharingAdmin();

    const [status, setStatus] = useState('idle'); // idle, checking, available, not-available, downloading, downloaded, error
    const [currentVersion, setCurrentVersion] = useState('');
    const [newVersion, setNewVersion] = useState('');
    const [releaseNotes, setReleaseNotes] = useState('');
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [errorMessage, setErrorMessage] = useState('');
    const [unlockModalOpen, setUnlockModalOpen] = useState(false);

    const tapCountRef = useRef(0);
    const tapTimerRef = useRef(null);

    useEffect(() => {
        // Get current version on mount
        window.api.updater.getVersion().then(version => {
            setCurrentVersion(version);
        });

        // Set up event listeners
        window.api.updater.onChecking(() => {
            setStatus('checking');
        });

        window.api.updater.onAvailable((info) => {
            setStatus('available');
            setNewVersion(info.version);
            if (info.releaseNotes) {
                setReleaseNotes(info.releaseNotes);
            }
        });

        window.api.updater.onNotAvailable(() => {
            setStatus('not-available');
        });

        window.api.updater.onProgress((progress) => {
            setStatus('downloading');
            // electron-updater always reports percent as a 0-100 float.
            const percent = Math.min(100, Math.max(0, progress.percent ?? 0));
            setDownloadProgress(percent);
        });

        window.api.updater.onDownloaded((info) => {
            setStatus('downloaded');
            setNewVersion(info.version);
        });

        window.api.updater.onError((error) => {
            setStatus('error');
            setErrorMessage(error);
        });

        // Cleanup listeners on unmount
        return () => {
            window.api.updater.removeAllListeners();
            if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
        };
    }, []);

    const handleVersionClick = useCallback(() => {
        tapCountRef.current += 1;
        if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
        tapTimerRef.current = setTimeout(() => {
            tapCountRef.current = 0;
        }, ADMIN_TAP_RESET_MS);

        if (tapCountRef.current >= ADMIN_TAP_COUNT) {
            tapCountRef.current = 0;
            if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
            setUnlockModalOpen(true);
        }
    }, []);

    const handleEnableAdminMode = async (passphrase) => {
        const ok = await unlock(passphrase);
        if (ok) {
            toastr.success(t('admin mode enabled'));
            setUnlockModalOpen(false);
        } else {
            toastr.error(t('admin mode failed'));
        }
    };

    const handleCheckForUpdates = async () => {
        setStatus('checking');
        setErrorMessage('');
        setReleaseNotes('');

        try {
            const result = await window.api.updater.checkForUpdates();

            if (result.isDev) {
                setStatus('error');
                setErrorMessage(t('update check disabled in dev mode'));
                return;
            }

            if (result.updateAvailable) {
                setStatus('available');
                setNewVersion(result.newVersion);
                setReleaseNotes(result.releaseNotes || '');
            } else {
                setStatus('not-available');
            }
        } catch (error) {
            setStatus('error');
            setErrorMessage(error.message || t('error checking for updates'));
        }
    };

    const handleDownloadUpdate = async () => {
        setStatus('downloading');
        setDownloadProgress(0);

        try {
            await window.api.updater.downloadUpdate();
        } catch (error) {
            setStatus('error');
            setErrorMessage(error.message || t('error downloading update'));
        }
    };

    const handleInstallUpdate = () => {
        window.api.updater.installUpdate();
    };

    const buttonSx = {
        color: 'var(--text-primary)',
        borderColor: 'var(--border-secondary)',
        '&:hover': {
            borderColor: 'var(--text-primary)',
            backgroundColor: 'var(--bg-tertiary)',
        },
    };

    const renderContent = () => {
        switch (status) {
            case 'checking':
                return (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography sx={{ color: 'var(--text-secondary)' }}>
                            {t('checking for updates')}...
                        </Typography>
                        <LinearProgress sx={{ width: 100 }} />
                    </Box>
                );

            case 'available':
                return (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Alert severity="info" sx={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>
                            {t('new version available')}: <strong>{newVersion}</strong>
                        </Alert>
                        {releaseNotes && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                <Typography variant="body2" sx={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
                                    {t('whats new since your version')}
                                </Typography>
                                <ReleaseNotesDisplay notes={releaseNotes} />
                            </Box>
                        )}
                        <Button
                            variant="contained"
                            startIcon={<DownloadIcon />}
                            onClick={handleDownloadUpdate}
                            sx={{
                                backgroundColor: 'var(--accent-primary)',
                                color: '#fff',
                                '&:hover': {
                                    backgroundColor: 'var(--accent-secondary)',
                                },
                            }}
                        >
                            {t('download update')}
                        </Button>
                    </Box>
                );

            case 'not-available':
                return (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <CheckCircleIcon sx={{ color: 'var(--success-color, #4caf50)' }} />
                        <Typography sx={{ color: 'var(--text-primary)' }}>
                            {t('app is up to date')}
                        </Typography>
                    </Box>
                );

            case 'downloading':
                return (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
                        <Typography sx={{ color: 'var(--text-secondary)' }}>
                            {t('downloading update')}... {Math.round(downloadProgress)}%
                        </Typography>
                        <LinearProgress
                            variant="determinate"
                            value={downloadProgress}
                            color="primary"
                            sx={{
                                width: '100%',
                                height: 10,
                                borderRadius: 5,
                                backgroundColor: '#e0e0e0',
                                '& .MuiLinearProgress-bar': {
                                    backgroundColor: '#1976d2',
                                    borderRadius: 5,
                                }
                            }}
                        />
                    </Box>
                );

            case 'downloaded':
                return (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Alert severity="success" sx={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>
                            {t('update downloaded')} ({newVersion})
                        </Alert>
                        <Button
                            variant="contained"
                            startIcon={<RestartAltIcon />}
                            onClick={handleInstallUpdate}
                            sx={{
                                backgroundColor: 'var(--success-color, #4caf50)',
                                color: '#fff',
                                '&:hover': {
                                    backgroundColor: '#388e3c',
                                },
                            }}
                        >
                            {t('restart and install')}
                        </Button>
                    </Box>
                );

            case 'error':
                return (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Alert severity="error" sx={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>
                            {errorMessage || t('error checking for updates')}
                        </Alert>
                        <Button
                            variant="outlined"
                            startIcon={<RefreshIcon />}
                            onClick={handleCheckForUpdates}
                            sx={buttonSx}
                        >
                            {t('try again')}
                        </Button>
                    </Box>
                );

            default: // idle
                return (
                    <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={handleCheckForUpdates}
                        sx={buttonSx}
                    >
                        {t('check for updates')}
                    </Button>
                );
        }
    };

    return (
        <div className='flex flex-col gap-4'>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2, mb: 2 }}>
                <Typography sx={{ color: 'var(--text-secondary)' }}>
                    {t('current version')}:{' '}
                    <button
                        type='button'
                        onClick={handleVersionClick}
                        style={versionTriggerStyle}
                        aria-label={t('current version')}
                    >
                        <strong style={{ color: 'var(--text-primary)' }}>{currentVersion}</strong>
                    </button>
                </Typography>
            </Box>

            {renderContent()}

            <AdminModeModal
                isOpen={unlockModalOpen}
                onRequestClose={() => setUnlockModalOpen(false)}
                onEnable={handleEnableAdminMode}
                t={t}
            />
        </div>
    );
};

export default UpdateSettings;
