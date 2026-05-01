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

import { ipcMain, app, shell } from 'electron';
import { Op, QueryTypes } from 'sequelize';
import path from 'path';

import { sequelize } from '../sequelize/index.js';
import { config } from '../config.js';
import { coalescePending, snapshotOutboxMaxId } from '../sync/coalesce.js';
import { rewriteTiptap } from '../sync/tiptapRewrite.js';
import { build as buildBundle } from '../sync/bundleBuilder.js';

function initService() {
    ipcMain.handle('sharing/getCandidates', async () => await getCandidates());
    ipcMain.handle('sharing/getLastExport', async () => await getLastExport());
    ipcMain.handle('sharing/exportBundle', async (_event, picks) => await exportBundle(picks));
    ipcMain.handle('sharing/showInFolder', async (_event, filePath) => {
        if (typeof filePath !== 'string' || filePath.length === 0) return false;
        try { shell.showItemInFolder(filePath); return true; }
        catch (err) { console.warn('sharing/showInFolder failed:', err); return false; }
    });

    console.info('SharingService initialized');
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
        attributes: ['id', 'uuid', 'title', 'updatedAt', 'ownerId', 'categoryId'],
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

async function loadSharedArticleUuidSet() {
    const rows = await sequelize.models.exportedBundleArticle.findAll({
        attributes: [[sequelize.fn('DISTINCT', sequelize.col('articleUuid')), 'articleUuid']],
        raw: true,
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

    // Snapshot the outbox upper bound so the post-build stamp UPDATE
    // doesn't race with concurrent writes.
    const maxOutboxId = await snapshotOutboxMaxId(sequelize);

    // ------------------------------------------------------------------
    // 1. Resolve `latestState` articles from live tables.
    // ------------------------------------------------------------------

    const articles = latestState.length > 0
        ? await sequelize.models.article.findAll({
            where: { uuid: { [Op.in]: latestState } },
        })
        : [];

    if (articles.length !== latestState.length) {
        const found = new Set(articles.map((a) => a.uuid));
        const missing = latestState.filter((u) => !found.has(u));
        console.warn(`exportBundle: ${missing.length} latestState uuids not found on disk; skipping:`, missing);
    }

    const articleIds = articles.map((a) => a.id);
    const articleUuidsInBundle = new Set(articles.map((a) => a.uuid));

    // ------------------------------------------------------------------
    // 2. Resolve children (comments, annotations, media) by articleId.
    // ------------------------------------------------------------------

    const [comments, annotations, images, audios, videos] = articleIds.length === 0
        ? [[], [], [], [], []]
        : await Promise.all([
            sequelize.models.comment.findAll({ where: { articleId: { [Op.in]: articleIds } } }),
            sequelize.models.annotation.findAll({ where: { articleId: { [Op.in]: articleIds } } }),
            sequelize.models.image.findAll({ where: { articleId: { [Op.in]: articleIds } } }),
            sequelize.models.audio.findAll({ where: { articleId: { [Op.in]: articleIds } } }),
            sequelize.models.video.findAll({ where: { articleId: { [Op.in]: articleIds } } }),
        ]);

    // ------------------------------------------------------------------
    // 3. Resolve junctions.
    // ------------------------------------------------------------------

    const ATR = sequelize.models.article_tag_rel;
    const AGR = sequelize.models.article_group_rel;
    const AAR = sequelize.models.article_article_rel;

    const [tagRels, groupRels, relRels] = articleIds.length === 0
        ? [[], [], []]
        : await Promise.all([
            ATR.findAll({ where: { articleId: { [Op.in]: articleIds } } }),
            AGR.findAll({ where: { articleId: { [Op.in]: articleIds } } }),
            AAR.findAll({
                where: {
                    [Op.or]: [
                        { articleId: { [Op.in]: articleIds } },
                        { relatedArticleId: { [Op.in]: articleIds } },
                    ],
                },
            }),
        ]);

    // ------------------------------------------------------------------
    // 4. Resolve referenced owners / categories / tags / groups (full rows
    //    so the bundle carries them). Also resolve id <-> uuid maps to FK-
    //    rewrite the rows we emit.
    // ------------------------------------------------------------------

    const ownerIds = [...new Set(articles.map((a) => a.ownerId).filter((x) => x != null))];
    const categoryIds = [...new Set(articles.map((a) => a.categoryId).filter((x) => x != null))];
    const tagIds = [...new Set(tagRels.map((r) => r.tagId).filter((x) => x != null))];
    const groupIds = [...new Set(groupRels.map((r) => r.groupId).filter((x) => x != null))];

    const owners = ownerIds.length
        ? await sequelize.models.owner.findAll({ where: { id: { [Op.in]: ownerIds } } })
        : [];
    const categories = categoryIds.length
        ? await sequelize.models.category.findAll({ where: { id: { [Op.in]: categoryIds } } })
        : [];
    const tags = tagIds.length
        ? await sequelize.models.tag.findAll({ where: { id: { [Op.in]: tagIds } } })
        : [];
    const groups = groupIds.length
        ? await sequelize.models.group.findAll({ where: { id: { [Op.in]: groupIds } } })
        : [];

    const ownerUuidById = new Map(owners.map((o) => [o.id, o.uuid]));
    const categoryUuidById = new Map(categories.map((c) => [c.id, c.uuid]));
    const tagUuidById = new Map(tags.map((t) => [t.id, t.uuid]));
    const groupUuidById = new Map(groups.map((g) => [g.id, g.uuid]));

    // For comments: ownerId -> ownerUuid. The full owner row is already
    // in the bundle if the article references that owner; otherwise we
    // also need to pull the comment's owner.
    const commentOwnerIds = [...new Set(comments.map((c) => c.ownerId).filter((x) => x != null))];
    const extraCommentOwnerIds = commentOwnerIds.filter((id) => !ownerUuidById.has(id));
    if (extraCommentOwnerIds.length > 0) {
        const extra = await sequelize.models.owner.findAll({ where: { id: { [Op.in]: extraCommentOwnerIds } } });
        for (const o of extra) {
            owners.push(o);
            ownerUuidById.set(o.id, o.uuid);
        }
    }

    // For each article, build articleId -> mediaIdToUuid map for tiptap rewrite.
    const articleIdToMediaIdMap = new Map();
    for (const id of articleIds) articleIdToMediaIdMap.set(id, new Map());
    for (const im of images) articleIdToMediaIdMap.get(im.articleId)?.set(im.id, im.uuid);
    for (const au of audios) articleIdToMediaIdMap.get(au.articleId)?.set(au.id, au.uuid);
    for (const vi of videos) articleIdToMediaIdMap.get(vi.articleId)?.set(vi.id, vi.uuid);

    // Article id -> uuid for the related-article rel rewrite.
    const articleUuidById = new Map(articles.map((a) => [a.id, a.uuid]));

    // ------------------------------------------------------------------
    // 5. Resolve `manualDelete` articles (need current revision to emit
    //    revision = liveRev + 1).
    // ------------------------------------------------------------------

    const manualDeleteRows = manualDelete.length > 0
        ? await sequelize.models.article.findAll({
            where: { uuid: { [Op.in]: manualDelete } },
            attributes: ['uuid', 'revision'],
        })
        : [];
    const manualDeleteFound = new Set(manualDeleteRows.map((r) => r.uuid));
    const manualDeleteSkipped = manualDelete.filter((u) => !manualDeleteFound.has(u));
    if (manualDeleteSkipped.length > 0) {
        console.warn(`exportBundle: ${manualDeleteSkipped.length} manualDelete uuids missing from live table; skipping (auto-include path will pick them up if their delete is pending):`, manualDeleteSkipped);
    }
    const manualDeletes = manualDeleteRows.map((r) => ({
        uuid: r.uuid,
        revision: (r.revision || 0) + 1,
    }));

    // ------------------------------------------------------------------
    // 6. Auto-include pending desktop deletes.
    // ------------------------------------------------------------------

    const allArticleCoalesced = await coalescePending(sequelize, {
        entityTypes: ['article'],
        maxOutboxId,
    });
    const autoDeletes = allArticleCoalesced
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
    const participatingArticleUuids = new Set([
        ...articles.map((a) => a.uuid),
        ...autoDeletes.map((d) => d.uuid),
    ]);

    // ------------------------------------------------------------------
    // 7. Filter dangling articleArticleRels.
    //
    //    Drop any rel whose relatedArticleUuid is neither in this
    //    bundle's articles set NOR present in `exported_bundle_articles`
    //    (mobile won't have the target). Also drop rels whose
    //    articleId-side article isn't in the bundle (could happen if
    //    the rel was returned because the article is on the
    //    relatedArticleId side).
    // ------------------------------------------------------------------

    const sharedSet = await loadSharedArticleUuidSet();

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
        });
        for (const a of extraArticles) articleUuidById.set(a.id, a.uuid);
    }

    const filteredRelRels = relRels.filter((r) => {
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
    const imageRows = images.map((m) => buildMediaRow(m, 'images'));
    const audioRows = audios.map((m) => buildMediaRow(m, 'audios'));
    const videoRows = videos.map((m) => buildMediaRow(m, 'videos'));

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

    const outputDir = (() => {
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

function stripTimestamps(dv) {
    const out = { ...dv };
    delete out.createdAt;
    delete out.updatedAt;
    return out;
}

// Resolve a clean filesystem-safe extension for a media row.
// Order of preference:
//   1. extension parsed from the original filename (`name`)
//   2. subtype after the slash in a MIME type (`image/jpeg` → `jpeg`)
//   3. raw `type` if it looks like a bare extension
// Anything containing `/`, `\`, whitespace, or codec parameters
// (`; charset=...`) is rejected so it can't leak into zip entry names.
function pickMediaExt(dv) {
    const sanitize = (s) => {
        if (typeof s !== 'string') return '';
        const trimmed = s.trim().replace(/^\.+/, '');
        if (!trimmed) return '';
        if (/[\/\\\s;]/.test(trimmed)) return '';
        if (!/^[A-Za-z0-9]{1,8}$/.test(trimmed)) return '';
        return trimmed.toLowerCase();
    };

    const fromName = (() => {
        if (typeof dv.name !== 'string') return '';
        const ext = path.extname(dv.name);
        return ext ? sanitize(ext) : '';
    })();
    if (fromName) return fromName;

    const fromType = (() => {
        if (typeof dv.type !== 'string') return '';
        const t = dv.type.trim();
        if (!t) return '';
        if (t.includes('/')) {
            const sub = t.split(';')[0].split('/').pop();
            return sanitize(sub);
        }
        return sanitize(t);
    })();
    return fromType;
}

const SharingService = {
    initService,
    // Exported for the smoke script in scripts/.
    getCandidates,
    getLastExport,
    exportBundle,
};

export default SharingService;
