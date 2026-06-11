// Phase 3: SharingService.
//
// Two public IPC entry points:
//   - sharing/getCandidates: classifies live articles into
//     {created, updated, unchanged} + a read-only {deleted} summary so
//     the modal can render the dual-list picker. Source of truth:
//     §10.6 coalesce restricted to entityType='article', joined with
//     `exported_bundle_articles` (the "previously shared" oracle).
//   - sharing/exportBundle: builds a .blt for the chosen articles,
//     transactionally writes `exported_bundles` + `exported_bundle_articles`
//     and stamps `sync_outbox.exportedAt` for every participating row.
//
// All Sequelize knowledge lives here; bundleBuilder.js is pure.

import { ipcMain, app, shell, dialog } from 'electron';
import { Op, QueryTypes } from 'sequelize';
import path from 'path';

import { sequelize } from '../sequelize/index.js';
import { config } from '../config.js';
import { coalescePending, snapshotOutboxMaxId } from '../sync/coalesce.js';
import { rewriteTiptap } from '../sync/tiptapRewrite.js';
import { stripMediaFromTiptapDoc, stripMediaFromDraftRaw, stripMediaFromHtml } from '../sync/mediaContentFilter.js';
import { build as buildBundle } from '../sync/bundleBuilder.js';
import { readBundle } from '../sync/bundleReader.js';
import { applyBundle } from '../sync/applyBundle.js';
import { pickMediaExt } from '../sync/mediaPath.js';
import { mainWindow } from '../main.js';
import storeService from './StoreService.js';

function assertSharingAdmin() {
    if (!storeService.isSharingAdminEnabled()) {
        throw new Error('Sharing is not enabled');
    }
}

function initService() {
    ipcMain.handle('sharing/getCandidates', async () => {
        assertSharingAdmin();
        return await getCandidates();
    });
    ipcMain.handle('sharing/getLastExport', async () => {
        assertSharingAdmin();
        return await getLastExport();
    });
    ipcMain.handle('sharing/exportBundle', async (_event, picks) => {
        assertSharingAdmin();
        return await exportBundle(picks);
    });
    ipcMain.handle('sharing/exportSingleArticleBundle', async (_event, picks) => {
        assertSharingAdmin();
        return await exportSingleArticleBundle(picks);
    });
    ipcMain.handle('sharing/chooseOutputDir', async (_event, opts) => {
        assertSharingAdmin();
        return await chooseOutputDir(opts);
    });
    ipcMain.handle('sharing/showInFolder', async (_event, filePath) => {
        assertSharingAdmin();
        if (typeof filePath !== 'string' || filePath.length === 0) return false;
        try { shell.showItemInFolder(filePath); return true; }
        catch (err) { console.warn('sharing/showInFolder failed:', err); return false; }
    });

    // Import is the consumer side of sharing and is intentionally NOT gated
    // behind admin/sharing mode — any user can pull a .blt into their library.
    ipcMain.handle('sharing/chooseBundleFile', async () => {
        return await chooseBundleFile();
    });
    ipcMain.handle('sharing/importBundle', async (_event, filePath) => {
        const target = typeof filePath === 'string' && filePath.length > 0
            ? filePath
            : await chooseBundleFile();
        if (!target) return null; // user cancelled the dialog
        return await importBundleFromPath(target);
    });

    console.info('SharingService initialized');
}

// Prompt the user to pick a .blt file to import. Returns the absolute path
// or null if cancelled.
async function chooseBundleFile() {
    const defaultPath = (() => {
        try { return app.getPath('downloads'); } catch { return undefined; }
    })();
    const result = await dialog.showOpenDialog(mainWindow, {
        title: 'Choose a Bulutlar bundle (.blt) to import',
        defaultPath,
        properties: ['openFile'],
        filters: [{ name: 'Bulutlar Archive', extensions: ['blt'] }],
    });
    if (result.canceled || !result.filePaths || result.filePaths.length === 0) return null;
    return result.filePaths[0];
}

// Reads, validates, and applies a .blt at `filePath` to the live DB. Shared
// by the Settings "import" button and the OS file-open (click-to-open) flow
// wired in main.js. Throws on a malformed/corrupt bundle so the caller can
// surface the error.
export async function importBundleFromPath(filePath) {
    console.info('Importing .blt bundle from', filePath);
    const bundle = await readBundle(filePath);
    const summary = await applyBundle(sequelize, config, bundle);
    console.info('Bundle import complete:', JSON.stringify(summary));
    return summary;
}

// Prompt the user to pick a destination directory for the .blt file.
// Returns the absolute path or null if the dialog was cancelled.
async function chooseOutputDir(opts = {}) {
    const defaultPath = (() => {
        try { return app.getPath('downloads'); } catch { return undefined; }
    })();
    const result = await dialog.showOpenDialog(mainWindow, {
        title: opts.title || 'Choose folder for bundle (.blt)',
        defaultPath,
        properties: ['openDirectory', 'createDirectory'],
        buttonLabel: opts.buttonLabel,
    });
    if (result.canceled || !result.filePaths || result.filePaths.length === 0) return null;
    return result.filePaths[0];
}

// =====================================================================
// getCandidates
// =====================================================================

async function getCandidates() {
    const lastExport = await getLastExport();

    // §10.6 coalesce restricted to articles. We DON'T pass maxOutboxId
    // here — getCandidates doesn't mutate outbox so a snapshot bound is
    // unnecessary; reads naturally see whatever the latest committed
    // state is.
    const pending = await coalescePending(sequelize, { entityTypes: ['article'] });

    const pendingByUuid = new Map();
    for (const p of pending) pendingByUuid.set(p.uuid, p);

    // Fast lookup for "previously shared".
    const sharedSet = await loadSharedArticleUuidSet();

    // Live articles needed for created/updated rows + unchanged listing.
    // Pull both in one query for simplicity; partition in memory.
    const liveArticles = await sequelize.models.article.findAll({
        attributes: ['id', 'uuid', 'title', 'date', 'updatedAt', 'ownerId', 'categoryId'],
        order: [['updatedAt', 'DESC']],
    });

    // Pre-resolve owners and categories for display (single batched read).
    const ownerIds = [...new Set(liveArticles.map((a) => a.ownerId).filter((x) => x != null))];
    const categoryIds = [...new Set(liveArticles.map((a) => a.categoryId).filter((x) => x != null))];

    const owners = ownerIds.length
        ? await sequelize.models.owner.findAll({ where: { id: { [Op.in]: ownerIds } }, attributes: ['id', 'name'] })
        : [];
    const categories = categoryIds.length
        ? await sequelize.models.category.findAll({ where: { id: { [Op.in]: categoryIds } }, attributes: ['id', 'name'] })
        : [];
    const ownerNameById = new Map(owners.map((o) => [o.id, o.name]));
    const categoryNameById = new Map(categories.map((c) => [c.id, c.name]));

    const created = [];
    const updated = [];
    const unchanged = [];

    for (const a of liveArticles) {
        const view = {
            uuid: a.uuid,
            title: a.title,
            date: a.date,
            updatedAt: a.updatedAt,
            ownerName: ownerNameById.get(a.ownerId) || null,
            categoryName: categoryNameById.get(a.categoryId) || null,
        };

        const p = pendingByUuid.get(a.uuid);
        if (!p) {
            unchanged.push(view);
        } else if (p.finalOp === 'delete') {
            // Edge case: outbox says delete but live row still exists.
            // Treat as unchanged for display purposes (the upcoming
            // delete will still be auto-included via the `deleted`
            // section). In practice this only happens during a brief
            // window mid-cascade; refresh resolves it.
            unchanged.push(view);
        } else if (sharedSet.has(a.uuid)) {
            updated.push(view);
        } else {
            created.push(view);
        }
    }

    // Deleted articles: pending rows with finalOp='delete'. The live
    // row is gone (hard-delete on desktop), so we have no title. We
    // surface only count + delete timestamp so the modal can render
    // the auto-included read-only summary.
    const deletedRows = pending.filter((p) => p.finalOp === 'delete');
    const deletedTimestamps = deletedRows.length
        ? await loadDeleteTimestamps(deletedRows.map((d) => d.uuid))
        : new Map();

    const deletedItems = deletedRows.map((d) => ({
        uuid: d.uuid,
        deletedAt: deletedTimestamps.get(d.uuid) || null,
    }));

    return {
        lastExport,
        created,
        updated,
        unchanged,
        deleted: { count: deletedItems.length, items: deletedItems },
    };
}

async function getLastExport() {
    const ExportedBundle = sequelize.models.exportedBundle;
    const row = await ExportedBundle.findOne({
        order: [['createdAt', 'DESC']],
        attributes: ['bundleId', 'createdAt', 'opCount', 'articleCount', 'sizeBytes'],
    });
    return row ? row.dataValues : null;
}

async function loadSharedArticleUuidSet({ transaction } = {}) {
    const rows = await sequelize.models.exportedBundleArticle.findAll({
        attributes: [[sequelize.fn('DISTINCT', sequelize.col('articleUuid')), 'articleUuid']],
        raw: true,
        transaction,
    });
    return new Set(rows.map((r) => r.articleUuid));
}

// For a list of article uuids that have been hard-deleted, return the
// most recent outbox createdAt for op='delete' as the "deletedAt"
// display value. The pointer-only outbox doesn't store payload, but
// createdAt timestamps are good enough for "deleted X minutes ago".
async function loadDeleteTimestamps(uuids) {
    if (uuids.length === 0) return new Map();
    const rows = await sequelize.query(
        `SELECT uuid, MAX(createdAt) AS deletedAt
         FROM sync_outbox
         WHERE entityType = 'article' AND op = 'delete' AND uuid IN (:uuids)
         GROUP BY uuid`,
        { type: QueryTypes.SELECT, replacements: { uuids } }
    );
    return new Map(rows.map((r) => [r.uuid, r.deletedAt]));
}

// =====================================================================
// exportBundle
// =====================================================================

async function exportBundle(picks) {
    const latestState = Array.isArray(picks?.latestState) ? picks.latestState : [];
    const manualDelete = Array.isArray(picks?.manualDelete) ? picks.manualDelete : [];
    const requestedOutputDir = typeof picks?.outputDir === 'string' && picks.outputDir.length > 0
        ? picks.outputDir
        : null;

    const overlap = new Set(latestState).size + manualDelete.length
        - new Set([...latestState, ...manualDelete]).size;
    if (overlap > 0) {
        throw new Error('exportBundle: latestState and manualDelete must be disjoint');
    }

    if (latestState.length === 0 && manualDelete.length === 0) {
        // Auto-deletes alone are allowed (a bundle that's just tombstones).
        // Caller may invoke with both empty if there are pending
        // article-deletes; we'll detect and proceed below.
    }

    // ==================================================================
    // Read phase — wrapped in a single transaction so every findAll sees
    // a consistent snapshot of the desktop DB. Without this, a concurrent
    // write between the article load and the media load could ship an
    // article upsert with an empty media set, which mobile's reconciliation
    // pass would interpret as "this article has zero attachments" and wipe
    // every local image / audio / video for that article.
    //
    // Committed (not rolled back) before the heavy file-I/O build phase
    // so SQLite's read lock isn't held while sha256 + zip stream run.
    // ==================================================================

    const readTx = await sequelize.transaction();
    let readTxFinalized = false;

    let maxOutboxId;
    let articles, articleIds, articleUuidsInBundle;
    let comments, annotations, images, audios, videos;
    let tagRels, groupRels, relRels;
    let owners, categories, tags, groups;
    let ownerUuidById, categoryUuidById, tagUuidById, groupUuidById;
    let articleIdToMediaIdMap, articleUuidById;
    let manualDeleteRows, manualDeleteFound, manualDeletes;
    let autoDeletes, participatingArticleUuids;
    let filteredRelRels;

    try {
        // Snapshot the outbox upper bound so the post-build stamp UPDATE
        // doesn't race with concurrent writes.
        maxOutboxId = await snapshotOutboxMaxId(sequelize, { transaction: readTx });

        // --------------------------------------------------------------
        // 1. Resolve `latestState` articles from live tables.
        // --------------------------------------------------------------

        articles = latestState.length > 0
            ? await sequelize.models.article.findAll({
                where: { uuid: { [Op.in]: latestState } },
                transaction: readTx,
            })
            : [];

        if (articles.length !== latestState.length) {
            const found = new Set(articles.map((a) => a.uuid));
            const missing = latestState.filter((u) => !found.has(u));
            console.warn(`exportBundle: ${missing.length} latestState uuids not found on disk; skipping:`, missing);
        }

        articleIds = articles.map((a) => a.id);
        articleUuidsInBundle = new Set(articles.map((a) => a.uuid));

        // --------------------------------------------------------------
        // 2. Resolve children (comments, annotations, media) by articleId.
        // --------------------------------------------------------------

        [comments, annotations, images, audios, videos] = articleIds.length === 0
            ? [[], [], [], [], []]
            : await Promise.all([
                sequelize.models.comment.findAll({ where: { articleId: { [Op.in]: articleIds } }, transaction: readTx }),
                sequelize.models.annotation.findAll({ where: { articleId: { [Op.in]: articleIds } }, transaction: readTx }),
                sequelize.models.image.findAll({ where: { articleId: { [Op.in]: articleIds } }, transaction: readTx }),
                sequelize.models.audio.findAll({ where: { articleId: { [Op.in]: articleIds } }, transaction: readTx }),
                sequelize.models.video.findAll({ where: { articleId: { [Op.in]: articleIds } }, transaction: readTx }),
            ]);

        // --------------------------------------------------------------
        // 3. Resolve junctions.
        // --------------------------------------------------------------

        const ATR = sequelize.models.article_tag_rel;
        const AGR = sequelize.models.article_group_rel;
        const AAR = sequelize.models.article_article_rel;

        [tagRels, groupRels, relRels] = articleIds.length === 0
            ? [[], [], []]
            : await Promise.all([
                ATR.findAll({ where: { articleId: { [Op.in]: articleIds } }, transaction: readTx }),
                AGR.findAll({ where: { articleId: { [Op.in]: articleIds } }, transaction: readTx }),
                AAR.findAll({
                    where: {
                        [Op.or]: [
                            { articleId: { [Op.in]: articleIds } },
                            { relatedArticleId: { [Op.in]: articleIds } },
                        ],
                    },
                    transaction: readTx,
                }),
            ]);

        // --------------------------------------------------------------
        // 4. Resolve referenced owners / categories / tags / groups (full
        //    rows so the bundle carries them). Also resolve id <-> uuid
        //    maps to FK-rewrite the rows we emit.
        // --------------------------------------------------------------

        const ownerIds = [...new Set(articles.map((a) => a.ownerId).filter((x) => x != null))];
        const categoryIds = [...new Set(articles.map((a) => a.categoryId).filter((x) => x != null))];
        const tagIds = [...new Set(tagRels.map((r) => r.tagId).filter((x) => x != null))];
        const groupIds = [...new Set(groupRels.map((r) => r.groupId).filter((x) => x != null))];

        owners = ownerIds.length
            ? await sequelize.models.owner.findAll({ where: { id: { [Op.in]: ownerIds } }, transaction: readTx })
            : [];
        categories = categoryIds.length
            ? await sequelize.models.category.findAll({ where: { id: { [Op.in]: categoryIds } }, transaction: readTx })
            : [];
        tags = tagIds.length
            ? await sequelize.models.tag.findAll({ where: { id: { [Op.in]: tagIds } }, transaction: readTx })
            : [];
        groups = groupIds.length
            ? await sequelize.models.group.findAll({ where: { id: { [Op.in]: groupIds } }, transaction: readTx })
            : [];

        ownerUuidById = new Map(owners.map((o) => [o.id, o.uuid]));
        categoryUuidById = new Map(categories.map((c) => [c.id, c.uuid]));
        tagUuidById = new Map(tags.map((t) => [t.id, t.uuid]));
        groupUuidById = new Map(groups.map((g) => [g.id, g.uuid]));

        // For comments: ownerId -> ownerUuid. The full owner row is already
        // in the bundle if the article references that owner; otherwise we
        // also need to pull the comment's owner.
        const commentOwnerIds = [...new Set(comments.map((c) => c.ownerId).filter((x) => x != null))];
        const extraCommentOwnerIds = commentOwnerIds.filter((id) => !ownerUuidById.has(id));
        if (extraCommentOwnerIds.length > 0) {
            const extra = await sequelize.models.owner.findAll({
                where: { id: { [Op.in]: extraCommentOwnerIds } },
                transaction: readTx,
            });
            for (const o of extra) {
                owners.push(o);
                ownerUuidById.set(o.id, o.uuid);
            }
        }

        // For each article, build articleId -> mediaIdToUuid map for tiptap rewrite.
        articleIdToMediaIdMap = new Map();
        for (const id of articleIds) articleIdToMediaIdMap.set(id, new Map());
        for (const im of images) articleIdToMediaIdMap.get(im.articleId)?.set(im.id, im.uuid);
        for (const au of audios) articleIdToMediaIdMap.get(au.articleId)?.set(au.id, au.uuid);
        for (const vi of videos) articleIdToMediaIdMap.get(vi.articleId)?.set(vi.id, vi.uuid);

        // Article id -> uuid for the related-article rel rewrite.
        articleUuidById = new Map(articles.map((a) => [a.id, a.uuid]));

        // --------------------------------------------------------------
        // 5. Resolve `manualDelete` articles (need current revision to
        //    emit revision = liveRev + 1).
        // --------------------------------------------------------------

        manualDeleteRows = manualDelete.length > 0
            ? await sequelize.models.article.findAll({
                where: { uuid: { [Op.in]: manualDelete } },
                attributes: ['uuid', 'revision'],
                transaction: readTx,
            })
            : [];
        manualDeleteFound = new Set(manualDeleteRows.map((r) => r.uuid));
        const manualDeleteSkipped = manualDelete.filter((u) => !manualDeleteFound.has(u));
        if (manualDeleteSkipped.length > 0) {
            console.warn(`exportBundle: ${manualDeleteSkipped.length} manualDelete uuids missing from live table; skipping (auto-include path will pick them up if their delete is pending):`, manualDeleteSkipped);
        }
        manualDeletes = manualDeleteRows.map((r) => ({
            uuid: r.uuid,
            revision: (r.revision || 0) + 1,
        }));

        // --------------------------------------------------------------
        // 6. Auto-include pending desktop deletes.
        // --------------------------------------------------------------

        const allArticleCoalesced = await coalescePending(sequelize, {
            entityTypes: ['article'],
            maxOutboxId,
            transaction: readTx,
        });
        autoDeletes = allArticleCoalesced
            .filter((p) => p.finalOp === 'delete')
            .filter((p) => !articleUuidsInBundle.has(p.uuid))
            .filter((p) => !manualDeleteFound.has(p.uuid))
            .map((p) => ({ uuid: p.uuid }));

        // Track which outbox rows participated so we know what to stamp.
        // - latestState articles: their pending coalesced rows (any op).
        // - dependency entities: their pending coalesced rows (computed below).
        // - autoDeletes: their pending delete rows.
        // (manualDeletes have NO outbox rows - the desktop row was never
        //  touched.)
        participatingArticleUuids = new Set([
            ...articles.map((a) => a.uuid),
            ...autoDeletes.map((d) => d.uuid),
        ]);

        // --------------------------------------------------------------
        // 7. Filter dangling articleArticleRels.
        //
        //    Drop any rel whose relatedArticleUuid is neither in this
        //    bundle's articles set NOR present in `exported_bundle_articles`
        //    (mobile won't have the target). Also drop rels whose
        //    articleId-side article isn't in the bundle (could happen if
        //    the rel was returned because the article is on the
        //    relatedArticleId side).
        // --------------------------------------------------------------

        const sharedSet = await loadSharedArticleUuidSet({ transaction: readTx });

        // Need related article uuids (the ones not in bundle) — pull just
        // their uuids, not whole rows.
        const allRelArticleIds = new Set();
        for (const r of relRels) {
            allRelArticleIds.add(r.articleId);
            allRelArticleIds.add(r.relatedArticleId);
        }
        const missingArticleIds = [...allRelArticleIds].filter((id) => !articleUuidById.has(id));
        if (missingArticleIds.length > 0) {
            const extraArticles = await sequelize.models.article.findAll({
                where: { id: { [Op.in]: missingArticleIds } },
                attributes: ['id', 'uuid'],
                transaction: readTx,
            });
            for (const a of extraArticles) articleUuidById.set(a.id, a.uuid);
        }

        filteredRelRels = relRels.filter((r) => {
            const aUuid = articleUuidById.get(r.articleId);
            const rUuid = articleUuidById.get(r.relatedArticleId);
            if (!aUuid || !rUuid) return false;
            // article side must be IN this bundle (we don't emit a rel whose
            // owning article isn't being shared).
            if (!articleUuidsInBundle.has(aUuid)) return false;
            // related side must be either in this bundle OR previously shared.
            if (!articleUuidsInBundle.has(rUuid) && !sharedSet.has(rUuid)) return false;
            return true;
        });

        // Read phase complete — release the snapshot before the heavy
        // file-I/O build phase below. Step 8's projections only touch
        // already-loaded sequelize instances (no DB queries) and step 9
        // / step 10 manage their own transactions, so dropping the read
        // lock here is safe and avoids holding SQLite while sha256 and
        // archiver stream through hundreds of MB of media.
        await readTx.commit();
        readTxFinalized = true;
    } catch (err) {
        if (!readTxFinalized) {
            try { await readTx.rollback(); } catch (_) { /* ignore */ }
        }
        throw err;
    }

    // ------------------------------------------------------------------
    // 8. Project rows to bundle-builder shape.
    // ------------------------------------------------------------------

    const articleRows = articles.map((a) => {
        const dv = a.dataValues;
        const idMap = articleIdToMediaIdMap.get(a.id) || new Map();
        const out = stripTimestamps(dv);
        out.ownerUuid = dv.ownerId != null ? ownerUuidById.get(dv.ownerId) || null : null;
        out.categoryUuid = dv.categoryId != null ? categoryUuidById.get(dv.categoryId) || null : null;
        delete out.ownerId;
        delete out.categoryId;

        if (out.textTiptapJson != null) {
            out.textTiptapJson = rewriteTiptap(out.textTiptapJson, idMap);
        }
        if (out.explanationTiptapJson != null) {
            out.explanationTiptapJson = rewriteTiptap(out.explanationTiptapJson, idMap);
        }
        return out;
    });

    const ownerRows = owners.map((o) => stripTimestamps(o.dataValues));
    const categoryRows = categories.map((c) => stripTimestamps(c.dataValues));
    const tagRows = tags.map((t) => stripTimestamps(t.dataValues));
    const groupRows = groups.map((g) => stripTimestamps(g.dataValues));

    const commentRows = comments.map((c) => {
        const dv = c.dataValues;
        const articleUuid = articleUuidById.get(dv.articleId);
        const idMap = articleIdToMediaIdMap.get(dv.articleId) || new Map();
        const out = stripTimestamps(dv);
        out.articleUuid = articleUuid;
        out.ownerUuid = dv.ownerId != null ? ownerUuidById.get(dv.ownerId) || null : null;
        delete out.articleId;
        delete out.ownerId;
        if (out.tiptapTextJson != null) out.tiptapTextJson = rewriteTiptap(out.tiptapTextJson, idMap);
        return out;
    });

    const annotationRows = annotations.map((a) => {
        const dv = a.dataValues;
        const out = stripTimestamps(dv);
        out.articleUuid = articleUuidById.get(dv.articleId);
        delete out.articleId;
        return out;
    });

    const buildMediaRow = (m, kind) => {
        const dv = m.dataValues;
        const out = stripTimestamps(dv);
        out.articleUuid = articleUuidById.get(dv.articleId);
        delete out.articleId;
        const folder = kind === 'images' ? config.imagesFolderPath
            : kind === 'audios' ? config.audiosFolderPath
            : config.videosFolderPath;
        out.absSrcPath = path.join(folder, dv.path);
        // `dv.type` historically holds either a bare extension (e.g. "jpg",
        // when added via filesystem import → `path.extname(...).slice(1)`)
        // or a MIME type (e.g. "image/jpeg", when added via the renderer's
        // File API → `file.type`). Using it raw produced zip entries like
        // `media/images/<uuid>.image/jpeg`, which zip viewers render as a
        // folder. Prefer the original filename's extension, fall back to
        // the MIME subtype, then normalize to a slash-free ext.
        out.ext = pickMediaExt(dv);
        return out;
    };
    // Belt-and-suspenders: every media row's articleUuid MUST resolve to
    // one of this bundle's articles. Today this is true by construction
    // (the media findAll above is keyed on articleIds derived from
    // `articles`, and articleUuidById is built from the same set), but
    // the explicit filter mirrors the guard the junction projections use
    // and would catch any future regression that accidentally drops the
    // FK rewrite or expands the media query scope.
    const imageRows = images
        .map((m) => buildMediaRow(m, 'images'))
        .filter((r) => r.articleUuid && articleUuidsInBundle.has(r.articleUuid));
    const audioRows = audios
        .map((m) => buildMediaRow(m, 'audios'))
        .filter((r) => r.articleUuid && articleUuidsInBundle.has(r.articleUuid));
    const videoRows = videos
        .map((m) => buildMediaRow(m, 'videos'))
        .filter((r) => r.articleUuid && articleUuidsInBundle.has(r.articleUuid));

    const tagRelRows = tagRels.map((r) => {
        const dv = r.dataValues;
        return {
            uuid: dv.uuid,
            revision: dv.revision,
            articleUuid: articleUuidById.get(dv.articleId),
            tagUuid: tagUuidById.get(dv.tagId),
            tagOrdering: dv.tagOrdering,
        };
    }).filter((r) => r.articleUuid && r.tagUuid && articleUuidsInBundle.has(r.articleUuid));

    const groupRelRows = groupRels.map((r) => {
        const dv = r.dataValues;
        return {
            uuid: dv.uuid,
            revision: dv.revision,
            articleUuid: articleUuidById.get(dv.articleId),
            groupUuid: groupUuidById.get(dv.groupId),
            groupOrdering: dv.groupOrdering,
        };
    }).filter((r) => r.articleUuid && r.groupUuid && articleUuidsInBundle.has(r.articleUuid));

    const articleArticleRelRows = filteredRelRels.map((r) => {
        const dv = r.dataValues;
        return {
            uuid: dv.uuid,
            revision: dv.revision,
            articleUuid: articleUuidById.get(dv.articleId),
            relatedArticleUuid: articleUuidById.get(dv.relatedArticleId),
            relatedArticleOrdering: dv.relatedArticleOrdering,
        };
    });

    // Track every entity uuid that's in the bundle so the post-build
    // outbox stamp UPDATE only marks what we actually shipped.
    const participatingUuids = new Set([
        ...participatingArticleUuids,
        ...ownerRows.map((o) => o.uuid),
        ...categoryRows.map((c) => c.uuid),
        ...tagRows.map((t) => t.uuid),
        ...groupRows.map((g) => g.uuid),
        ...commentRows.map((c) => c.uuid),
        ...annotationRows.map((a) => a.uuid),
        ...imageRows.map((i) => i.uuid),
        ...audioRows.map((a) => a.uuid),
        ...videoRows.map((v) => v.uuid),
        ...tagRelRows.map((r) => r.uuid),
        ...groupRelRows.map((r) => r.uuid),
        ...articleArticleRelRows.map((r) => r.uuid),
    ].filter(Boolean));

    // ------------------------------------------------------------------
    // 9. Build the .blt file.
    // ------------------------------------------------------------------

    const sourceAppVersion = (() => {
        try { return app.getVersion(); } catch { return 'unknown'; }
    })();

    const outputDir = requestedOutputDir || (() => {
        try { return app.getPath('downloads'); } catch { return process.cwd(); }
    })();

    const buildResult = await buildBundle({
        articles: articleRows,
        owners: ownerRows,
        categories: categoryRows,
        tags: tagRows,
        groups: groupRows,
        comments: commentRows,
        annotations: annotationRows,
        images: imageRows,
        audios: audioRows,
        videos: videoRows,
        articleTagRels: tagRelRows,
        articleGroupRels: groupRelRows,
        articleArticleRels: articleArticleRelRows,
        manualDeletes,
        autoDeletes,
        sourceAppVersion,
        outputDir,
    });

    // ------------------------------------------------------------------
    // 10. Persist bookkeeping in a single transaction.
    //
    //     If the INSERTs / stamp fails, the DB is unchanged but the
    //     .blt file is left on disk. That's intentional and recoverable
    //     — the user can retry, the file's bundleId is unique, and the
    //     INSERT into `exported_bundles` is keyed on that uuid; a stale
    //     orphan file is harmless.
    // ------------------------------------------------------------------

    const tx = await sequelize.transaction();
    try {
        await sequelize.models.exportedBundle.create({
            bundleId: buildResult.bundleId,
            createdAt: new Date(),
            opCount: buildResult.opCount,
            articleCount: buildResult.articleCount,
            sizeBytes: buildResult.sizeBytes,
            filePath: buildResult.filePath,
        }, { transaction: tx });

        const ebaRows = [
            ...articles.map((a) => ({ bundleId: buildResult.bundleId, articleUuid: a.uuid })),
            ...manualDeletes.map((d) => ({ bundleId: buildResult.bundleId, articleUuid: d.uuid })),
        ];
        if (ebaRows.length > 0) {
            await sequelize.models.exportedBundleArticle.bulkCreate(ebaRows, { transaction: tx });
        }

        if (participatingUuids.size > 0) {
            await sequelize.query(
                `UPDATE sync_outbox
                 SET exportedAt = :now
                 WHERE id <= :maxId
                   AND exportedAt IS NULL
                   AND uuid IN (:uuids)`,
                {
                    replacements: {
                        now: new Date(),
                        maxId: maxOutboxId,
                        uuids: [...participatingUuids],
                    },
                    transaction: tx,
                }
            );
        }

        await tx.commit();
    } catch (err) {
        await tx.rollback();
        console.error('exportBundle: transaction failed; .blt file may exist on disk but DB is unchanged:', err);
        throw err;
    }

    return {
        filePath: buildResult.filePath,
        summary: {
            bundleId: buildResult.bundleId,
            articleCount: buildResult.articleCount,
            mediaCount: buildResult.mediaCount,
            opCount: buildResult.opCount,
            sizeBytes: buildResult.sizeBytes,
            latestState: latestState.length,
            manualDelete: manualDeletes.length,
            autoDeleted: autoDeletes.length,
        },
    };
}

// =====================================================================
// exportSingleArticleBundle
// =====================================================================
//
// Ad-hoc "share this one article" .blt, driven by the read-view Export
// modal. Differs from exportBundle in three ways:
//
//   1. Scope is a single live article (by desktop id), always its latest
//      state. There is no manualDelete path — the read view can't tombstone.
//   2. The content checkboxes (`options`) are honored: unchecked sections
//      (comment / notes / images / tags / collections / relatedArticles)
//      are omitted, and unchecked mainText / explanation are nulled on the
//      article row. This makes the bundle a *partial* share, fine for a
//      recipient who doesn't already have the article.
//   3. No bookkeeping. We deliberately skip `exported_bundles` /
//      `exported_bundle_articles` inserts and the outbox `exportedAt`
//      stamp so a lossy ad-hoc share never pollutes the canonical sync
//      state managed by the Settings flow.
//
// Pending desktop article-deletes are auto-included as tombstones, same
// as exportBundle (so a fresh receiver converges on deletions too).
async function exportSingleArticleBundle(picks) {
    const articleId = picks?.articleId;
    if (articleId == null) {
        throw new Error('exportSingleArticleBundle: articleId is required');
    }
    const options = picks?.options || {};
    const requestedOutputDir = typeof picks?.outputDir === 'string' && picks.outputDir.length > 0
        ? picks.outputDir
        : null;

    // A missing flag defaults to "include" (true). The renderer always
    // sends the full set, but defaulting keeps the IPC robust.
    const inc = {
        explanation: options.explanation !== false,
        mainText: options.mainText !== false,
        comment: options.comment !== false,
        images: options.images !== false,
        audios: options.audios !== false,
        videos: options.videos !== false,
        notes: options.notes !== false,         // annotations
        tags: options.tags !== false,
        collections: options.collections !== false, // groups
        relatedArticles: options.relatedArticles !== false,
    };

    // ------------------------------------------------------------------
    // Read phase — single snapshot transaction (same rationale as
    // exportBundle: an article upsert must ship with a consistent media
    // set or mobile reconciliation would wipe attachments).
    // ------------------------------------------------------------------

    const readTx = await sequelize.transaction();
    let readTxFinalized = false;

    let article;
    let comments, annotations, images, audios, videos;
    let tagRels, groupRels, relRels;
    let owners, categories, tags, groups;
    let ownerUuidById, categoryUuidById, tagUuidById, groupUuidById;
    let articleIdToMediaIdMap, articleUuidById;
    let autoDeletes, filteredRelRels;
    // Hoisted so the post-build outbox stamp (below, outside this tx) can
    // bound its UPDATE to the same snapshot the reads used.
    let maxOutboxId;

    try {
        maxOutboxId = await snapshotOutboxMaxId(sequelize, { transaction: readTx });

        article = await sequelize.models.article.findByPk(articleId, { transaction: readTx });
        if (!article) {
            throw new Error(`exportSingleArticleBundle: article ${articleId} not found`);
        }
        const articleUuid = article.uuid;
        const articleUuidsInBundle = new Set([articleUuid]);
        const articleIds = [articleId];

        comments = inc.comment
            ? await sequelize.models.comment.findAll({ where: { articleId }, transaction: readTx })
            : [];
        annotations = inc.notes
            ? await sequelize.models.annotation.findAll({ where: { articleId }, transaction: readTx })
            : [];
        [images, audios, videos] = await Promise.all([
            inc.images ? sequelize.models.image.findAll({ where: { articleId }, transaction: readTx }) : [],
            inc.audios ? sequelize.models.audio.findAll({ where: { articleId }, transaction: readTx }) : [],
            inc.videos ? sequelize.models.video.findAll({ where: { articleId }, transaction: readTx }) : [],
        ]);

        const ATR = sequelize.models.article_tag_rel;
        const AGR = sequelize.models.article_group_rel;
        const AAR = sequelize.models.article_article_rel;

        tagRels = inc.tags
            ? await ATR.findAll({ where: { articleId }, transaction: readTx })
            : [];
        groupRels = inc.collections
            ? await AGR.findAll({ where: { articleId }, transaction: readTx })
            : [];
        relRels = inc.relatedArticles
            ? await AAR.findAll({
                where: {
                    [Op.or]: [
                        { articleId },
                        { relatedArticleId: articleId },
                    ],
                },
                transaction: readTx,
            })
            : [];

        const ownerIds = [...new Set([article.ownerId].filter((x) => x != null))];
        const categoryIds = [...new Set([article.categoryId].filter((x) => x != null))];
        const tagIds = [...new Set(tagRels.map((r) => r.tagId).filter((x) => x != null))];
        const groupIds = [...new Set(groupRels.map((r) => r.groupId).filter((x) => x != null))];

        owners = ownerIds.length
            ? await sequelize.models.owner.findAll({ where: { id: { [Op.in]: ownerIds } }, transaction: readTx })
            : [];
        categories = categoryIds.length
            ? await sequelize.models.category.findAll({ where: { id: { [Op.in]: categoryIds } }, transaction: readTx })
            : [];
        tags = tagIds.length
            ? await sequelize.models.tag.findAll({ where: { id: { [Op.in]: tagIds } }, transaction: readTx })
            : [];
        groups = groupIds.length
            ? await sequelize.models.group.findAll({ where: { id: { [Op.in]: groupIds } }, transaction: readTx })
            : [];

        ownerUuidById = new Map(owners.map((o) => [o.id, o.uuid]));
        categoryUuidById = new Map(categories.map((c) => [c.id, c.uuid]));
        tagUuidById = new Map(tags.map((t) => [t.id, t.uuid]));
        groupUuidById = new Map(groups.map((g) => [g.id, g.uuid]));

        // Comment owners not already covered by the article's owner.
        const commentOwnerIds = [...new Set(comments.map((c) => c.ownerId).filter((x) => x != null))];
        const extraCommentOwnerIds = commentOwnerIds.filter((id) => !ownerUuidById.has(id));
        if (extraCommentOwnerIds.length > 0) {
            const extra = await sequelize.models.owner.findAll({
                where: { id: { [Op.in]: extraCommentOwnerIds } },
                transaction: readTx,
            });
            for (const o of extra) {
                owners.push(o);
                ownerUuidById.set(o.id, o.uuid);
            }
        }

        articleIdToMediaIdMap = new Map([[articleId, new Map()]]);
        for (const im of images) articleIdToMediaIdMap.get(im.articleId)?.set(im.id, im.uuid);
        for (const au of audios) articleIdToMediaIdMap.get(au.articleId)?.set(au.id, au.uuid);
        for (const vi of videos) articleIdToMediaIdMap.get(vi.articleId)?.set(vi.id, vi.uuid);

        articleUuidById = new Map([[articleId, articleUuid]]);

        // Set of article uuids ever shipped before (peer-ack oracle).
        const sharedSet = await loadSharedArticleUuidSet({ transaction: readTx });

        // Auto-include pending desktop deletes (excluding this article).
        // Drop create+…+delete sequences the receiver never saw (hadCreate
        // and no prior ack in exported_bundle_articles): there's nothing to
        // tombstone on the other side, so emitting the delete is just noise.
        const allArticleCoalesced = await coalescePending(sequelize, {
            entityTypes: ['article'],
            maxOutboxId,
            transaction: readTx,
        });
        autoDeletes = allArticleCoalesced
            .filter((p) => p.finalOp === 'delete')
            .filter((p) => !articleUuidsInBundle.has(p.uuid))
            .filter((p) => !(p.hadCreate && !sharedSet.has(p.uuid)))
            .map((p) => ({ uuid: p.uuid }));

        // Drop related-article rels whose other side mobile won't have.
        const allRelArticleIds = new Set();
        for (const r of relRels) {
            allRelArticleIds.add(r.articleId);
            allRelArticleIds.add(r.relatedArticleId);
        }
        const missingArticleIds = [...allRelArticleIds].filter((id) => !articleUuidById.has(id));
        if (missingArticleIds.length > 0) {
            const extraArticles = await sequelize.models.article.findAll({
                where: { id: { [Op.in]: missingArticleIds } },
                attributes: ['id', 'uuid'],
                transaction: readTx,
            });
            for (const a of extraArticles) articleUuidById.set(a.id, a.uuid);
        }

        filteredRelRels = relRels.filter((r) => {
            const aUuid = articleUuidById.get(r.articleId);
            const rUuid = articleUuidById.get(r.relatedArticleId);
            if (!aUuid || !rUuid) return false;
            if (!articleUuidsInBundle.has(aUuid)) return false;
            if (!articleUuidsInBundle.has(rUuid) && !sharedSet.has(rUuid)) return false;
            return true;
        });

        await readTx.commit();
        readTxFinalized = true;
    } catch (err) {
        if (!readTxFinalized) {
            try { await readTx.rollback(); } catch (_) { /* ignore */ }
        }
        throw err;
    }

    // ------------------------------------------------------------------
    // Project rows to bundle-builder shape, honoring text/explanation
    // checkboxes by nulling the corresponding columns.
    // ------------------------------------------------------------------

    // Media types the user deselected. Their media rows are already
    // excluded from the bundle above; here we also scrub their now-dangling
    // nodes out of every body representation (tiptap / draft.js / HTML) so
    // the article doesn't ship empty media placeholders.
    const excludedMediaNodeTypes = new Set();
    if (!inc.images) excludedMediaNodeTypes.add('imageNode');
    if (!inc.audios) excludedMediaNodeTypes.add('audioNode');
    if (!inc.videos) excludedMediaNodeTypes.add('videoNode');

    const idMap = articleIdToMediaIdMap.get(article.id) || new Map();
    const articleRow = await (async () => {
        const dv = article.dataValues;
        const out = stripTimestamps(dv);
        out.ownerUuid = dv.ownerId != null ? ownerUuidById.get(dv.ownerId) || null : null;
        out.categoryUuid = dv.categoryId != null ? categoryUuidById.get(dv.categoryId) || null : null;
        delete out.ownerId;
        delete out.categoryId;

        if (inc.mainText) {
            out.text = await stripMediaFromHtml(out.text, excludedMediaNodeTypes);
            out.textJson = stripMediaFromDraftRaw(out.textJson, excludedMediaNodeTypes);
            out.textTiptapJson = stripMediaFromTiptapDoc(out.textTiptapJson, excludedMediaNodeTypes);
            if (out.textTiptapJson != null) out.textTiptapJson = rewriteTiptap(out.textTiptapJson, idMap);
        } else {
            out.text = null;
            out.textJson = null;
            out.textTiptapJson = null;
        }
        if (inc.explanation) {
            out.explanation = await stripMediaFromHtml(out.explanation, excludedMediaNodeTypes);
            out.explanationJson = stripMediaFromDraftRaw(out.explanationJson, excludedMediaNodeTypes);
            out.explanationTiptapJson = stripMediaFromTiptapDoc(out.explanationTiptapJson, excludedMediaNodeTypes);
            if (out.explanationTiptapJson != null) out.explanationTiptapJson = rewriteTiptap(out.explanationTiptapJson, idMap);
        } else {
            out.explanation = null;
            out.explanationJson = null;
            out.explanationTiptapJson = null;
        }
        return out;
    })();

    const ownerRows = owners.map((o) => stripTimestamps(o.dataValues));
    const categoryRows = categories.map((c) => stripTimestamps(c.dataValues));
    const tagRows = tags.map((t) => stripTimestamps(t.dataValues));
    const groupRows = groups.map((g) => stripTimestamps(g.dataValues));

    const commentRows = await Promise.all(comments.map(async (c) => {
        const dv = c.dataValues;
        const out = stripTimestamps(dv);
        out.articleUuid = articleUuidById.get(dv.articleId);
        out.ownerUuid = dv.ownerId != null ? ownerUuidById.get(dv.ownerId) || null : null;
        delete out.articleId;
        delete out.ownerId;
        out.text = await stripMediaFromHtml(out.text, excludedMediaNodeTypes);
        out.textJson = stripMediaFromDraftRaw(out.textJson, excludedMediaNodeTypes);
        out.tiptapTextJson = stripMediaFromTiptapDoc(out.tiptapTextJson, excludedMediaNodeTypes);
        if (out.tiptapTextJson != null) out.tiptapTextJson = rewriteTiptap(out.tiptapTextJson, idMap);
        return out;
    }));

    const annotationRows = annotations.map((a) => {
        const dv = a.dataValues;
        const out = stripTimestamps(dv);
        out.articleUuid = articleUuidById.get(dv.articleId);
        delete out.articleId;
        return out;
    });

    const articleUuidsInBundle = new Set([article.uuid]);
    const buildMediaRow = (m, kind) => {
        const dv = m.dataValues;
        const out = stripTimestamps(dv);
        out.articleUuid = articleUuidById.get(dv.articleId);
        delete out.articleId;
        const folder = kind === 'images' ? config.imagesFolderPath
            : kind === 'audios' ? config.audiosFolderPath
            : config.videosFolderPath;
        out.absSrcPath = path.join(folder, dv.path);
        out.ext = pickMediaExt(dv);
        return out;
    };
    const imageRows = images
        .map((m) => buildMediaRow(m, 'images'))
        .filter((r) => r.articleUuid && articleUuidsInBundle.has(r.articleUuid));
    const audioRows = audios
        .map((m) => buildMediaRow(m, 'audios'))
        .filter((r) => r.articleUuid && articleUuidsInBundle.has(r.articleUuid));
    const videoRows = videos
        .map((m) => buildMediaRow(m, 'videos'))
        .filter((r) => r.articleUuid && articleUuidsInBundle.has(r.articleUuid));

    const tagRelRows = tagRels.map((r) => {
        const dv = r.dataValues;
        return {
            uuid: dv.uuid,
            revision: dv.revision,
            articleUuid: articleUuidById.get(dv.articleId),
            tagUuid: tagUuidById.get(dv.tagId),
            tagOrdering: dv.tagOrdering,
        };
    }).filter((r) => r.articleUuid && r.tagUuid && articleUuidsInBundle.has(r.articleUuid));

    const groupRelRows = groupRels.map((r) => {
        const dv = r.dataValues;
        return {
            uuid: dv.uuid,
            revision: dv.revision,
            articleUuid: articleUuidById.get(dv.articleId),
            groupUuid: groupUuidById.get(dv.groupId),
            groupOrdering: dv.groupOrdering,
        };
    }).filter((r) => r.articleUuid && r.groupUuid && articleUuidsInBundle.has(r.articleUuid));

    const articleArticleRelRows = filteredRelRels.map((r) => {
        const dv = r.dataValues;
        return {
            uuid: dv.uuid,
            revision: dv.revision,
            articleUuid: articleUuidById.get(dv.articleId),
            relatedArticleUuid: articleUuidById.get(dv.relatedArticleId),
            relatedArticleOrdering: dv.relatedArticleOrdering,
        };
    });

    // ------------------------------------------------------------------
    // Build the .blt file. No bookkeeping (see function header).
    // ------------------------------------------------------------------

    const sourceAppVersion = (() => {
        try { return app.getVersion(); } catch { return 'unknown'; }
    })();

    const outputDir = requestedOutputDir || (() => {
        try { return app.getPath('downloads'); } catch { return process.cwd(); }
    })();

    const buildResult = await buildBundle({
        articles: [articleRow],
        owners: ownerRows,
        categories: categoryRows,
        tags: tagRows,
        groups: groupRows,
        comments: commentRows,
        annotations: annotationRows,
        images: imageRows,
        audios: audioRows,
        videos: videoRows,
        articleTagRels: tagRelRows,
        articleGroupRels: groupRelRows,
        articleArticleRels: articleArticleRelRows,
        manualDeletes: [],
        autoDeletes,
        sourceAppVersion,
        outputDir,
    });

    // Stamp ONLY the auto-included tombstones as exported, so each pending
    // delete ships exactly once instead of riding along in every ad-hoc
    // share forever. We deliberately do NOT stamp the shared article's own
    // content rows: a partial/lossy single-article share must not mark the
    // canonical article as "published" (that would let it lose later
    // revision races against a full settings sync).
    if (autoDeletes.length > 0) {
        const stampTx = await sequelize.transaction();
        try {
            await sequelize.query(
                `UPDATE sync_outbox
                 SET exportedAt = :now
                 WHERE id <= :maxId
                   AND exportedAt IS NULL
                   AND entityType = 'article'
                   AND uuid IN (:uuids)`,
                {
                    replacements: {
                        now: new Date(),
                        maxId: maxOutboxId,
                        uuids: autoDeletes.map((d) => d.uuid),
                    },
                    transaction: stampTx,
                }
            );
            await stampTx.commit();
        } catch (err) {
            await stampTx.rollback();
            // The .blt is already written; failing to stamp only means the
            // same deletes may re-appear next time. Surface it but don't
            // fail the export the user already completed.
            console.error('exportSingleArticleBundle: failed to stamp auto-deletes as exported:', err);
        }
    }

    return {
        filePath: buildResult.filePath,
        summary: {
            bundleId: buildResult.bundleId,
            articleCount: buildResult.articleCount,
            mediaCount: buildResult.mediaCount,
            opCount: buildResult.opCount,
            latestState: 1,
            manualDelete: 0,
            autoDeleted: autoDeletes.length,
            sizeBytes: buildResult.sizeBytes,
        },
    };
}

function stripTimestamps(dv) {
    const out = { ...dv };
    delete out.createdAt;
    delete out.updatedAt;
    return out;
}

// Resolve a clean filesystem-safe extension for a media row.
const SharingService = {
    initService,
    // Exported for the smoke script in scripts/.
    getCandidates,
    getLastExport,
    exportBundle,
    exportSingleArticleBundle,
    importBundleFromPath,
};

export default SharingService;
