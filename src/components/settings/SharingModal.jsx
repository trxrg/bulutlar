import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { Button, Checkbox, FormControlLabel, Typography, Box, Chip, IconButton, ToggleButton, ToggleButtonGroup, TextField, Alert, CircularProgress } from '@mui/material';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import { AppContext } from '../../store/app-context';
import GeneralModal from '../common/GeneralModal';

// Q5: bundle size cap soft warning at 250 MB. WhatsApp's hard limit is
// 2 GB but we want headroom. Hardcoded for v1; user-configurable can
// land later as a settings field.
const SIZE_WARNING_BYTES = 250 * 1024 * 1024;

// Material red 700 — used as the "this row will tombstone on mobile"
// visual cue across the title, chip, border, and toggle when a row's
// mode is set to `manualDelete`.
const DANGER_RED = '#d32f2f';

const STATUS_LABELS = {
    created: 'created',
    updated: 'updated',
    unchanged: 'unchanged',
};

function statusChipColor(status) {
    switch (status) {
        case 'created':   return 'success';
        case 'updated':   return 'warning';
        case 'unchanged': return 'default';
        default:          return 'default';
    }
}

function humanBytes(bytes) {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    let v = bytes;
    while (v >= 1024 && i < units.length - 1) {
        v /= 1024;
        i++;
    }
    return `${v.toFixed(v < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

const SharingModal = ({ isOpen, onRequestClose }) => {
    const { translate: t } = useContext(AppContext);

    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [resultSummary, setResultSummary] = useState(null);
    const [resultFilePath, setResultFilePath] = useState('');

    const [candidates, setCandidates] = useState({
        created: [], updated: [], unchanged: [],
        deleted: { count: 0, items: [] },
        lastExport: null,
    });

    // selected: Map<articleUuid, 'latestState' | 'manualDelete'>
    const [selected, setSelected] = useState(new Map());

    const [filters, setFilters] = useState({
        created: true,
        updated: true,
        deleted: true,
        unchanged: false,
    });

    const [searchQuery, setSearchQuery] = useState('');

    const refreshCandidates = useCallback(async () => {
        setLoading(true);
        setErrorMessage('');
        try {
            const c = await window.api.sharing.getCandidates();
            setCandidates(c);
        } catch (err) {
            console.error('getCandidates failed:', err);
            setErrorMessage(err.message || String(err));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isOpen) refreshCandidates();
    }, [isOpen, refreshCandidates]);

    // ------------------------------------------------------------------
    // Left pane: classify visible articles, apply filters + search
    // ------------------------------------------------------------------

    const taggedArticles = useMemo(() => {
        const out = [];
        for (const a of candidates.created)   out.push({ ...a, status: 'created' });
        for (const a of candidates.updated)   out.push({ ...a, status: 'updated' });
        for (const a of candidates.unchanged) out.push({ ...a, status: 'unchanged' });
        return out;
    }, [candidates]);

    const visibleLeftArticles = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return taggedArticles.filter((a) => {
            if (!filters[a.status]) return false;
            if (selected.has(a.uuid)) return false; // already in right pane
            if (q && !(a.title || '').toLowerCase().includes(q)) return false;
            return true;
        });
    }, [taggedArticles, filters, selected, searchQuery]);

    const articleByUuid = useMemo(() => {
        const m = new Map();
        for (const a of taggedArticles) m.set(a.uuid, a);
        return m;
    }, [taggedArticles]);

    // ------------------------------------------------------------------
    // Right pane: rows in selection order
    // ------------------------------------------------------------------

    const rightPaneRows = useMemo(() => {
        const rows = [];
        for (const [uuid, mode] of selected) {
            const a = articleByUuid.get(uuid);
            if (a) rows.push({ ...a, mode });
        }
        return rows;
    }, [selected, articleByUuid]);

    // ------------------------------------------------------------------
    // Selection actions
    // ------------------------------------------------------------------

    const moveToRight = (uuid) => {
        setSelected((prev) => {
            const next = new Map(prev);
            next.set(uuid, 'latestState');
            return next;
        });
    };

    const moveToLeft = (uuid) => {
        setSelected((prev) => {
            const next = new Map(prev);
            next.delete(uuid);
            return next;
        });
    };

    const setMode = (uuid, mode) => {
        setSelected((prev) => {
            const next = new Map(prev);
            if (next.has(uuid)) next.set(uuid, mode);
            return next;
        });
    };

    const selectAllVisible = () => {
        setSelected((prev) => {
            const next = new Map(prev);
            for (const a of visibleLeftArticles) next.set(a.uuid, 'latestState');
            return next;
        });
    };

    const clearSelection = () => setSelected(new Map());

    // ------------------------------------------------------------------
    // Summary
    // ------------------------------------------------------------------

    const counts = useMemo(() => {
        let latestState = 0;
        let manualDelete = 0;
        for (const [, mode] of selected) {
            if (mode === 'latestState') latestState++;
            else if (mode === 'manualDelete') manualDelete++;
        }
        return {
            latestState,
            manualDelete,
            autoDeleted: candidates.deleted.count || 0,
        };
    }, [selected, candidates]);

    const sizeOverThreshold = false; // we don't know size until after build

    // ------------------------------------------------------------------
    // Generate
    // ------------------------------------------------------------------

    const handleGenerate = async () => {
        const latestState = [];
        const manualDelete = [];
        for (const [uuid, mode] of selected) {
            if (mode === 'latestState') latestState.push(uuid);
            else if (mode === 'manualDelete') manualDelete.push(uuid);
        }

        // Ask the user where to put the .blt file before doing any work.
        // If the dialog is cancelled, abort silently.
        let outputDir = null;
        try {
            outputDir = await window.api.sharing.chooseOutputDir({
                title: t('choose bundle folder') || 'Choose folder for bundle (.blt)',
            });
        } catch (err) {
            console.error('chooseOutputDir failed:', err);
            setErrorMessage(err.message || String(err));
            return;
        }
        if (!outputDir) return;

        setGenerating(true);
        setErrorMessage('');
        setResultSummary(null);
        setResultFilePath('');

        try {
            const result = await window.api.sharing.exportBundle({ latestState, manualDelete, outputDir });
            setResultSummary(result.summary);
            setResultFilePath(result.filePath);
            // Reset selection for next round but keep candidates fresh.
            setSelected(new Map());
            refreshCandidates();
        } catch (err) {
            console.error('exportBundle failed:', err);
            setErrorMessage(err.message || String(err));
        } finally {
            setGenerating(false);
        }
    };

    const handleShowInFolder = async () => {
        if (!resultFilePath) return;
        try { await window.api.sharing.showInFolder(resultFilePath); }
        catch (err) { console.warn('showInFolder failed:', err); }
    };

    const totalCandidatesShown =
        candidates.created.length + candidates.updated.length + candidates.unchanged.length + candidates.deleted.count;

    // ------------------------------------------------------------------
    // Render
    // ------------------------------------------------------------------

    return (
        <GeneralModal
            isOpen={isOpen}
            onRequestClose={onRequestClose}
            title={t('generate update bundle')}
            style={{ width: '90%', maxWidth: '1200px', height: '85vh' }}
        >
            <div
                className='sharing-modal flex flex-col gap-3'
                style={{ flex: 1, minHeight: 0, color: 'var(--text-primary)' }}
            >

                {/* Top status bar */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                    <Typography sx={{ color: 'var(--text-secondary)' }}>
                        {candidates.lastExport
                            ? `${t('last exported')}: ${new Date(candidates.lastExport.createdAt).toLocaleString()}`
                            : t('no bundles yet')}
                    </Typography>
                    {loading && <CircularProgress size={20} />}
                </Box>

                {errorMessage && (
                    <Alert severity='error' onClose={() => setErrorMessage('')}>
                        {errorMessage}
                    </Alert>
                )}

                {resultSummary && (
                    <Alert
                        severity='success'
                        action={
                            <Button
                                color='inherit'
                                size='small'
                                startIcon={<FolderOpenIcon />}
                                onClick={handleShowInFolder}
                            >
                                {t('show in folder')}
                            </Button>
                        }
                    >
                        <strong>{t('bundle generated')}</strong>
                        {' — '}
                        {resultSummary.articleCount} {t('articles')},
                        {' '}
                        {resultSummary.mediaCount} {t('media count')},
                        {' '}
                        {humanBytes(resultSummary.sizeBytes)}
                        {resultSummary.manualDelete > 0 && (
                            <Box sx={{ mt: 1, fontSize: '0.85em' }}>
                                {t('manual delete warning')}
                            </Box>
                        )}
                    </Alert>
                )}

                {/* Filters */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
                    {(['created', 'updated', 'deleted', 'unchanged']).map((key) => (
                        <FormControlLabel
                            key={key}
                            control={
                                <Checkbox
                                    size='small'
                                    checked={filters[key]}
                                    onChange={(e) => setFilters((f) => ({ ...f, [key]: e.target.checked }))}
                                />
                            }
                            label={`${t(key)} (${
                                key === 'deleted'
                                    ? candidates.deleted.count
                                    : (candidates[key] || []).length
                            })`}
                        />
                    ))}
                    <Box sx={{ flexGrow: 1 }} />
                    <TextField
                        size='small'
                        placeholder={t('search articles')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        sx={{ minWidth: 200 }}
                    />
                </Box>

                {/* Two-pane layout */}
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, flex: 1, minHeight: 0 }}>

                    {/* LEFT PANE */}
                    <Box sx={paneSx}>
                        <Box sx={paneHeaderSx}>
                            <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
                                {t('available since last export')} ({visibleLeftArticles.length})
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                                <Button size='small' onClick={selectAllVisible} disabled={visibleLeftArticles.length === 0}>
                                    {t('select all visible')}
                                </Button>
                            </Box>
                        </Box>
                        <Box sx={paneListSx}>
                            {!loading && visibleLeftArticles.length === 0 && totalCandidatesShown === 0 && (
                                <Typography sx={emptyStateSx}>{t('no articles to share')}</Typography>
                            )}
                            {visibleLeftArticles.map((a) => (
                                <Box key={a.uuid} sx={rowSx}>
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography noWrap sx={{ fontWeight: 500 }}>
                                            {a.title || '(untitled)'}
                                        </Typography>
                                        <Typography variant='caption' sx={{ color: 'var(--text-secondary)' }}>
                                            {a.ownerName || '—'} · {a.categoryName || '—'} · {new Date(a.updatedAt).toLocaleDateString()}
                                        </Typography>
                                    </Box>
                                    <Chip
                                        size='small'
                                        label={t(STATUS_LABELS[a.status] || a.status)}
                                        color={statusChipColor(a.status)}
                                    />
                                    <IconButton size='small' onClick={() => moveToRight(a.uuid)} title={t('add')}>
                                        <KeyboardArrowRightIcon />
                                    </IconButton>
                                </Box>
                            ))}

                            {filters.deleted && candidates.deleted.count > 0 && (
                                <Box sx={{ ...rowSx, flexDirection: 'column', alignItems: 'flex-start', backgroundColor: 'rgba(244, 67, 54, 0.08)' }}>
                                    <Typography sx={{ fontWeight: 600 }}>
                                        {t('pending deletions')}: {candidates.deleted.count}
                                    </Typography>
                                    <Typography variant='caption' sx={{ color: 'var(--text-secondary)' }}>
                                        {t('auto-included deletions')}
                                    </Typography>
                                    {candidates.deleted.items.slice(0, 5).map((d) => (
                                        <Typography key={d.uuid} variant='caption' sx={{ color: 'var(--text-secondary)' }}>
                                            · {d.uuid.slice(0, 8)}… {d.deletedAt ? `· ${t('deletion timestamp')}: ${new Date(d.deletedAt).toLocaleString()}` : ''}
                                        </Typography>
                                    ))}
                                    {candidates.deleted.items.length > 5 && (
                                        <Typography variant='caption' sx={{ color: 'var(--text-secondary)' }}>
                                            … +{candidates.deleted.items.length - 5}
                                        </Typography>
                                    )}
                                </Box>
                            )}
                        </Box>
                    </Box>

                    {/* RIGHT PANE */}
                    <Box sx={paneSx}>
                        <Box sx={paneHeaderSx}>
                            <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
                                {t('will be included')} ({rightPaneRows.length})
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                                <Button size='small' onClick={clearSelection} disabled={rightPaneRows.length === 0}>
                                    {t('clear selection')}
                                </Button>
                            </Box>
                        </Box>
                        <Box sx={paneListSx}>
                            {rightPaneRows.length === 0 && (
                                <Typography sx={emptyStateSx}>—</Typography>
                            )}
                            {rightPaneRows.map((a) => {
                                const isManualDelete = a.mode === 'manualDelete';
                                return (
                                    <Box
                                        key={a.uuid}
                                        sx={{
                                            ...rowSx,
                                            flexDirection: 'column',
                                            alignItems: 'stretch',
                                            ...(isManualDelete && {
                                                borderColor: DANGER_RED,
                                                borderWidth: 2,
                                                backgroundColor: 'rgba(211, 47, 47, 0.08)',
                                            }),
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <IconButton size='small' onClick={() => moveToLeft(a.uuid)} title={t('remove')}>
                                                <KeyboardArrowLeftIcon />
                                            </IconButton>
                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                <Typography
                                                    noWrap
                                                    sx={{
                                                        fontWeight: 500,
                                                        ...(isManualDelete && { color: DANGER_RED, textDecoration: 'line-through' }),
                                                    }}
                                                >
                                                    {a.title || '(untitled)'}
                                                </Typography>
                                                <Typography variant='caption' sx={{ color: 'var(--text-secondary)' }}>
                                                    {a.ownerName || '—'} · {a.categoryName || '—'}
                                                </Typography>
                                            </Box>
                                            {isManualDelete ? (
                                                <Chip size='small' label={t('send delete only')} color='error' />
                                            ) : (
                                                <Chip
                                                    size='small'
                                                    label={t(STATUS_LABELS[a.status] || a.status)}
                                                    color={statusChipColor(a.status)}
                                                />
                                            )}
                                        </Box>
                                        <ToggleButtonGroup
                                            value={a.mode}
                                            exclusive
                                            size='small'
                                            onChange={(_e, v) => { if (v) setMode(a.uuid, v); }}
                                            sx={{ alignSelf: 'flex-end' }}
                                        >
                                            <ToggleButton value='latestState'>{t('latest state')}</ToggleButton>
                                            <ToggleButton value='manualDelete' className='sharing-modal__delete-toggle'>
                                                {t('send delete only')}
                                            </ToggleButton>
                                        </ToggleButtonGroup>
                                    </Box>
                                );
                            })}
                        </Box>
                    </Box>
                </Box>

                {/* Summary footer */}
                <Box sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 2,
                    p: 1.5,
                    border: '1px solid var(--border-secondary)',
                    borderRadius: 1,
                    backgroundColor: 'var(--bg-tertiary)',
                }}>
                    <SummaryStat label={t('latest state')} value={counts.latestState} />
                    {counts.manualDelete > 0 && (
                        <SummaryStat label={t('send delete only')} value={counts.manualDelete} highlight='#d32f2f' />
                    )}
                    <SummaryStat label={t('auto-included deletions')} value={counts.autoDeleted} />
                </Box>

                {sizeOverThreshold && (
                    <Alert severity='warning'>{t('size warning')}</Alert>
                )}

                {/* Action buttons */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <Button onClick={onRequestClose} disabled={generating}>{t('cancel')}</Button>
                    <Button
                        variant='contained'
                        onClick={handleGenerate}
                        disabled={
                            generating
                            || (counts.latestState === 0 && counts.manualDelete === 0 && counts.autoDeleted === 0)
                        }
                    >
                        {generating ? <CircularProgress size={20} sx={{ color: 'white' }} /> : t('generate')}
                    </Button>
                </Box>
            </div>
        </GeneralModal>
    );
};

const SummaryStat = ({ label, value, highlight }) => (
    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
        <Typography variant='caption' sx={{ color: 'var(--text-secondary)' }}>{label}:</Typography>
        <Typography variant='body2' sx={{ fontWeight: 600, color: highlight || 'var(--text-primary)' }}>{value}</Typography>
    </Box>
);

const paneSx = {
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
    border: '1px solid var(--border-secondary)',
    borderRadius: 1,
    overflow: 'hidden',
};

const paneHeaderSx = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    p: 1,
    backgroundColor: 'var(--bg-tertiary)',
    borderBottom: '1px solid var(--border-secondary)',
};

const paneListSx = {
    flex: 1,
    overflowY: 'auto',
    p: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
};

const rowSx = {
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    p: 1,
    borderRadius: 1,
    border: '1px solid var(--border-secondary)',
    backgroundColor: 'var(--bg-secondary)',
};

const emptyStateSx = {
    color: 'var(--text-secondary)',
    textAlign: 'center',
    py: 4,
};

export default SharingModal;
