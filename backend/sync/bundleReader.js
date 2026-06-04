// Reads and validates a Shape B .blt bundle (see bundleBuilder.js for the
// writer and types.js / syncConstants.js for the on-disk contract).
//
// A .blt is a plain ZIP containing:
//     manifest.json         (first entry, STORED, UTF-8)
//     operations.json       ({ ops: Operation[] })
//     media/{images,audios,videos}/<uuid>.<ext>
//
// This module is the symmetric counterpart of bundleBuilder.build(): it
// turns the file on disk back into { manifest, ops, media accessor } and
// re-verifies the operations checksum so a truncated / tampered bundle
// fails loudly before the applier touches the DB.
//
// jszip is used (a production transitive dependency, pinned directly in
// package.json) — it loads the archive into memory and inflates entries on
// demand. STORED media entries are returned as raw buffers without a copy
// through zlib. For the bundle sizes desktop sharing produces this is fine;
// if multi-GB media bundles ever become common, swap to a streaming reader.

import fs from 'fs/promises';
import crypto from 'crypto';
import JSZip from 'jszip';

import { SYNC_FORMAT } from './syncConstants.js';

// Matches `media/<kind>/<uuid>` with an optional `.<ext>` suffix. Capture
// groups: 1=kind, 2=uuid, 3=ext (may be undefined).
const MEDIA_ENTRY_RE = /^media\/(images|audios|videos)\/([^/]+?)(?:\.([^./]+))?$/;

// Reads a .blt from `filePath` and returns:
//   {
//     manifest,                 parsed manifest.json
//     ops,                      Operation[] from operations.json
//     mediaIndex,               Map<uuid, { kind, ext }>
//     getMediaBuffer(uuid),     async () => Buffer | null
//   }
//
// Throws a descriptive Error if the file is not a recognizable .blt.
export async function readBundle(filePath) {
    let raw;
    try {
        raw = await fs.readFile(filePath);
    } catch (err) {
        throw new Error(`Cannot read bundle file ${filePath}: ${err.message}`);
    }

    let zip;
    try {
        zip = await JSZip.loadAsync(raw);
    } catch (err) {
        throw new Error(`Not a valid .blt archive (${filePath}): ${err.message}`);
    }

    // --- manifest.json ---
    const manifestEntry = zip.file('manifest.json');
    if (!manifestEntry) {
        throw new Error('Invalid .blt: manifest.json not found in archive');
    }
    let manifest;
    try {
        manifest = JSON.parse(await manifestEntry.async('string'));
    } catch (err) {
        throw new Error(`Invalid .blt: manifest.json is not valid JSON: ${err.message}`);
    }
    if (manifest.format !== SYNC_FORMAT) {
        throw new Error(`Invalid .blt: unexpected format "${manifest.format}" (expected "${SYNC_FORMAT}")`);
    }

    // --- operations.json (+ checksum verification) ---
    const opsEntry = zip.file('operations.json');
    if (!opsEntry) {
        throw new Error('Invalid .blt: operations.json not found in archive');
    }
    const opsBuf = await opsEntry.async('nodebuffer');
    if (typeof manifest.operationsChecksum === 'string' && manifest.operationsChecksum.startsWith('sha256:')) {
        const hex = crypto.createHash('sha256').update(opsBuf).digest('hex');
        if (`sha256:${hex}` !== manifest.operationsChecksum) {
            throw new Error('Invalid .blt: operations.json checksum mismatch (bundle is corrupt or truncated)');
        }
    }
    let parsedOps;
    try {
        parsedOps = JSON.parse(opsBuf.toString('utf-8'));
    } catch (err) {
        throw new Error(`Invalid .blt: operations.json is not valid JSON: ${err.message}`);
    }
    const ops = Array.isArray(parsedOps?.ops) ? parsedOps.ops : [];

    // --- media index ---
    // Build uuid -> { kind, ext } from the actual entry names so the applier
    // doesn't have to reconstruct the on-disk extension from op.data (which
    // it can't do reliably — the writer derived the ext from the original
    // filename or MIME subtype).
    const mediaIndex = new Map();
    zip.forEach((relPath, entry) => {
        if (entry.dir) return;
        const m = MEDIA_ENTRY_RE.exec(relPath);
        if (m) {
            mediaIndex.set(m[2], { kind: m[1], ext: m[3] || '' });
        }
    });

    const getMediaBuffer = async (uuid) => {
        const meta = mediaIndex.get(uuid);
        if (!meta) return null;
        const dot = meta.ext ? `.${meta.ext}` : '';
        const entry = zip.file(`media/${meta.kind}/${uuid}${dot}`);
        if (!entry) return null;
        return entry.async('nodebuffer');
    };

    return { manifest, ops, mediaIndex, getMediaBuffer };
}
