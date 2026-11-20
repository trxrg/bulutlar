// Local AI chat about articles.
//
// Privacy: article text is read from the local database and sent only to the
// inference worker (a local utility process with all networking disabled,
// see backend/ai/networkGuard.js). The only network use in the AI feature is
// downloading a model file from the curated catalog (backend/ai/modelDownloader.js),
// which sends no user data.

import { app, ipcMain, dialog, utilityProcess, BrowserWindow } from 'electron';
import os from 'node:os';
import path from 'node:path';
import fsp from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { sequelize } from '../sequelize/index.js';
import { MODEL_CATALOG, getCatalogEntry, recommendedModelId } from '../ai/modelCatalog.js';
import { createModelStore, isGgufFile, safeImportedFileName } from '../ai/modelStore.js';
import { downloadCatalogModel } from '../ai/modelDownloader.js';
import { buildArticleText } from '../ai/articleText.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WORKER_PATH = path.join(__dirname, '../ai/worker.js');

let store;
let worker = null;
let workerReady = null;
let nextId = 1;
const pending = new Map(); // requestId -> { resolve, reject, onEvent }
const downloads = new Map(); // catalogId -> { controller, progress }
let loadedModelId = null;
let loadingPromise = null;

// ------------------------------------------------------------------- worker
function startWorker() {
    if (workerReady) return workerReady;
    workerReady = new Promise((resolve, reject) => {
        worker = utilityProcess.fork(WORKER_PATH, [], {
            serviceName: 'Bulutlar AI',
            stdio: 'inherit',
            env: { ...process.env, NODE_LLAMA_CPP_SKIP_DOWNLOAD: 'true' },
        });
        worker.on('message', (msg) => {
            if (msg?.type === 'ready') return resolve();
            handleWorkerMessage(msg);
        });
        worker.on('exit', (code) => {
            console.warn(`AI worker exited with code ${code}`);
            for (const p of pending.values()) p.reject(new Error('AI process stopped'));
            pending.clear();
            worker = null;
            workerReady = null;
            loadedModelId = null;
            reject(new Error('AI process failed to start'));
        });
    });
    return workerReady;
}

function handleWorkerMessage(msg) {
    const p = pending.get(msg?.requestId);
    if (!p) return;
    switch (msg.type) {
        case 'result':
            pending.delete(msg.requestId);
            p.resolve(msg.result);
            break;
        case 'done':
            pending.delete(msg.requestId);
            p.onEvent?.(msg);
            p.resolve(msg);
            break;
        case 'error':
            pending.delete(msg.requestId);
            p.reject(new Error(msg.error));
            break;
        default:
            p.onEvent?.(msg);
    }
}

async function call(type, payload = {}, onEvent) {
    await startWorker();
    const requestId = payload.requestId || `w${nextId++}`;
    return new Promise((resolve, reject) => {
        pending.set(requestId, { resolve, reject, onEvent });
        worker.postMessage({ ...payload, type, requestId });
    });
}

async function ensureModelLoaded() {
    const selected = await store.getSelected();
    if (!selected) throw new Error('NO_MODEL');
    if (loadedModelId === selected.id) return;
    if (!loadingPromise) {
        broadcast('ai-status', { state: 'loading', modelId: selected.id });
        loadingPromise = call('load', { modelPath: selected.path })
            .then(() => { loadedModelId = selected.id; })
            .finally(() => {
                loadingPromise = null;
                broadcast('ai-status', { state: loadedModelId ? 'ready' : 'idle', modelId: loadedModelId });
            });
    }
    await loadingPromise;
    if (loadedModelId !== selected.id) return ensureModelLoaded();
}

async function unloadModel() {
    loadedModelId = null;
    if (worker) await call('unload');
    broadcast('ai-status', { state: 'idle', modelId: null });
}

function broadcast(channel, payload) {
    for (const win of BrowserWindow.getAllWindows()) {
        win.webContents.send(channel, payload);
    }
}

// ----------------------------------------------------------------- articles
async function loadArticleForChat(articleId) {
    const { models } = sequelize;
    const entity = await models.article.findByPk(articleId, {
        include: [
            { model: models.comment },
            { model: models.annotation },
            { model: models.tag, attributes: ['name'] },
            { model: models.owner, attributes: ['name'] },
            { model: models.category, attributes: ['name'] },
        ],
    });
    if (!entity) throw new Error('Article not found');
    return buildArticleText(entity.get({ plain: true }));
}

// ------------------------------------------------------------------- models
async function getOverview() {
    const { models, selectedId } = await store.list();
    return {
        catalog: MODEL_CATALOG,
        installed: models,
        selectedId,
        recommendedId: recommendedModelId(os.totalmem()),
        totalRamBytes: os.totalmem(),
        downloads: Object.fromEntries([...downloads].map(([id, d]) => [id, d.progress])),
        loadedModelId,
    };
}

function startDownload(catalogId) {
    const entry = getCatalogEntry(catalogId);
    if (!entry) throw new Error('Unknown model');
    if (downloads.has(catalogId)) return true;
    const controller = new AbortController();
    const d = { controller, progress: { phase: 'download', received: 0, total: entry.sizeBytes } };
    downloads.set(catalogId, d);
    downloadCatalogModel(catalogId, store.modelsDir, {
        signal: controller.signal,
        onProgress: (p) => {
            d.progress = p;
            broadcast('ai-download-progress', { catalogId, ...p });
        },
    })
        .then(async () => {
            await store.add({ id: entry.id, name: entry.name, file: entry.file, sizeBytes: entry.sizeBytes, source: 'catalog', sha256: entry.sha256 });
            broadcast('ai-download-progress', { catalogId, phase: 'complete' });
        })
        .catch((err) => {
            const cancelled = controller.signal.aborted;
            broadcast('ai-download-progress', { catalogId, phase: cancelled ? 'cancelled' : 'error', error: cancelled ? null : err.message });
        })
        .finally(() => downloads.delete(catalogId));
    return true;
}

function cancelDownload(catalogId) {
    downloads.get(catalogId)?.controller.abort();
    return true;
}

async function importModel() {
    const res = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [{ name: 'GGUF model', extensions: ['gguf'] }],
    });
    if (res.canceled || !res.filePaths[0]) return null;
    const src = res.filePaths[0];
    if (!(await isGgufFile(src))) throw new Error('NOT_GGUF');
    const file = safeImportedFileName(src);
    await fsp.mkdir(store.modelsDir, { recursive: true });
    // APFS clones the file instantly when possible instead of copying bytes.
    await fsp.copyFile(src, path.join(store.modelsDir, file), fsp.constants.COPYFILE_FICLONE);
    const { size } = await fsp.stat(src);
    const model = { id: `import:${file}`, name: file.replace(/\.gguf$/i, ''), file, sizeBytes: size, source: 'import' };
    await store.add(model);
    return model;
}

async function deleteModel(id) {
    if (id === loadedModelId) await unloadModel();
    await store.remove(id);
    return getOverview();
}

async function selectModel(id) {
    await store.select(id);
    if (loadedModelId && loadedModelId !== id) await unloadModel();
    return getOverview();
}

// --------------------------------------------------------------------- chat
async function sendChat(event, { requestId, conversationId, articleId, history, message }) {
    const sender = event.sender;
    const emit = (payload) => { if (!sender.isDestroyed()) sender.send('ai-chat-event', payload); };
    try {
        const { header, body } = await loadArticleForChat(articleId);
        await ensureModelLoaded();
        const result = await call('chat', {
            requestId,
            conversationId,
            header,
            body,
            history: Array.isArray(history) ? history.map((h) => ({ role: h.role === 'user' ? 'user' : 'model', text: String(h.text ?? '') })) : [],
            message: String(message ?? ''),
        }, emit);
        return { ok: true, text: result.text, aborted: result.aborted, truncated: result.truncated };
    } catch (err) {
        return { ok: false, error: err.message };
    }
}

async function cancelChat(requestId) {
    if (!worker) return false;
    return call('cancel', { targetRequestId: requestId });
}

async function resetConversation(conversationId) {
    if (!worker) return true;
    return call('resetConversation', { conversationId });
}

// --------------------------------------------------------------------- init
function initService() {
    store = createModelStore(path.join(app.getPath('userData'), 'models'));

    ipcMain.handle('ai/overview', () => getOverview());
    ipcMain.handle('ai/models/download', (e, catalogId) => startDownload(catalogId));
    ipcMain.handle('ai/models/cancelDownload', (e, catalogId) => cancelDownload(catalogId));
    ipcMain.handle('ai/models/import', () => importModel());
    ipcMain.handle('ai/models/delete', (e, id) => deleteModel(id));
    ipcMain.handle('ai/models/select', (e, id) => selectModel(id));
    ipcMain.handle('ai/models/unload', () => unloadModel());
    ipcMain.handle('ai/chat/send', (e, payload) => sendChat(e, payload));
    ipcMain.handle('ai/chat/cancel', (e, requestId) => cancelChat(requestId));
    ipcMain.handle('ai/chat/reset', (e, conversationId) => resetConversation(conversationId));

    app.on('will-quit', () => {
        for (const d of downloads.values()) d.controller.abort();
        worker?.kill();
    });

    console.info('AIService initialized');
}

export default { initService };
