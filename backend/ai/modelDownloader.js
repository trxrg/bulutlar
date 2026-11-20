// The ONLY AI module allowed to use the network (see aiNoNetwork.test.js).
//
// It downloads a public GGUF file for a curated catalog entry. The request is
// a plain HTTPS GET of a pinned URL: no article content, prompts, user
// identifiers or telemetry are ever sent. Downloads resume from a `.part`
// file and are accepted only when their SHA-256 matches the catalog.

import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { getCatalogEntry } from './modelCatalog.js';

const ALLOWED_HOST = 'huggingface.co';

export async function sha256File(filePath, onProgress) {
    const total = (await fsp.stat(filePath)).size;
    const hash = crypto.createHash('sha256');
    let done = 0;
    await pipeline(
        fs.createReadStream(filePath, { highWaterMark: 4 * 1024 * 1024 }),
        new Transform({
            transform(chunk, _enc, cb) {
                hash.update(chunk);
                done += chunk.length;
                onProgress?.(done, total);
                cb();
            },
        }),
    );
    return hash.digest('hex');
}

/**
 * @param {string} catalogId
 * @param {string} modelsDir
 * @param {{ signal?: AbortSignal, onProgress?: (p: {phase: string, received: number, total: number}) => void }} opts
 * @returns {Promise<string>} absolute path of the verified model file
 */
export async function downloadCatalogModel(catalogId, modelsDir, { signal, onProgress } = {}) {
    const entry = getCatalogEntry(catalogId);
    if (!entry) throw new Error(`Unknown model: ${catalogId}`);

    const url = new URL(entry.url);
    if (url.protocol !== 'https:' || url.hostname !== ALLOWED_HOST) {
        throw new Error('Catalog URL is not an allowed host');
    }

    await fsp.mkdir(modelsDir, { recursive: true });
    const finalPath = path.join(modelsDir, entry.file);
    const partPath = `${finalPath}.part`;

    let startAt = 0;
    try {
        startAt = (await fsp.stat(partPath)).size;
    } catch { /* fresh download */ }

    const headers = { Accept: 'application/octet-stream' };
    if (startAt > 0) headers.Range = `bytes=${startAt}-`;

    // Redirects go to Hugging Face's own CDN; fetch keeps the Range header.
    const res = await fetch(url, { headers, signal, redirect: 'follow', credentials: 'omit', referrerPolicy: 'no-referrer' });
    if (res.status === 416) {
        // .part already holds the whole file
    } else if (!res.ok) {
        throw new Error(`Download failed: HTTP ${res.status}`);
    } else {
        const resumed = res.status === 206;
        if (!resumed) startAt = 0;
        const length = Number(res.headers.get('content-length')) || 0;
        const total = length ? startAt + length : entry.sizeBytes;
        let received = startAt;
        let lastReport = 0;
        const counter = new Transform({
            transform(chunk, _enc, cb) {
                received += chunk.length;
                const now = Date.now();
                if (now - lastReport > 250) {
                    lastReport = now;
                    onProgress?.({ phase: 'download', received, total });
                }
                cb(null, chunk);
            },
        });
        await pipeline(
            Readable.fromWeb(res.body),
            counter,
            fs.createWriteStream(partPath, { flags: resumed ? 'a' : 'w' }),
            { signal },
        );
        onProgress?.({ phase: 'download', received, total });
    }

    onProgress?.({ phase: 'verify', received: 0, total: 1 });
    let lastVerify = 0;
    const digest = await sha256File(partPath, (done, total) => {
        const now = Date.now();
        if (now - lastVerify > 250) {
            lastVerify = now;
            onProgress?.({ phase: 'verify', received: done, total });
        }
    });
    if (digest !== entry.sha256) {
        await fsp.rm(partPath, { force: true });
        throw new Error('Checksum mismatch: the downloaded file was discarded');
    }
    await fsp.rename(partPath, finalPath);
    return finalPath;
}
