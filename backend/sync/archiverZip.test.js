/**
 * @vitest-environment node
 */
import fs from 'fs';
import os from 'os';
import path from 'path';
import { createWriteStream } from 'fs';
import { PassThrough } from 'stream';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import JSZip from 'jszip';
import { createStoreZipArchive } from './createStoreZipArchive.js';
import {
    readLocalZipEntries,
    assertAllLocalEntriesUtf8,
    assertAllLocalEntriesStored,
    readStoredEntryPayload,
} from './zipLocalHeaders.js';

const TURKISH_AUDIO = 'audios/Türkçe ses, vol1.m4a';

function writeZipToBuffer(buildArchive) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        const archive = createStoreZipArchive();
        const passthrough = new PassThrough();

        passthrough.on('data', (chunk) => chunks.push(chunk));
        passthrough.on('error', reject);
        passthrough.on('end', () => resolve(Buffer.concat(chunks)));
        archive.on('error', reject);
        archive.on('warning', reject);
        archive.pipe(passthrough);

        Promise.resolve(buildArchive(archive))
            .then(() => archive.finalize())
            .catch(reject);
    });
}

async function writeZipToFile(filePath, buildArchive) {
    await new Promise((resolve, reject) => {
        const output = createWriteStream(filePath);
        const archive = createStoreZipArchive();
        output.on('close', resolve);
        output.on('error', reject);
        archive.on('error', reject);
        archive.on('warning', reject);
        archive.pipe(output);
        Promise.resolve(buildArchive(archive))
            .then(() => archive.finalize())
            .catch(reject);
    });
    return fs.readFileSync(filePath);
}

describe('archiver zip export (Bulutlar load-bearing behavior)', () => {
    let tmpDir;

    beforeEach(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bulutlar-archiver-test-'));
    });

    afterEach(() => {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    it('sets UTF-8 GP bit 11 on non-ASCII entry names (mobile path lookup)', async () => {
        const buf = await writeZipToBuffer((archive) => {
            archive.append(Buffer.from('dummy audio bytes'), { name: TURKISH_AUDIO });
        });

        const entries = readLocalZipEntries(buf);
        expect(entries).toHaveLength(1);
        expect(entries[0].name).toBe(TURKISH_AUDIO);
        assertAllLocalEntriesUtf8(entries, TURKISH_AUDIO);
    });

    it('uses STORED compression (method 0) when store: true', async () => {
        const payload = Buffer.from('already-compressed media bytes');
        const buf = await writeZipToBuffer((archive) => {
            archive.append(payload, { name: 'media/images/018f3a2b-7c3d-7000-8000-000000000001.jpg' });
        });

        const entries = readLocalZipEntries(buf);
        assertAllLocalEntriesStored(entries);
        expect(readStoredEntryPayload(buf, entries[0].name).equals(payload)).toBe(true);
    });

    it('places manifest.json as the first local entry (Shape B .blt layout)', async () => {
        const manifest = Buffer.from(JSON.stringify({ format: 'bulutlar-sync', version: 1 }));
        const operations = Buffer.from(JSON.stringify({ ops: [] }));
        const media = Buffer.from('jpeg-bytes');

        const buf = await writeZipToBuffer((archive) => {
            archive.append(manifest, { name: 'manifest.json' });
            archive.append(media, {
                name: 'media/images/018f3a2b-7c3d-7000-8000-000000000001.jpg',
            });
            archive.append(operations, { name: 'operations.json' });
        });

        const entries = readLocalZipEntries(buf);
        expect(entries.map((e) => e.name)).toEqual([
            'manifest.json',
            'media/images/018f3a2b-7c3d-7000-8000-000000000001.jpg',
            'operations.json',
        ]);
        assertAllLocalEntriesStored(entries);
        expect(readStoredEntryPayload(buf, 'manifest.json').equals(manifest)).toBe(true);
    });

    it('round-trips entry bytes through JSZip (receiver-style read)', async () => {
        const dbBytes = Buffer.from('sqlite-bytes');
        const mediaBytes = Buffer.from('audio-bytes');
        const zipPath = path.join(tmpDir, 'mobile-import.zip');

        const buf = await writeZipToFile(zipPath, (archive) => {
            archive.append(dbBytes, { name: 'content.db' });
            archive.append(mediaBytes, { name: TURKISH_AUDIO });
        });

        assertAllLocalEntriesUtf8(readLocalZipEntries(buf));

        const zip = await JSZip.loadAsync(buf);
        expect(await zip.file('content.db').async('nodebuffer')).toEqual(dbBytes);
        expect(await zip.file(TURKISH_AUDIO).async('nodebuffer')).toEqual(mediaBytes);
    });

    it('rejects when a queued file is missing at finalize time', async () => {
        const missing = path.join(tmpDir, 'does-not-exist.bin');
        const zipPath = path.join(tmpDir, 'bad.zip');

        await expect(new Promise((resolve, reject) => {
            const output = createWriteStream(zipPath);
            const archive = createStoreZipArchive();
            const fail = (err) => {
                try { output.destroy(); } catch (_) { /* ignore */ }
                reject(err);
            };
            output.on('close', resolve);
            output.on('error', fail);
            archive.on('error', fail);
            archive.on('warning', fail);
            archive.pipe(output);
            archive.file(missing, { name: 'media/images/missing.jpg' });
            archive.finalize().catch(fail);
        })).rejects.toMatchObject({ code: 'ENOENT' });
    });
});
