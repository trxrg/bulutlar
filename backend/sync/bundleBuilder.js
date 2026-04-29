// Phase 3 bundle builder.
//
// Pure pipeline; consumes "shape-only" inputs prepared by SharingService
// and writes a single .blt zip to disk. No Sequelize knowledge here —
// the service is responsible for all DB reads + FK -> uuid mapping.
//
// Output bundle layout (locked by docs/mobile-sync-plan.md §6):
//
//     <bundleFile>.blt        (zip; .blt extension never .zip)
//       ├── manifest.json      (last entry written; receiver reads first)
//       ├── operations.json    ({ ops: Operation[] })
//       └── media/
//           ├── images/<uuid>.<ext>
//           ├── audios/<uuid>.<ext>
//           └── videos/<uuid>.<ext>
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

    const mediaChecksums = {};
    let mediaTotalBytes = 0;
    for (const m of mediaFiles) {
        const { hex, size } = await sha256File(m.absSrcPath);
        mediaChecksums[m.uuid] = `sha256:${hex}`;
        mediaTotalBytes += size;
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
    };

    const manifestJson = JSON.stringify(manifest, null, 2);

    // Filename: bulutlar-YYYY-MM-DD-<bundleIdShort>.blt
    const today = new Date().toISOString().slice(0, 10);
    const bundleIdShort = bundleId.replace(/-/g, '').slice(0, 8);
    const fileName = `bulutlar-${today}-${bundleIdShort}${SYNC_FILE_EXT}`;
    const filePath = path.join(outputDir, fileName);

    await fs.mkdir(outputDir, { recursive: true });
    await writeZip(filePath, {
        operationsBuffer,
        manifestJson,
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

// Single archiver pipeline that streams everything to the output file.
// Order matters only for downstream readers that scan the central
// directory backwards; we still write manifest LAST so a forward-only
// reader doesn't need to know the layout up front.
async function writeZip(filePath, { operationsBuffer, manifestJson, mediaFiles }) {
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
        archive.on('warning', (err) => {
            if (err && err.code === 'ENOENT') console.warn('archive warning:', err);
            else { cleanup(); reject(err); }
        });

        archive.pipe(output);

        for (const m of mediaFiles) {
            const ext = m.ext ? `.${m.ext}` : '';
            archive.file(m.absSrcPath, { name: `media/${m.kind}/${m.uuid}${ext}` });
        }
        archive.append(operationsBuffer, { name: 'operations.json' });
        archive.append(manifestJson, { name: 'manifest.json' });

        archive.finalize().catch((err) => { cleanup(); reject(err); });
    });
}
