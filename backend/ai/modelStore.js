// Local bookkeeping for installed models: a small manifest in the models
// folder plus helpers to import and delete GGUF files. Filesystem only.

import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';

const MANIFEST = 'models.json';

export function createModelStore(modelsDir) {
    const manifestPath = path.join(modelsDir, MANIFEST);

    async function read() {
        try {
            const data = JSON.parse(await fsp.readFile(manifestPath, 'utf8'));
            return { models: data.models || [], selectedId: data.selectedId || null };
        } catch {
            return { models: [], selectedId: null };
        }
    }

    async function write(state) {
        await fsp.mkdir(modelsDir, { recursive: true });
        const tmp = `${manifestPath}.tmp`;
        await fsp.writeFile(tmp, JSON.stringify(state, null, 2));
        await fsp.rename(tmp, manifestPath);
    }

    async function list() {
        const state = await read();
        // Drop entries whose file was removed outside the app.
        const models = state.models.filter((m) => fs.existsSync(path.join(modelsDir, m.file)));
        const selectedId = models.some((m) => m.id === state.selectedId) ? state.selectedId : null;
        if (models.length !== state.models.length || selectedId !== state.selectedId) {
            await write({ models, selectedId });
        }
        return { models, selectedId };
    }

    async function add(model) {
        const state = await read();
        const models = state.models.filter((m) => m.id !== model.id);
        models.push(model);
        await write({ models, selectedId: state.selectedId || model.id });
    }

    async function remove(id) {
        const state = await read();
        const model = state.models.find((m) => m.id === id);
        if (!model) return;
        await fsp.rm(path.join(modelsDir, model.file), { force: true });
        const models = state.models.filter((m) => m.id !== id);
        await write({ models, selectedId: state.selectedId === id ? (models[0]?.id || null) : state.selectedId });
    }

    async function select(id) {
        const state = await read();
        if (!state.models.some((m) => m.id === id)) throw new Error('Model not installed');
        await write({ ...state, selectedId: id });
    }

    async function getSelected() {
        const { models, selectedId } = await list();
        const model = models.find((m) => m.id === selectedId);
        return model ? { ...model, path: path.join(modelsDir, model.file) } : null;
    }

    return { modelsDir, list, add, remove, select, getSelected };
}

export async function isGgufFile(filePath) {
    const fh = await fsp.open(filePath, 'r');
    try {
        const buf = Buffer.alloc(4);
        await fh.read(buf, 0, 4, 0);
        return buf.toString('ascii') === 'GGUF';
    } finally {
        await fh.close();
    }
}

export function safeImportedFileName(srcPath) {
    const base = path.basename(srcPath).replace(/[^\w.\-]+/g, '_');
    return base.toLowerCase().endsWith('.gguf') ? base : `${base}.gguf`;
}
