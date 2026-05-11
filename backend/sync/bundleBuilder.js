// Phase 3 bundle builder.
//
// Pure pipeline; consumes "shape-only" inputs prepared by SharingService
// and writes a single .blt zip to disk. No Sequelize knowledge here —
// the service is responsible for all DB reads + FK -> uuid mapping.
//
// Output bundle layout — Shape B (standard ZIP — see syncConstants.js and
// docs/mobile-sync-plan.md §6 + §4e):
//
//     <bundleFile>.blt          // standard ZIP from byte 0 (PK..); no prefix
//       ├── manifest.json       // MUST be first local entry; STORED (method 0); UTF-8
//       ├── operations.json     // { ops: Operation[] }
//       └── media/
//           ├── images/<uuid>.<ext>
//           ├── audios/<uuid>.<ext>
//           └── videos/<uuid>.<ext>
//
// manifest.json is only inside the ZIP (single source of truth). Mobile can
// read the manifest from the first local header + payload without inflating.
//
// Media is stored uncompressed (`store: true` per file). Recompressing
// JPEGs/MP3s/MP4s would burn CPU for negligible gain and risks lossy
// re-encoding paths if the source is already compressed.
//
// All ops sorted by APPLY_ORDER from backend/sync/types.js. Deletes
// interleave with their entity type — the receiver applies the per-type
// pass and dispatches on `type` ('upsert' vs 'delete').

import fs from 'fs/promises';
import { createReadStream, createWriteStream } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { v7 as uuidv7 } from 'uuid';
import archiver from 'archiver';

import {
    SYNC_FORMAT,
    SYNC_FORMAT_VERSION,
    SYNC_FILE_EXT,
    SYNC_SOURCE_APP,
    SYNC_SCHEMA_VERSION,
    SYNC_BUNDLE_LAYOUT_SHAPE_B_ZIP,
} from './syncConstants.js';
import { APPLY_ORDER } from './types.js';

// Sentinel revision used for auto-included deletes (see
// docs/mobile-sync-plan.md §3a step 4). The pointer-only outbox
// doesn't store a revision-at-time-of-delete, and the live row is gone,
// so we use INT32_MAX to ensure mobile applies the tombstone regardless
// of any prior revision it might have. uuids are never reused on
// desktop (hard-delete + uuidv7), so this sentinel can never collide
// with a future legitimate revision for the same uuid.
export const SENTINEL_DELETE_REVISION = 2147483647;

// Inputs:
//
//   articles               [{ id, uuid, revision, ...articleColumns,
//                            ownerUuid, categoryUuid,
//                            textTiptapJson, explanationTiptapJson, ... }]
//   owners, categories,
//   tags, groups            [{ uuid, revision, ...columns }]
//   comments                [{ uuid, revision, articleUuid, ownerUuid,
//                              tiptapTextJson, ... }]
//   annotations             [{ uuid, revision, articleUuid, ... }]
//   images, audios, videos  [{ uuid, revision, articleUuid,
//                              absSrcPath, ext,                // for media file copy
//                              ...columns }]
//   articleTagRels          [{ uuid, revision, articleUuid, tagUuid, tagOrdering }]
//   articleGroupRels        [{ uuid, revision, articleUuid, groupUuid, groupOrdering }]
//   articleArticleRels      [{ uuid, revision, articleUuid, relatedArticleUuid, relatedArticleOrdering }]
//   manualDeletes           [{ uuid, revision }]   - DeleteOp; revision = liveRev + 1
//   autoDeletes             [{ uuid }]             - DeleteOp; revision = SENTINEL_DELETE_REVISION
//   sourceAppVersion        string from electron app.getVersion()
//   outputDir               absolute path; bundle written under here
//   articleIdToMedia        Map<articleId, { id->uuid Map }>  for tiptap rewrite
//
// (Tiptap rewriting is done by SharingService before calling build();
// the article rows arrive with already-rewritten JSON. This keeps the
// builder pure.)
//
// Returns:
//
//   { filePath, bundleId, manifest, opCount, articleCount, sizeBytes }
export async function build(input) {
    const {
        articles = [],
        owners = [],
        categories = [],
        tags = [],
        groups = [],
        comments = [],
        annotations = [],
        images = [],
        audios = [],
        videos = [],
        articleTagRels = [],
        articleGroupRels = [],
        articleArticleRels = [],
        manualDeletes = [],
        autoDeletes = [],
        sourceAppVersion,
        outputDir,
    } = input;

    if (!outputDir) throw new Error('bundleBuilder.build: outputDir is required');

    const bundleId = uuidv7();

    // Build operations grouped by APPLY_ORDER. Deletes for `article` are
    // interleaved with article upserts so the receiver applies them in
    // the article-pass (it already dispatches on `op.type`).
    const opsByEntity = {};
    for (const e of APPLY_ORDER) opsByEntity[e] = [];

    for (const o of owners)     opsByEntity.owner.push(toUpsert('owner', o));
    for (const c of categories) opsByEntity.category.push(toUpsert('category', c));
    for (const t of tags)       opsByEntity.tag.push(toUpsert('tag', t));
    for (const g of groups)     opsByEntity.group.push(toUpsert('group', g));

    for (const a of articles)   opsByEntity.article.push(toUpsert('article', a));
    for (const md of manualDeletes) {
        opsByEntity.article.push({
            type: 'delete', entity: 'article',
            uuid: md.uuid, revision: md.revision,
        });
    }
    for (const ad of autoDeletes) {
        opsByEntity.article.push({
            type: 'delete', entity: 'article',
            uuid: ad.uuid, revision: SENTINEL_DELETE_REVISION,
        });
    }

    for (const c of comments)    opsByEntity.comment.push(toUpsert('comment', c));
    for (const a of annotations) opsByEntity.annotation.push(toUpsert('annotation', a));
    for (const i of images)      opsByEntity.image.push(toUpsert('image', stripMediaSourceFields(i)));
    for (const a of audios)      opsByEntity.audio.push(toUpsert('audio', stripMediaSourceFields(a)));
    for (const v of videos)      opsByEntity.video.push(toUpsert('video', stripMediaSourceFields(v)));

    for (const r of articleTagRels)     opsByEntity.articleTagRel.push(toUpsert('articleTagRel', r));
    for (const r of articleGroupRels)   opsByEntity.articleGroupRel.push(toUpsert('articleGroupRel', r));
    for (const r of articleArticleRels) opsByEntity.articleArticleRel.push(toUpsert('articleArticleRel', r));

    const ops = [];
    for (const e of APPLY_ORDER) ops.push(...opsByEntity[e]);

    const operationsJson = JSON.stringify({ ops }, jsonReplacer);
    const operationsBuffer = Buffer.from(operationsJson, 'utf-8');
    const operationsChecksum = sha256Hex(operationsBuffer);

    // Compute sha256 for each media file. Streamed read so we don't
    // double-buffer huge videos.
    const mediaFiles = [
        ...images.map((i) => ({ kind: 'images', uuid: i.uuid, ext: i.ext, absSrcPath: i.absSrcPath })),
        ...audios.map((a) => ({ kind: 'audios', uuid: a.uuid, ext: a.ext, absSrcPath: a.absSrcPath })),
        ...videos.map((v) => ({ kind: 'videos', uuid: v.uuid, ext: v.ext, absSrcPath: v.absSrcPath })),
    ];

    // Invariant: every image / audio / video upsert op has a matching
    // mediaFiles entry (and vice versa). Today this is true by
    // construction — both sides come from the same input arrays — but
    // an explicit assertion turns the convention into a guarantee that
    // any future "metadata-only" mode would have to break loudly rather
    // than silently shipping op-without-file pairs that would interpret
    // as "this attachment exists but its bytes are missing" on mobile.
    const mediaOpUuids = new Set([
        ...opsByEntity.image.map((o) => o.uuid),
        ...opsByEntity.audio.map((o) => o.uuid),
        ...opsByEntity.video.map((o) => o.uuid),
    ]);
    if (mediaFiles.length !== mediaOpUuids.size) {
        throw new Error(
            `bundleBuilder: media op count (${mediaOpUuids.size}) does not match `
            + `mediaFiles count (${mediaFiles.length})`
        );
    }
    for (const m of mediaFiles) {
        if (!mediaOpUuids.has(m.uuid)) {
            throw new Error(
                `bundleBuilder: mediaFiles entry for uuid ${m.uuid} has no matching upsert op`
            );
        }
    }
    {
        const mediaFileUuids = new Set(mediaFiles.map((m) => m.uuid));
        for (const u of mediaOpUuids) {
            if (!mediaFileUuids.has(u)) {
                throw new Error(
                    `bundleBuilder: media upsert op for uuid ${u} has no matching mediaFiles entry`
                );
            }
        }
    }

    // Pre-pass: stat + checksum every media file. We capture each file's
    // size and mtime here so writeShapeBZipBundle can re-verify just
    // before handing the file to archiver — that closes the race where a
    // media file is unlinked or rewritten between checksum and zip write
    // and we'd otherwise ship a manifest+ops referencing bytes that
    // aren't actually packed in the zip.
    //
    // A mismatched size between fs.stat and the streamed sha256 is also
    // fatal: it means the file was being modified during the checksum,
    // so the digest we'd record is meaningless.
    const mediaChecksums = {};
    let mediaTotalBytes = 0;
    for (const m of mediaFiles) {
        const stat = await fs.stat(m.absSrcPath);
        const { hex, size } = await sha256File(m.absSrcPath);
        if (size !== stat.size) {
            throw new Error(
                `bundleBuilder: media file changed during checksum: ${m.absSrcPath} `
                + `(stat=${stat.size}, sha256=${size})`
            );
        }
        mediaChecksums[m.uuid] = `sha256:${hex}`;
        mediaTotalBytes += size;
        m.expectedSize = size;
        m.expectedMtimeMs = stat.mtimeMs;
    }

    const articleUuidsInBundle = [
        ...articles.map((a) => a.uuid),
        ...manualDeletes.map((d) => d.uuid),
        ...autoDeletes.map((d) => d.uuid),
    ];

    const manifest = {
        format: SYNC_FORMAT,
        formatVersion: SYNC_FORMAT_VERSION,
        bundleId,
        createdAt: new Date().toISOString(),
        sourceApp: SYNC_SOURCE_APP,
        sourceAppVersion: sourceAppVersion || 'unknown',
        schemaVersion: SYNC_SCHEMA_VERSION,
        opCount: ops.length,
        mediaCount: mediaFiles.length,
        totalSizeBytes: operationsBuffer.length + mediaTotalBytes,
        operationsChecksum: `sha256:${operationsChecksum}`,
        mediaChecksums,
        articles: articleUuidsInBundle,
        partIndex: 1,
        partTotal: 1,
        bundleLayout: SYNC_BUNDLE_LAYOUT_SHAPE_B_ZIP,
    };

    const manifestBytes = Buffer.from(JSON.stringify(manifest, null, 2), 'utf-8');

    // Filename: bulutlar-YYYY-MM-DD-<bundleIdShort>.blt
    const today = new Date().toISOString().slice(0, 10);
    const bundleIdShort = bundleId.replace(/-/g, '').slice(0, 8);
    const fileName = `bulutlar-${today}-${bundleIdShort}${SYNC_FILE_EXT}`;
    const filePath = path.join(outputDir, fileName);

    await fs.mkdir(outputDir, { recursive: true });
    await writeShapeBZipBundle(filePath, {
        manifestBytes,
        operationsBuffer,
        mediaFiles,
    });

    const stats = await fs.stat(filePath);

    return {
        filePath,
        bundleId,
        manifest,
        opCount: ops.length,
        articleCount: articleUuidsInBundle.length,
        mediaCount: mediaFiles.length,
        sizeBytes: stats.size,
    };
}

// Wraps {entity, data} into an UpsertOp. `data` excludes the wire-format
// envelope fields the caller doesn't repeat in payload (uuid, revision,
// id). The caller-supplied row is whatever shape the service prepared
// (already FK-resolved, tiptap-rewritten, etc.).
function toUpsert(entity, row) {
    const { uuid, revision, id, createdAt, updatedAt, articleId, ownerId, categoryId, tagId, groupId, relatedArticleId, ...data } = row;
    return { type: 'upsert', entity, uuid, revision, data };
}

// Media `data` carries display fields only; absSrcPath/ext are
// in-memory plumbing for the file copy and must NOT travel in the wire
// format (would leak the desktop's filesystem layout — §3h / §4c).
function stripMediaSourceFields(row) {
    const { absSrcPath, ext, path: relPath, ...rest } = row;
    return rest;
}

// Defensive guard against the "folder-instead-of-file" bug: zip entry
// names use `/` as a directory separator, so an `ext` like `image/jpeg`
// silently turns `<uuid>.image/jpeg` into a folder containing a single
// file. SharingService normalizes this upstream, but the builder must
// also refuse anything that could re-introduce the bug.
function sanitizeMediaExt(ext) {
    if (typeof ext !== 'string') return '';
    const trimmed = ext.trim().replace(/^\.+/, '');
    if (!trimmed) return '';
    if (!/^[A-Za-z0-9]{1,8}$/.test(trimmed)) return '';
    return trimmed.toLowerCase();
}

// Replacer that:
//   - drops `undefined` (JSON.stringify already does this for object props)
//   - converts Date instances to ISO strings (sequelize gives us Date
//     objects for DATETIME columns)
function jsonReplacer(_key, value) {
    if (value instanceof Date) return value.toISOString();
    return value;
}

function sha256Hex(buffer) {
    return crypto.createHash('sha256').update(buffer).digest('hex');
}

async function sha256File(absPath) {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash('sha256');
        let size = 0;
        const stream = createReadStream(absPath);
        stream.on('data', (chunk) => { size += chunk.length; hash.update(chunk); });
        stream.on('end', () => resolve({ hex: hash.digest('hex'), size }));
        stream.on('error', reject);
    });
}

// Streams a Shape B .blt: one standard ZIP (`store: true` for all entries).
// First appended entry is manifest.json so it is first in local (stream)
// order and remains STORED (method 0). Bundles can be hundreds of MB; the
// zip flows through archiver without buffering the payload in memory.
//
// Every `'warning'` from archiver (including the previously-ignored
// ENOENT case) is fatal: every entry we hand to archive.file came from
// `mediaFiles`, whose existence + size + mtime were validated in the
// sha256 pre-pass. Anything wrong at zip time means the media set we
// recorded into the manifest no longer matches what the zip actually
// contains, which would silently violate the article-as-authoritative-
// media-set contract on the receiver.
async function writeShapeBZipBundle(filePath, { manifestBytes, operationsBuffer, mediaFiles }) {
    return new Promise((resolve, reject) => {
        const output = createWriteStream(filePath);
        const archive = archiver('zip', { store: true });

        let finalized = false;
        const cleanup = () => {
            if (finalized) return;
            finalized = true;
            try { output.destroy(); } catch (_) { /* ignore */ }
        };

        output.on('close', () => resolve());
        output.on('error', (err) => { cleanup(); reject(err); });
        archive.on('error', (err) => { cleanup(); reject(err); });
        archive.on('warning', (err) => { cleanup(); reject(err); });

        archive.pipe(output);

        archive.append(manifestBytes, { name: 'manifest.json' });

        // Re-stat each media file just before queuing it for the zip
        // stream and reject on any mismatch with the sha256 pre-pass.
        // Caveat: archiver opens the file asynchronously inside
        // finalize(), so a sub-microsecond unlink window still exists;
        // the warning handler above catches that case and rejects too.
        const queueMedia = async () => {
            for (const m of mediaFiles) {
                let stat;
                try {
                    stat = await fs.stat(m.absSrcPath);
                } catch (err) {
                    throw new Error(
                        `bundleBuilder: media file disappeared between sha256 and archive: `
                        + `${m.absSrcPath}: ${err.message}`
                    );
                }
                if (stat.size !== m.expectedSize || stat.mtimeMs !== m.expectedMtimeMs) {
                    throw new Error(
                        `bundleBuilder: media file changed between sha256 and archive: `
                        + `${m.absSrcPath} (size ${m.expectedSize}->${stat.size}, `
                        + `mtimeMs ${m.expectedMtimeMs}->${stat.mtimeMs})`
                    );
                }
                const ext = sanitizeMediaExt(m.ext);
                const dot = ext ? `.${ext}` : '';
                archive.file(m.absSrcPath, { name: `media/${m.kind}/${m.uuid}${dot}` });
            }
            archive.append(operationsBuffer, { name: 'operations.json' });
            await archive.finalize();
        };

        queueMedia().catch((err) => { cleanup(); reject(err); });
    });
}
