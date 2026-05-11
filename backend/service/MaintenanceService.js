// MaintenanceService.
//
// DB-vs-disk consistency tools that don't belong to any single domain
// service. Currently exposes:
//
//   - maintenance/reapOrphanMedia: scans every image/audio/video row,
//     fs.stat()s the underlying file, and destroys rows whose file is
//     gone (ENOENT). Each destroy fires the existing afterDestroy hook
//     (-> sync_outbox op='delete') and bumps the parent article's
//     revision via articleService.touchArticleRevision so mobile's
//     article-upsert authoritative-media-set reconciliation stays
//     consistent.
//
// Why this exists: the media delete path is "unlink-then-destroy". If
// the destroy half ever fails (SQLITE_BUSY, hook error, ...), the file
// is gone but the row survives the rollback - producing an orphan row
// that breaks the bundle exporter (which now fails loudly on missing
// media files). This reaper is the cleanup pass.

import { ipcMain } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';

import { sequelize } from '../sequelize/index.js';
import { config } from '../config.js';
import articleService from './ArticleService.js';

const STAT_CONCURRENCY = 32;

function initService() {
    ipcMain.handle('maintenance/reapOrphanMedia', async () => await reapOrphanMedia());

    console.info('MaintenanceService initialized');
}

// Scans image/audio/video tables and destroys rows whose underlying
// file is missing on disk. Returns per-kind counters and a flat list
// of reaped rows for caller logging / UI feedback.
//
// Each reap runs in its own transaction so a single bad row (FK race,
// hook failure) does NOT abort the rest of the batch. Stats are run
// in batches of STAT_CONCURRENCY to keep cold-cache fs.stat latency
// reasonable on large libraries without thrashing the disk.
async function reapOrphanMedia({ concurrency = STAT_CONCURRENCY } = {}) {
    const result = {
        images: { scanned: 0, reaped: 0, errors: 0 },
        audios: { scanned: 0, reaped: 0, errors: 0 },
        videos: { scanned: 0, reaped: 0, errors: 0 },
        reapedDetails: [],
    };

    const kinds = [
        {
            kind: 'image',
            model: sequelize.models.image,
            folder: config.imagesFolderPath,
            bucket: result.images,
        },
        {
            kind: 'audio',
            model: sequelize.models.audio,
            folder: config.audiosFolderPath,
            bucket: result.audios,
        },
        {
            kind: 'video',
            model: sequelize.models.video,
            folder: config.videosFolderPath,
            bucket: result.videos,
        },
    ];

    for (const { kind, model, folder, bucket } of kinds) {
        let rows;
        try {
            rows = await model.findAll({
                attributes: ['id', 'path', 'articleId'],
                raw: true,
            });
        } catch (err) {
            console.error(`reapOrphanMedia: findAll failed for ${kind}:`, err);
            bucket.errors++;
            continue;
        }
        bucket.scanned = rows.length;

        for (let i = 0; i < rows.length; i += concurrency) {
            const batch = rows.slice(i, i + concurrency);

            // Parallel stat the batch. Each verdict says whether the
            // row is missing (ENOENT) or fine (or some other stat error
            // we should NOT treat as missing - e.g. EACCES, EBUSY).
            const verdicts = await Promise.all(batch.map(async (r) => {
                if (!r.path) {
                    // Row with NULL/empty path is corrupt enough that
                    // we treat it as an orphan: there is no file to
                    // protect, and leaving it around will keep
                    // breaking the exporter. Same downstream effect as
                    // ENOENT.
                    return { row: r, missing: true };
                }
                const absPath = path.join(folder, r.path);
                try {
                    await fs.stat(absPath);
                    return { row: r, missing: false };
                } catch (err) {
                    if (err && err.code === 'ENOENT') {
                        return { row: r, missing: true };
                    }
                    console.warn(
                        `reapOrphanMedia: stat failed for ${kind}#${r.id} `
                        + `at ${absPath}: ${err && err.message ? err.message : err}`
                    );
                    return { row: r, missing: false, statError: true };
                }
            }));

            for (const { row, missing, statError } of verdicts) {
                if (statError) bucket.errors++;
                if (!missing) continue;

                const tx = await sequelize.transaction();
                try {
                    // Re-fetch as a managed instance so destroy() fires
                    // the model's afterDestroy hook (sync_outbox).
                    // raw rows from findAll above are not Sequelize
                    // instances and won't trigger hooks on destroy.
                    const instance = await model.findByPk(row.id, { transaction: tx });
                    if (!instance) {
                        // Lost a race - row was deleted between scan
                        // and reap. Nothing to do.
                        await tx.rollback();
                        continue;
                    }
                    await instance.destroy({ transaction: tx });
                    // Bump the parent article so the next bundle
                    // upserts the article with the now-shrunken
                    // authoritative media set. Safe no-op if the
                    // article is already gone (UPDATE matches 0 rows).
                    await articleService.touchArticleRevision(row.articleId, { transaction: tx });
                    await tx.commit();
                    bucket.reaped++;
                    result.reapedDetails.push({
                        kind,
                        id: row.id,
                        articleId: row.articleId,
                        path: row.path,
                    });
                    console.warn(
                        `reapOrphanMedia: reaped ${kind}#${row.id} `
                        + `(articleId=${row.articleId}, path=${row.path})`
                    );
                } catch (err) {
                    try { await tx.rollback(); } catch (rollbackErr) {
                        console.error(
                            `reapOrphanMedia: rollback failed for ${kind}#${row.id}:`,
                            rollbackErr
                        );
                    }
                    bucket.errors++;
                    console.error(
                        `reapOrphanMedia: destroy failed for ${kind}#${row.id}:`,
                        err
                    );
                }
            }
        }
    }

    const totalScanned = result.images.scanned + result.audios.scanned + result.videos.scanned;
    const totalReaped = result.images.reaped + result.audios.reaped + result.videos.reaped;
    const totalErrors = result.images.errors + result.audios.errors + result.videos.errors;
    console.info(
        `maintenance/reapOrphanMedia: scanned=${totalScanned} reaped=${totalReaped} `
        + `errors=${totalErrors} `
        + `(images: ${result.images.scanned}/${result.images.reaped}/${result.images.errors}, `
        + `audios: ${result.audios.scanned}/${result.audios.reaped}/${result.audios.errors}, `
        + `videos: ${result.videos.scanned}/${result.videos.reaped}/${result.videos.errors})`
    );

    return result;
}

const MaintenanceService = {
    initService,
    reapOrphanMedia,
};

export default MaintenanceService;
