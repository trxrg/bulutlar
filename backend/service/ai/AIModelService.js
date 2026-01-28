import { ipcMain, BrowserWindow } from 'electron';
import path from 'path';
import fs from 'fs';
import https from 'https';
import http from 'http';
import { config } from '../../config.js';
import { ensureFolderExists } from '../../fsOps.js';
import log from 'electron-log';

// Dynamic imports for node-llama-cpp
let getLlama;
let LlamaChatSession;

// LLM state
let llama = null;
let loadedModel = null;
let loadedModelId = null;
let modelContext = null;
let chatSession = null;
let isModelLoading = false;

// Available models configuration
const AVAILABLE_MODELS = [
    {
        id: "phi-3-mini",
        name: "Phi-3 Mini",
        size: "1.5 GB",
        sizeBytes: 1610612736,
        ramRequired: "4 GB",
        description: "Fast and efficient for basic tasks",
        url: "https://huggingface.co/microsoft/Phi-3-mini-4k-instruct-gguf/resolve/main/Phi-3-mini-4k-instruct-q4.gguf",
        filename: "phi-3-mini-q4.gguf"
    },
    {
        id: "llama-3.2-3b",
        name: "Llama 3.2 3B",
        size: "2 GB",
        sizeBytes: 2147483648,
        ramRequired: "4 GB",
        description: "Good balance of speed and quality",
        url: "https://huggingface.co/bartowski/Llama-3.2-3B-Instruct-GGUF/resolve/main/Llama-3.2-3B-Instruct-Q4_K_M.gguf",
        filename: "llama-3.2-3b-q4.gguf"
    },
    {
        id: "mistral-7b",
        name: "Mistral 7B",
        size: "4 GB",
        sizeBytes: 4294967296,
        ramRequired: "8 GB",
        description: "Higher quality, requires more RAM",
        url: "https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.2-GGUF/resolve/main/mistral-7b-instruct-v0.2.Q4_K_M.gguf",
        filename: "mistral-7b-q4.gguf"
    }
];

// Download state
const activeDownloads = new Map();

/**
 * Initialize the AI Model Service
 */
function initService() {
    ipcMain.handle('ai/model/getAvailableModels', async () => await getAvailableModels());
    ipcMain.handle('ai/model/getDownloadedModels', async () => await getDownloadedModels());
    ipcMain.handle('ai/model/downloadModel', async (event, modelId) => await downloadModel(modelId));
    ipcMain.handle('ai/model/cancelDownload', async (event, modelId) => await cancelDownload(modelId));
    ipcMain.handle('ai/model/deleteModel', async (event, modelId) => await deleteModel(modelId));
    ipcMain.handle('ai/model/loadModel', async (event, modelId) => await loadModel(modelId));
    ipcMain.handle('ai/model/unloadModel', async () => await unloadModel());
    ipcMain.handle('ai/model/getLoadedModel', async () => await getLoadedModel());
    ipcMain.handle('ai/model/getStatus', async () => await getModelStatus());
    ipcMain.handle('ai/model/generateResponse', async (event, prompt, systemPrompt) => await generateResponse(prompt, systemPrompt));
    
    log.info('AIModelService initialized');
}

/**
 * Get models folder path
 */
function getModelsPath() {
    ensureFolderExists(config.modelsPath);
    return config.modelsPath;
}

/**
 * Get full path to a model file
 */
function getModelFilePath(modelId) {
    const model = AVAILABLE_MODELS.find(m => m.id === modelId);
    if (!model) return null;
    return path.join(getModelsPath(), model.filename);
}

/**
 * Get list of available models with download status
 */
async function getAvailableModels() {
    const modelsPath = getModelsPath();
    
    return AVAILABLE_MODELS.map(model => {
        const filePath = path.join(modelsPath, model.filename);
        const isDownloaded = fs.existsSync(filePath);
        let downloadedSize = 0;
        
        if (isDownloaded) {
            try {
                const stats = fs.statSync(filePath);
                downloadedSize = stats.size;
            } catch (e) {
                // Ignore errors
            }
        }
        
        const isDownloading = activeDownloads.has(model.id);
        const downloadProgress = isDownloading ? activeDownloads.get(model.id).progress : 0;
        
        return {
            ...model,
            isDownloaded,
            downloadedSize,
            isDownloading,
            downloadProgress,
            isLoaded: loadedModelId === model.id
        };
    });
}

/**
 * Get list of downloaded models
 */
async function getDownloadedModels() {
    const models = await getAvailableModels();
    return models.filter(m => m.isDownloaded);
}

/**
 * Download a model
 */
async function downloadModel(modelId) {
    const model = AVAILABLE_MODELS.find(m => m.id === modelId);
    if (!model) {
        return { success: false, error: 'Model not found' };
    }
    
    if (activeDownloads.has(modelId)) {
        return { success: false, error: 'Download already in progress' };
    }
    
    const filePath = getModelFilePath(modelId);
    if (fs.existsSync(filePath)) {
        return { success: false, error: 'Model already downloaded' };
    }
    
    return new Promise((resolve) => {
        const tempPath = filePath + '.downloading';
        const file = fs.createWriteStream(tempPath);
        
        const downloadState = {
            progress: 0,
            downloaded: 0,
            total: model.sizeBytes,
            aborted: false,
            request: null
        };
        
        activeDownloads.set(modelId, downloadState);
        
        log.info(`Starting download: ${model.name} from ${model.url}`);
        
        const handleResponse = (response) => {
            // Handle redirects
            if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                log.info(`Following redirect to: ${response.headers.location}`);
                const redirectUrl = new URL(response.headers.location);
                const protocol = redirectUrl.protocol === 'https:' ? https : http;
                downloadState.request = protocol.get(response.headers.location, handleResponse);
                downloadState.request.on('error', handleError);
                return;
            }
            
            if (response.statusCode !== 200) {
                handleError(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
                return;
            }
            
            const totalSize = parseInt(response.headers['content-length'], 10) || model.sizeBytes;
            downloadState.total = totalSize;
            
            response.on('data', (chunk) => {
                if (downloadState.aborted) return;
                
                downloadState.downloaded += chunk.length;
                downloadState.progress = Math.round((downloadState.downloaded / totalSize) * 100);
                
                // Send progress to renderer
                sendDownloadProgress(modelId, downloadState.progress, downloadState.downloaded, totalSize);
            });
            
            response.pipe(file);
            
            file.on('finish', () => {
                file.close();
                
                if (downloadState.aborted) {
                    // Clean up aborted download
                    try { fs.unlinkSync(tempPath); } catch (e) {}
                    return;
                }
                
                // Rename temp file to final
                try {
                    fs.renameSync(tempPath, filePath);
                    activeDownloads.delete(modelId);
                    log.info(`Download complete: ${model.name}`);
                    sendDownloadComplete(modelId);
                    resolve({ success: true });
                } catch (err) {
                    activeDownloads.delete(modelId);
                    log.error(`Failed to rename downloaded file:`, err);
                    resolve({ success: false, error: err.message });
                }
            });
        };
        
        const handleError = (err) => {
            file.close();
            try { fs.unlinkSync(tempPath); } catch (e) {}
            activeDownloads.delete(modelId);
            log.error(`Download failed: ${model.name}`, err);
            sendDownloadError(modelId, err.message);
            resolve({ success: false, error: err.message });
        };
        
        try {
            const url = new URL(model.url);
            const protocol = url.protocol === 'https:' ? https : http;
            downloadState.request = protocol.get(model.url, handleResponse);
            downloadState.request.on('error', handleError);
        } catch (err) {
            handleError(err);
        }
    });
}

/**
 * Cancel a download in progress
 */
async function cancelDownload(modelId) {
    const downloadState = activeDownloads.get(modelId);
    if (!downloadState) {
        return { success: false, error: 'No download in progress' };
    }
    
    downloadState.aborted = true;
    if (downloadState.request) {
        downloadState.request.destroy();
    }
    
    activeDownloads.delete(modelId);
    
    // Clean up temp file
    const filePath = getModelFilePath(modelId);
    const tempPath = filePath + '.downloading';
    try { fs.unlinkSync(tempPath); } catch (e) {}
    
    log.info(`Download cancelled: ${modelId}`);
    return { success: true };
}

/**
 * Delete a downloaded model
 */
async function deleteModel(modelId) {
    // Unload if currently loaded
    if (loadedModelId === modelId) {
        await unloadModel();
    }
    
    const filePath = getModelFilePath(modelId);
    if (!filePath || !fs.existsSync(filePath)) {
        return { success: false, error: 'Model file not found' };
    }
    
    try {
        fs.unlinkSync(filePath);
        log.info(`Model deleted: ${modelId}`);
        return { success: true };
    } catch (err) {
        log.error(`Failed to delete model:`, err);
        return { success: false, error: err.message };
    }
}

/**
 * Initialize node-llama-cpp
 */
async function initLlama() {
    if (llama) return llama;
    
    try {
        // Dynamic import of node-llama-cpp
        const nodeLlamaCpp = await import('node-llama-cpp');
        getLlama = nodeLlamaCpp.getLlama;
        LlamaChatSession = nodeLlamaCpp.LlamaChatSession;
        
        llama = await getLlama();
        log.info('node-llama-cpp initialized');
        return llama;
    } catch (error) {
        log.error('Failed to initialize node-llama-cpp:', error);
        throw error;
    }
}

/**
 * Load a model into memory
 */
async function loadModel(modelId) {
    if (isModelLoading) {
        return { success: false, error: 'Another model is currently loading' };
    }
    
    if (loadedModelId === modelId) {
        return { success: true, message: 'Model already loaded' };
    }
    
    const filePath = getModelFilePath(modelId);
    if (!filePath || !fs.existsSync(filePath)) {
        return { success: false, error: 'Model file not found. Please download the model first.' };
    }
    
    isModelLoading = true;
    
    try {
        // Unload current model if any
        if (loadedModel) {
            await unloadModel();
        }
        
        const llamaInstance = await initLlama();
        
        log.info(`Loading model: ${modelId} from ${filePath}`);
        
        loadedModel = await llamaInstance.loadModel({
            modelPath: filePath
        });
        
        modelContext = await loadedModel.createContext();
        
        chatSession = new LlamaChatSession({
            contextSequence: modelContext.getSequence()
        });
        
        loadedModelId = modelId;
        isModelLoading = false;
        
        log.info(`Model loaded successfully: ${modelId}`);
        return { success: true, modelId };
    } catch (error) {
        isModelLoading = false;
        loadedModel = null;
        modelContext = null;
        chatSession = null;
        loadedModelId = null;
        
        log.error(`Failed to load model ${modelId}:`, error);
        return { success: false, error: error.message };
    }
}

/**
 * Unload the current model from memory
 */
async function unloadModel() {
    try {
        if (chatSession) {
            chatSession = null;
        }
        
        if (modelContext) {
            await modelContext.dispose();
            modelContext = null;
        }
        
        if (loadedModel) {
            await loadedModel.dispose();
            loadedModel = null;
        }
        
        const previousModelId = loadedModelId;
        loadedModelId = null;
        
        // Force garbage collection if available
        if (global.gc) {
            global.gc();
        }
        
        log.info(`Model unloaded: ${previousModelId}`);
        return { success: true };
    } catch (error) {
        log.error('Failed to unload model:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get the currently loaded model
 */
async function getLoadedModel() {
    if (!loadedModelId) {
        return null;
    }
    
    const model = AVAILABLE_MODELS.find(m => m.id === loadedModelId);
    return model ? { ...model, isLoaded: true } : null;
}

/**
 * Get overall model status
 */
async function getModelStatus() {
    return {
        isModelLoaded: loadedModelId !== null,
        isModelLoading,
        loadedModelId,
        loadedModelName: loadedModelId ? AVAILABLE_MODELS.find(m => m.id === loadedModelId)?.name : null,
        llamaInitialized: llama !== null
    };
}

/**
 * Generate a response using the loaded model
 */
async function generateResponse(prompt, systemPrompt = null) {
    if (!loadedModel || !chatSession) {
        return { success: false, error: 'No model loaded. Please load a model first.' };
    }
    
    try {
        log.info('Generating response for prompt:', prompt.substring(0, 100) + '...');
        
        // Build the full prompt with system prompt if provided
        let fullPrompt = prompt;
        if (systemPrompt) {
            fullPrompt = `${systemPrompt}\n\nUser: ${prompt}\n\nAssistant:`;
        }
        
        const response = await chatSession.prompt(fullPrompt);
        
        log.info('Response generated successfully');
        return { success: true, response };
    } catch (error) {
        log.error('Failed to generate response:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Generate streaming response (for future use)
 */
async function generateResponseStreaming(prompt, systemPrompt = null, onToken = null) {
    if (!loadedModel || !chatSession) {
        throw new Error('No model loaded');
    }
    
    let fullPrompt = prompt;
    if (systemPrompt) {
        fullPrompt = `${systemPrompt}\n\nUser: ${prompt}\n\nAssistant:`;
    }
    
    let fullResponse = '';
    
    await chatSession.prompt(fullPrompt, {
        onToken: (tokens) => {
            const text = loadedModel.detokenize(tokens);
            fullResponse += text;
            if (onToken) {
                onToken(text, fullResponse);
            }
        }
    });
    
    return fullResponse;
}

// Helper functions to send events to renderer
function sendDownloadProgress(modelId, progress, downloaded, total) {
    const windows = BrowserWindow.getAllWindows();
    for (const win of windows) {
        win.webContents.send('ai-download-progress', { modelId, progress, downloaded, total });
    }
}

function sendDownloadComplete(modelId) {
    const windows = BrowserWindow.getAllWindows();
    for (const win of windows) {
        win.webContents.send('ai-download-complete', { modelId });
    }
}

function sendDownloadError(modelId, error) {
    const windows = BrowserWindow.getAllWindows();
    for (const win of windows) {
        win.webContents.send('ai-download-error', { modelId, error });
    }
}

const AIModelService = {
    initService,
    getAvailableModels,
    getDownloadedModels,
    downloadModel,
    cancelDownload,
    deleteModel,
    loadModel,
    unloadModel,
    getLoadedModel,
    getModelStatus,
    generateResponse,
    generateResponseStreaming,
    AVAILABLE_MODELS
};

export default AIModelService;
