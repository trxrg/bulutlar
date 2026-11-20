import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Alert, Box, Button, Chip, LinearProgress, Radio, Typography } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
import FileOpenIcon from '@mui/icons-material/FileOpen';
import toastr from 'toastr';
import { AppContext } from '../../store/app-context';
import { aiApi } from '../../backend-adapter/BackendAdapter';

const GB = 1e9;
const formatGB = (bytes) => `${(bytes / GB).toFixed(1)} GB`;

const rowStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid var(--border-secondary)',
    backgroundColor: 'var(--bg-primary)',
};

const AISettings = () => {
    const { translate: t } = useContext(AppContext);
    const [overview, setOverview] = useState(null);
    const [progress, setProgress] = useState({});

    const refresh = useCallback(async () => {
        const data = await aiApi.getOverview();
        setOverview(data);
        setProgress(data.downloads || {});
    }, []);

    useEffect(() => {
        refresh();
        const off = aiApi.onDownloadProgress((p) => {
            if (p.phase === 'complete' || p.phase === 'cancelled' || p.phase === 'error') {
                setProgress((prev) => {
                    const next = { ...prev };
                    delete next[p.catalogId];
                    return next;
                });
                if (p.phase === 'complete') toastr.success(t('ai model downloaded'));
                if (p.phase === 'error') toastr.error(`${t('ai download failed')}: ${p.error}`);
                refresh();
            } else {
                setProgress((prev) => ({ ...prev, [p.catalogId]: p }));
            }
        });
        return off;
    }, [refresh, t]);

    if (!overview) return null;

    const installedIds = new Set(overview.installed.map((m) => m.id));
    const ramGB = Math.round(overview.totalRamBytes / 1024 ** 3);

    const handleImport = async () => {
        try {
            const model = await aiApi.importModel();
            if (model) {
                toastr.success(t('ai model imported'));
                refresh();
            }
        } catch (err) {
            toastr.error(String(err.message).includes('NOT_GGUF') ? t('ai not a gguf file') : err.message);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(t('ai confirm delete model'))) return;
        setOverview(await aiApi.deleteModel(id));
    };

    const handleSelect = async (id) => {
        setOverview(await aiApi.selectModel(id));
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, color: 'var(--text-primary)' }}>
            <Alert severity='info'>{t('ai privacy note')}</Alert>

            <Typography variant='h6'>{t('ai installed models')}</Typography>
            {overview.installed.length === 0 && (
                <Typography sx={{ color: 'var(--text-secondary)' }}>{t('ai no models installed')}</Typography>
            )}
            {overview.installed.map((m) => (
                <div key={m.id} style={rowStyle}>
                    <Radio
                        checked={overview.selectedId === m.id}
                        onChange={() => handleSelect(m.id)}
                        sx={{ color: 'var(--text-primary)' }}
                    />
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>{m.name}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                            {formatGB(m.sizeBytes)} · {m.source === 'import' ? t('ai imported') : t('ai downloaded')}
                            {overview.loadedModelId === m.id ? ` · ${t('ai loaded in memory')}` : ''}
                        </div>
                    </div>
                    <Button color='error' startIcon={<DeleteIcon />} onClick={() => handleDelete(m.id)}>
                        {t('delete')}
                    </Button>
                </div>
            ))}
            <div>
                <Button variant='outlined' startIcon={<FileOpenIcon />} onClick={handleImport}>
                    {t('ai import gguf')}
                </Button>
            </div>

            <Typography variant='h6' sx={{ mt: 2 }}>{t('ai available models')}</Typography>
            <Typography sx={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                {t('ai ram detected')}: {ramGB} GB
            </Typography>
            {overview.catalog.map((m) => {
                const p = progress[m.id];
                const installed = installedIds.has(m.id);
                const tooBig = m.minRamGB > ramGB;
                const pct = p && p.total ? Math.min(100, (p.received / p.total) * 100) : 0;
                return (
                    <div key={m.id} style={{ ...rowStyle, flexDirection: 'column', alignItems: 'stretch', opacity: tooBig && !installed ? 0.6 : 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                    {m.name}
                                    {overview.recommendedId === m.id && <Chip size='small' color='success' label={t('ai recommended')} />}
                                    {tooBig && <Chip size='small' color='warning' label={t('ai needs more ram')} />}
                                </div>
                                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                                    ~{formatGB(m.sizeBytes)} · {t('ai min ram')} {m.minRamGB} GB · {m.license}
                                    {m.note ? ` · ${m.note}` : ''}
                                </div>
                            </div>
                            {installed ? (
                                <Chip label={t('ai installed')} />
                            ) : p ? (
                                <Button onClick={() => aiApi.cancelDownload(m.id)}>{t('cancel')}</Button>
                            ) : (
                                <Button variant='contained' startIcon={<DownloadIcon />} onClick={() => aiApi.downloadModel(m.id)}>
                                    {t('download')}
                                </Button>
                            )}
                        </div>
                        {p && (
                            <Box sx={{ mt: 1 }}>
                                <LinearProgress variant='determinate' value={pct} />
                                <Typography sx={{ fontSize: 12, mt: 0.5, color: 'var(--text-secondary)' }}>
                                    {p.phase === 'verify'
                                        ? `${t('ai verifying')} ${pct.toFixed(0)}%`
                                        : `${formatGB(p.received)} / ${formatGB(p.total)} (${pct.toFixed(0)}%)`}
                                </Typography>
                            </Box>
                        )}
                    </div>
                );
            })}
        </Box>
    );
};

export default AISettings;
