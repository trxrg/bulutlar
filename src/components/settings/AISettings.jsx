import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
    Typography,
    Button,
    LinearProgress,
    Box,
    Card,
    CardContent,
    CardActions,
    Chip,
    IconButton,
    Tooltip,
    Alert,
    CircularProgress,
    Divider,
    Radio,
    RadioGroup,
    FormControlLabel,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import MemoryIcon from '@mui/icons-material/Memory';
import StorageIcon from '@mui/icons-material/Storage';
import LanguageIcon from '@mui/icons-material/Language';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { AppContext } from '../../store/app-context';
import { aiModelApi, aiVectorApi } from '../../backend-adapter/BackendAdapter';

const AISettings = () => {
    const { translate: t } = useContext(AppContext);

    // Model state
    const [models, setModels] = useState([]);
    const [loadedModelId, setLoadedModelId] = useState(null);
    const [isModelLoading, setIsModelLoading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState({});

    // Index state
    const [indexStatus, setIndexStatus] = useState({
        indexedArticles: 0,
        embeddingModelLoaded: false,
        embeddingModelLoading: false
    });
    const [isRebuilding, setIsRebuilding] = useState(false);

    // Embedding model state
    const [embeddingModels, setEmbeddingModels] = useState([]);
    const [selectedEmbeddingModel, setSelectedEmbeddingModel] = useState(null);
    const [pendingEmbeddingModel, setPendingEmbeddingModel] = useState(null);
    
    // Dialog state
    const [showModelChangeDialog, setShowModelChangeDialog] = useState(false);
    const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);

    // Error state
    const [error, setError] = useState(null);

    // Load initial data
    const loadData = useCallback(async () => {
        try {
            const [modelsResult, modelStatus, vectorStatus, embeddingModelsResult, selectedEmbeddingModelId] = await Promise.all([
                aiModelApi.getAvailableModels(),
                aiModelApi.getStatus(),
                aiVectorApi.getStatus(),
                aiVectorApi.getAvailableEmbeddingModels(),
                aiVectorApi.getSelectedEmbeddingModel()
            ]);

            setModels(modelsResult || []);
            setLoadedModelId(modelStatus?.loadedModelId || null);
            setIsModelLoading(modelStatus?.isModelLoading || false);
            setIndexStatus(vectorStatus || {
                indexedArticles: 0,
                embeddingModelLoaded: false,
                embeddingModelLoading: false
            });
            setEmbeddingModels(embeddingModelsResult || []);
            setSelectedEmbeddingModel(selectedEmbeddingModelId);
        } catch (err) {
            console.error('Failed to load AI settings:', err);
            setError(t('ai.failedToLoadSettings'));
        }
    }, [t]);

    useEffect(() => {
        loadData();

        // Set up download progress listeners
        aiModelApi.onDownloadProgress((data) => {
            setDownloadProgress(prev => ({
                ...prev,
                [data.modelId]: data.progress
            }));
        });

        aiModelApi.onDownloadComplete((data) => {
            setDownloadProgress(prev => {
                const newProgress = { ...prev };
                delete newProgress[data.modelId];
                return newProgress;
            });
            loadData(); // Refresh model list
        });

        aiModelApi.onDownloadError((data) => {
            setDownloadProgress(prev => {
                const newProgress = { ...prev };
                delete newProgress[data.modelId];
                return newProgress;
            });
            setError(`${t('ai.downloadFailed')}: ${data.error}`);
        });

        return () => {
            aiModelApi.removeDownloadListeners();
        };
    }, [loadData, t]);

    // Model actions
    const handleDownloadModel = async (modelId) => {
        setError(null);
        setDownloadProgress(prev => ({ ...prev, [modelId]: 0 }));
        
        const result = await aiModelApi.downloadModel(modelId);
        if (!result.success) {
            setError(result.error);
            setDownloadProgress(prev => {
                const newProgress = { ...prev };
                delete newProgress[modelId];
                return newProgress;
            });
        }
    };

    const handleCancelDownload = async (modelId) => {
        await aiModelApi.cancelDownload(modelId);
        setDownloadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[modelId];
            return newProgress;
        });
    };

    const handleDeleteModel = async (modelId) => {
        setError(null);
        const result = await aiModelApi.deleteModel(modelId);
        if (result.success) {
            loadData();
        } else {
            setError(result.error);
        }
    };

    const handleLoadModel = async (modelId) => {
        setError(null);
        setIsModelLoading(true);
        
        const result = await aiModelApi.loadModel(modelId);
        setIsModelLoading(false);
        
        if (result.success) {
            setLoadedModelId(modelId);
            loadData();
        } else {
            setError(result.error);
        }
    };

    const handleUnloadModel = async () => {
        setError(null);
        const result = await aiModelApi.unloadModel();
        
        if (result.success) {
            setLoadedModelId(null);
            loadData();
        } else {
            setError(result.error);
        }
    };

    // Index actions
    const handleRebuildIndex = async () => {
        setError(null);
        setIsRebuilding(true);
        
        const result = await aiVectorApi.rebuildIndex();
        setIsRebuilding(false);
        
        if (result.success) {
            loadData();
        } else {
            setError(result.error);
        }
    };

    // Embedding model actions
    const handleEmbeddingModelChange = (modelId) => {
        if (modelId !== selectedEmbeddingModel) {
            setPendingEmbeddingModel(modelId);
            setShowModelChangeDialog(true);
        }
    };

    const handleConfirmModelChange = async () => {
        setShowModelChangeDialog(false);
        setError(null);
        
        if (pendingEmbeddingModel) {
            const result = await aiVectorApi.setEmbeddingModel(pendingEmbeddingModel);
            if (result.success) {
                setSelectedEmbeddingModel(pendingEmbeddingModel);
                // Show regenerate dialog
                setShowRegenerateDialog(true);
            } else {
                setError(result.error);
            }
        }
        setPendingEmbeddingModel(null);
    };

    const handleCancelModelChange = () => {
        setShowModelChangeDialog(false);
        setPendingEmbeddingModel(null);
    };

    const handleClearAndRegenerate = async () => {
        setShowRegenerateDialog(false);
        setError(null);
        setIsRebuilding(true);
        
        const result = await aiVectorApi.clearAndRebuildIndex();
        setIsRebuilding(false);
        
        if (result.success) {
            loadData();
        } else {
            setError(result.error);
        }
    };

    const handleSkipRegenerate = () => {
        setShowRegenerateDialog(false);
        loadData();
    };

    const formatBytes = (bytes) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    return (
        <Box sx={{ color: 'var(--text-primary)' }}>
            {error && (
                <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {/* Index Status Section */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ mb: 2, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <StorageIcon /> {t('ai.indexStatus')}
                </Typography>
                
                <Card sx={{ bgcolor: 'var(--bg-tertiary)', mb: 2 }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Box>
                                <Typography variant="body1" sx={{ color: 'var(--text-primary)' }}>
                                    {t('ai.indexedArticles')}: <strong>{indexStatus.indexedArticles || 0}</strong>
                                </Typography>
                                <Typography variant="body2" component="div" sx={{ color: 'var(--text-secondary)', mt: 0.5 }}>
                                    {indexStatus.embeddingModelLoaded ? (
                                        <Chip size="small" label={t('ai.embeddingModelReady')} color="success" />
                                    ) : indexStatus.embeddingModelLoading ? (
                                        <Chip size="small" label={t('ai.embeddingModelLoading')} color="warning" />
                                    ) : (
                                        <Chip size="small" label={t('ai.embeddingModelNotLoaded')} color="default" />
                                    )}
                                </Typography>
                            </Box>
                            
                            <Button
                                variant="outlined"
                                startIcon={isRebuilding ? <CircularProgress size={16} /> : <RefreshIcon />}
                                onClick={handleRebuildIndex}
                                disabled={isRebuilding}
                                sx={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                            >
                                {isRebuilding ? t('ai.rebuilding') : t('ai.rebuildIndex')}
                            </Button>
                        </Box>
                        
                        <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
                            {t('ai.indexDescription')}
                        </Typography>
                    </CardContent>
                </Card>
            </Box>

            <Divider sx={{ my: 3, borderColor: 'var(--border-color)' }} />

            {/* Embedding Model Selection Section */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ mb: 2, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LanguageIcon /> {t('ai.embeddingModels')}
                </Typography>
                
                <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mb: 2 }}>
                    {t('ai.embeddingModelsDescription')}
                </Typography>

                {/* Warning if model mismatch */}
                {indexStatus.modelMismatch && (
                    <Alert 
                        severity="warning" 
                        icon={<WarningAmberIcon />}
                        sx={{ mb: 2 }}
                        action={
                            <Button 
                                color="inherit" 
                                size="small"
                                onClick={() => setShowRegenerateDialog(true)}
                                disabled={isRebuilding}
                            >
                                {t('ai.regenerateNow')}
                            </Button>
                        }
                    >
                        {t('ai.modelMismatchWarning')}
                    </Alert>
                )}

                {/* Warning if chunk configuration mismatch */}
                {indexStatus.chunkConfigMismatch && !indexStatus.modelMismatch && (
                    <Alert 
                        severity="warning" 
                        icon={<WarningAmberIcon />}
                        sx={{ mb: 2 }}
                        action={
                            <Button 
                                color="inherit" 
                                size="small"
                                onClick={() => setShowRegenerateDialog(true)}
                                disabled={isRebuilding}
                            >
                                {t('ai.regenerateNow')}
                            </Button>
                        }
                    >
                        {t('ai.chunkConfigMismatchWarning')}
                    </Alert>
                )}

                <Card sx={{ bgcolor: 'var(--bg-tertiary)', mb: 2 }}>
                    <CardContent>
                        <RadioGroup
                            value={selectedEmbeddingModel || ''}
                            onChange={(e) => handleEmbeddingModelChange(e.target.value)}
                        >
                            {embeddingModels.map((model, index) => (
                                <Box key={model.id}>
                                    {index > 0 && <Divider sx={{ my: 1.5, borderColor: 'var(--border-color)' }} />}
                                    <FormControlLabel
                                        value={model.id}
                                        control={<Radio sx={{ color: 'var(--text-secondary)', '&.Mui-checked': { color: 'var(--accent-color)' } }} />}
                                        label={
                                            <Box sx={{ ml: 1 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Typography variant="body1" sx={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                                                        {model.name}
                                                    </Typography>
                                                    {selectedEmbeddingModel === model.id && (
                                                        <Chip size="small" label={t('ai.selected')} color="primary" />
                                                    )}
                                                </Box>
                                                <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mt: 0.5 }}>
                                                    {model.description}
                                                </Typography>
                                                <Box sx={{ display: 'flex', gap: 2, mt: 1, flexWrap: 'wrap' }}>
                                                    <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
                                                        {t('ai.languages')}: {model.languages.join(', ')}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
                                                        {t('ai.size')}: {model.size}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
                                                        {t('ai.dimensions')}: {model.dimensions}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        }
                                        sx={{ 
                                            alignItems: 'flex-start', 
                                            py: 1,
                                            m: 0,
                                            width: '100%'
                                        }}
                                        disabled={isRebuilding}
                                    />
                                </Box>
                            ))}
                        </RadioGroup>
                    </CardContent>
                    <CardActions sx={{ px: 2, pb: 2 }}>
                        <Button
                            variant="outlined"
                            color="warning"
                            startIcon={isRebuilding ? <CircularProgress size={16} /> : <RefreshIcon />}
                            onClick={() => setShowRegenerateDialog(true)}
                            disabled={isRebuilding}
                            sx={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                        >
                            {isRebuilding ? t('ai.regenerating') : t('ai.clearAndRegenerate')}
                        </Button>
                    </CardActions>
                </Card>
            </Box>

            <Divider sx={{ my: 3, borderColor: 'var(--border-color)' }} />

            {/* AI Models Section */}
            <Box>
                <Typography variant="h6" sx={{ mb: 2, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <MemoryIcon /> {t('ai.aiModels')}
                </Typography>
                
                <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mb: 2 }}>
                    {t('ai.modelsDescription')}
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {models.map((model) => {
                        const isDownloading = downloadProgress[model.id] !== undefined;
                        const progress = downloadProgress[model.id] || 0;
                        const isLoaded = loadedModelId === model.id;

                        return (
                            <Card 
                                key={model.id} 
                                sx={{ 
                                    bgcolor: 'var(--bg-tertiary)',
                                    border: isLoaded ? '2px solid var(--accent-color)' : '1px solid var(--border-color)'
                                }}
                            >
                                <CardContent>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <Box>
                                            <Typography variant="h6" sx={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 1 }}>
                                                {model.name}
                                                {isLoaded && (
                                                    <Chip size="small" label={t('ai.loaded')} color="success" />
                                                )}
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mt: 0.5 }}>
                                                {model.description}
                                            </Typography>
                                            <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                                                <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
                                                    {t('ai.size')}: {model.size}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
                                                    {t('ai.ramRequired')}: {model.ramRequired}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            {model.isDownloaded ? (
                                                <CheckCircleIcon color="success" />
                                            ) : (
                                                <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
                                                    {t('ai.notDownloaded')}
                                                </Typography>
                                            )}
                                        </Box>
                                    </Box>

                                    {/* Download progress */}
                                    {isDownloading && (
                                        <Box sx={{ mt: 2 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                                                    {t('ai.downloading')}...
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                                                    {progress}%
                                                </Typography>
                                            </Box>
                                            <LinearProgress 
                                                variant="determinate" 
                                                value={progress} 
                                                sx={{ height: 8, borderRadius: 4 }}
                                            />
                                        </Box>
                                    )}
                                </CardContent>

                                <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2 }}>
                                    {isDownloading ? (
                                        <Button
                                            size="small"
                                            color="error"
                                            startIcon={<CancelIcon />}
                                            onClick={() => handleCancelDownload(model.id)}
                                        >
                                            {t('ai.cancel')}
                                        </Button>
                                    ) : model.isDownloaded ? (
                                        <>
                                            {isLoaded ? (
                                                <Button
                                                    size="small"
                                                    color="warning"
                                                    startIcon={<StopIcon />}
                                                    onClick={handleUnloadModel}
                                                    disabled={isModelLoading}
                                                >
                                                    {t('ai.unload')}
                                                </Button>
                                            ) : (
                                                <Button
                                                    size="small"
                                                    color="primary"
                                                    startIcon={isModelLoading ? <CircularProgress size={16} /> : <PlayArrowIcon />}
                                                    onClick={() => handleLoadModel(model.id)}
                                                    disabled={isModelLoading}
                                                >
                                                    {isModelLoading ? t('ai.loading') : t('ai.load')}
                                                </Button>
                                            )}
                                            <Tooltip title={t('ai.deleteModel')}>
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => handleDeleteModel(model.id)}
                                                    disabled={isLoaded || isModelLoading}
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </>
                                    ) : (
                                        <Button
                                            size="small"
                                            color="primary"
                                            startIcon={<DownloadIcon />}
                                            onClick={() => handleDownloadModel(model.id)}
                                        >
                                            {t('ai.download')}
                                        </Button>
                                    )}
                                </CardActions>
                            </Card>
                        );
                    })}
                </Box>
            </Box>

            {/* Model Change Confirmation Dialog */}
            <Dialog
                open={showModelChangeDialog}
                onClose={handleCancelModelChange}
                PaperProps={{
                    sx: { bgcolor: 'var(--bg-secondary)', color: 'var(--text-primary)' }
                }}
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WarningAmberIcon color="warning" />
                    {t('ai.changeEmbeddingModel')}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ color: 'var(--text-secondary)' }}>
                        {t('ai.changeModelWarning')}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCancelModelChange} sx={{ color: 'var(--text-secondary)' }}>
                        {t('cancel')}
                    </Button>
                    <Button onClick={handleConfirmModelChange} color="warning" variant="contained">
                        {t('ai.changeModel')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Regenerate Index Confirmation Dialog */}
            <Dialog
                open={showRegenerateDialog}
                onClose={handleSkipRegenerate}
                PaperProps={{
                    sx: { bgcolor: 'var(--bg-secondary)', color: 'var(--text-primary)' }
                }}
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <RefreshIcon color="warning" />
                    {t('ai.regenerateIndex')}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ color: 'var(--text-secondary)' }}>
                        {t('ai.regenerateIndexWarning')}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleSkipRegenerate} sx={{ color: 'var(--text-secondary)' }}>
                        {t('ai.later')}
                    </Button>
                    <Button 
                        onClick={handleClearAndRegenerate} 
                        color="warning" 
                        variant="contained"
                        disabled={isRebuilding}
                    >
                        {isRebuilding ? t('ai.regenerating') : t('ai.regenerateNow')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AISettings;
