// Receiver-side applier for a parsed .blt bundle (see bundleReader.js).
//
// Mirrors the contract the mobile applier follows (docs/mobile-sync-plan.md
// §7 / §3a) so a bundle produced by desktop export applies identically here:
//
//   - Ops are applied in APPLY_ORDER so every FK resolves before the row that
//     references it (owners/categories/tags/groups -> articles -> children ->
//     junctions).
//   - Identity is the global `uuid`; FKs in the wire format are `*Uuid`
//     strings re-linked to this DB's local INTEGER ids.
//   - Conflict resolution is last-writer-wins on `revision`: an incoming row
//     is applied only when its revision is strictly greater than the local
//     row's revision. Deletes follow the same gate.
//   - Dictionary entities (owner / category / tag / group) carry a UNIQUE
//     name constraint, so an incoming uuid that doesn't exist locally but
//     whose name already does is mapped onto the existing local row rather
//     than inserted (which would throw). The local row is left untouched.
//
// Writes go through the Sequelize models with `{ hooks: false }` so the sync
// hooks (uuid/revision maintenance + outbox emission) DON'T fire: imported
// rows keep their incoming uuid+revision verbatim and produce no outbox
// pointers, so consumed data is never accidentally re-exported. The whole
// apply runs in one transaction; media bytes are written to the active media
// folders as each media op is processed (a rolled-back transaction may leave
// orphan files behind, which the maintenance reaper cleans up — acceptable
// and recoverable).

import fs from 'fs/promises';
import path from 'path';
import { Op } from 'sequelize';

import { APPLY_ORDER } from './types.js';
import { SYNCABLE_MODELS } from './syncableModels.js';
import { ensureFolderExists } from '../fsOps.js';
import { safeUnlink } from './outbox.js';
import { resolveTiptapMedia, collectMediaUuids, stripMediaNodesById } from './tiptapResolve.js';
import { resolveHtmlMedia, stripHtmlMediaById } from './htmlResolve.js';

// Wire-format entity name -> sequelize model name. Most are identical; the
// three junctions use snake_case model names.
const ENTITY_TO_MODEL = {
    owner: 'owner',
    category: 'category',
    tag: 'tag',
    group: 'group',
    article: 'article',
    comment: 'comment',
    annotation: 'annotation',
    image: 'image',
    audio: 'audio',
    video: 'video',
    articleTagRel: 'article_tag_rel',
    articleGroupRel: 'article_group_rel',
    articleArticleRel: 'article_article_rel',
};

const DICT_ENTITIES = new Set(['owner', 'category', 'tag', 'group']);
const MEDIA_ENTITIES = new Set(['image', 'audio', 'video']);
// Junction (belongsToMany through) tables use a composite PK on the FK pair —
// they have NO `id` column, so they're keyed/updated by `uuid` instead.
const JUNCTION_MODELS = new Set(['article_tag_rel', 'article_group_rel', 'article_article_rel']);

// Master switch for last-writer-wins-by-revision conflict resolution.
//
// When true (the §3a design), an incoming op is applied only if its
// revision is strictly greater than the local row's; otherwise it's
// skipped. When false, the revision check is bypassed and every op
// applies unconditionally ("last bundle wins"), so a re-import overwrites
// local rows regardless of revision.
//
// Disabled for now: the gate was silently dropping legitimate
// partial-update content whose revision hadn't advanced (e.g. a
// media-stripped comment body the editor never re-versioned), which made
// updates look like they didn't take. Revisit flipping this back on once
// every meaningful edit reliably bumps its row's revision. The bundleId
// idempotency guard (applied_bundles) still prevents re-applying the exact
// same bundle either way.
const REVISION_GATE_ENABLED = false;

// Per-entity column whitelists. Anything not listed (FK *Uuid fields, id,
// uuid, revision, timestamps) is handled explicitly or intentionally dropped.
const FIELDS = {
    owner: ['name', 'ordering', 'field1', 'field2'],
    category: ['name', 'color', 'ordering', 'field1', 'field2'],
    tag: ['name', 'ordering', 'field1', 'field2'],
    group: ['name', 'ordering', 'field1', 'field2'],
    article: [
        'title', 'date', 'number', 'date2', 'number2', 'ordering',
        'explanation', 'explanationJson', 'explanationTiptapJson',
        'text', 'textJson', 'textTiptapJson', 'code',
        'isEditable', 'isDateUncertain', 'isStarred', 'isPublished', 'isDeleted',
        'isArchived', 'isDraft', 'isHidden', 'isProtected', 'isFeatured',
        'isPinned', 'isPrivate', 'isRead', 'field1', 'field2', 'field3',
    ],
    comment: ['date', 'text', 'textJson', 'tiptapTextJson', 'ordering', 'field1', 'field2'],
    annotation: ['quote', 'note', 'ordering', 'field1', 'field2'],
    image: ['name', 'type', 'size', 'description', 'ordering', 'field1', 'field2'],
    audio: ['name', 'type', 'size', 'description', 'duration', 'ordering', 'field1', 'field2'],
    video: ['name', 'type', 'size', 'description', 'duration', 'width', 'height', 'ordering', 'field1', 'field2'],
};

function pick(data, keys) {
    const out = {};
    for (const k of keys) if (data[k] !== undefined) out[k] = data[k];
    return out;
}

function mediaFolder(config, entity) {
    if (entity === 'image') return config.imagesFolderPath;
    if (entity === 'audio') return config.audiosFolderPath;
    return config.videosFolderPath;
}

// Applies `bundle` (from readBundle) to the live DB behind `sequelize`.
// Returns a summary: { alreadyApplied, bundleId, applied, skipped,
// mediaWritten, articleCount, warnings }.
export async function applyBundle(sequelize, config, bundle) {
    const { manifest, ops, mediaIndex, getMediaBuffer } = bundle;
    const M = sequelize.models;

    // Idempotency: a bundleId that's already in applied_bundles is a no-op.
    const already = await M.appliedBundle.findOne({ where: { bundleId: manifest.bundleId } });
    if (already) {
        return {
            alreadyApplied: true,
            bundleId: manifest.bundleId,
            applied: 0,
            skipped: 0,
            mediaWritten: 0,
            mediaDeleted: 0,
            articleCount: Array.isArray(manifest.articles) ? manifest.articles.length : 0,
            articleEffects: [],
            warnings: [],
        };
    }

    const transaction = await sequelize.transaction();

    const warnings = [];
    let applied = 0;
    let skipped = 0;
    let mediaWritten = 0;
    // Media rows (and their files) pruned by the authoritative-media-set
    // reconciliation in the post-pass — see that block for the contract.
    let mediaDeleted = 0;
    // Per-article record of what the apply actually changed, surfaced to the
    // user after import: { title, effect: 'new' | 'updated' | 'deleted' }.
    // Only rows that genuinely changed (passed the revision gate) are listed.
    const articleEffects = [];

    // uuid -> local id, and uuid -> local revision, per model. Preloaded once
    // and kept live as we insert so later ops in the same bundle resolve FKs
    // to rows created earlier in this very apply.
    const idByUuid = {};
    const revByUuid = {};
    // name -> id for the UNIQUE-name dictionary tables.
    const idByName = {};

    const resolveId = (modelName, uuid) =>
        (uuid == null ? null : (idByUuid[modelName].get(uuid) ?? null));

    // For the post-apply tiptap media resolution pass: which articles/comments
    // we actually wrote (so we only rewrite those), and the local row info for
    // every media uuid we inserted/updated in this bundle.
    const appliedArticleUuids = new Set();
    const appliedCommentUuids = new Set();
    const mediaInfoByUuid = new Map();

    try {
        for (const name of SYNCABLE_MODELS) {
            const isJunction = JUNCTION_MODELS.has(name);
            const rows = await M[name].findAll({
                attributes: isJunction ? ['uuid', 'revision'] : ['id', 'uuid', 'revision'],
                transaction,
            });
            const im = new Map();
            const rm = new Map();
            for (const r of rows) {
                // Junctions have no `id`; store the uuid itself as a truthy
                // existence marker (junction ids are never used as FK targets).
                if (r.uuid) { im.set(r.uuid, isJunction ? r.uuid : r.id); rm.set(r.uuid, r.revision || 0); }
            }
            idByUuid[name] = im;
            revByUuid[name] = rm;
        }
        for (const name of DICT_ENTITIES) {
            const rows = await M[name].findAll({ attributes: ['id', 'name'], transaction });
            const nm = new Map();
            for (const r of rows) if (r.name != null) nm.set(r.name, r.id);
            idByName[name] = nm;
        }

        // Stable sort by APPLY_ORDER so a hand-assembled bundle still applies
        // dependency-first (desktop's own writer already emits in this order).
        const orderIndex = new Map(APPLY_ORDER.map((e, i) => [e, i]));
        const sortedOps = ops
            .map((op, i) => ({ op, i }))
            .sort((a, b) => {
                const oa = orderIndex.get(a.op.entity) ?? 999;
                const ob = orderIndex.get(b.op.entity) ?? 999;
                return oa - ob || a.i - b.i;
            })
            .map((x) => x.op);

        for (const op of sortedOps) {
            const entity = op.entity;
            const modelName = ENTITY_TO_MODEL[entity];
            if (!modelName || !M[modelName]) {
                warnings.push(`Unknown entity "${entity}"; skipping op ${op.uuid}`);
                skipped++;
                continue;
            }
            const incomingRev = op.revision != null ? op.revision : 1;

            // ----- deletes (only `article` deletes are emitted in v1) -----
            if (op.type === 'delete') {
                if (entity !== 'article') {
                    warnings.push(`Delete for entity "${entity}" not supported; skipping ${op.uuid}`);
                    skipped++;
                    continue;
                }
                const localId = idByUuid.article.get(op.uuid);
                if (localId == null) { skipped++; continue; }
                const localRev = revByUuid.article.get(op.uuid) || 0;
                if (REVISION_GATE_ENABLED && incomingRev <= localRev) { skipped++; continue; }
                // Capture the title before the row is gone so we can report it.
                const doomed = await M.article.findOne({ attributes: ['title'], where: { id: localId }, transaction });
                await cascadeDeleteArticle(M, config, localId, transaction);
                idByUuid.article.delete(op.uuid);
                revByUuid.article.delete(op.uuid);
                articleEffects.push({ title: (doomed && doomed.title) || op.uuid, effect: 'deleted' });
                applied++;
                continue;
            }

            // ----- upserts -----
            const data = op.data || {};

            if (DICT_ENTITIES.has(entity)) {
                const fields = pick(data, FIELDS[entity]);

                if (idByUuid[modelName].has(op.uuid)) {
                    const localRev = revByUuid[modelName].get(op.uuid) || 0;
                    if (REVISION_GATE_ENABLED && incomingRev <= localRev) { skipped++; continue; }
                    const id = idByUuid[modelName].get(op.uuid);
                    await M[modelName].update({ ...fields, revision: incomingRev }, { where: { id }, hooks: false, transaction });
                    revByUuid[modelName].set(op.uuid, incomingRev);
                    if (fields.name != null) idByName[modelName].set(fields.name, id);
                    applied++;
                    continue;
                }
                // New uuid, but name already taken -> map onto existing row.
                if (fields.name != null && idByName[modelName].has(fields.name)) {
                    const existingId = idByName[modelName].get(fields.name);
                    idByUuid[modelName].set(op.uuid, existingId);
                    revByUuid[modelName].set(op.uuid, incomingRev);
                    skipped++;
                    continue;
                }
                const created = await M[modelName].create({ ...fields, uuid: op.uuid, revision: incomingRev }, { hooks: false, transaction });
                idByUuid[modelName].set(op.uuid, created.id);
                revByUuid[modelName].set(op.uuid, incomingRev);
                if (fields.name != null) idByName[modelName].set(fields.name, created.id);
                applied++;
                continue;
            }

            if (entity === 'article') {
                // Snapshot existence before the upsert so we can tell a brand-new
                // article apart from an update to one already in the library.
                const existedBefore = idByUuid.article.has(op.uuid);
                const fields = pick(data, FIELDS.article);
                fields.ownerId = resolveId('owner', data.ownerUuid);
                fields.categoryId = resolveId('category', data.categoryUuid);
                const res = await upsertByUuid(M.article, idByUuid.article, revByUuid.article, op.uuid, incomingRev, fields, transaction);
                if (res === 'applied') {
                    appliedArticleUuids.add(op.uuid);
                    articleEffects.push({ title: fields.title || op.uuid, effect: existedBefore ? 'updated' : 'new' });
                }
                tally(res);
                continue;
            }

            if (entity === 'comment') {
                const articleId = resolveId('article', data.articleUuid);
                if (articleId == null) { warnings.push(`Comment ${op.uuid}: article ${data.articleUuid} not present; skipping`); skipped++; continue; }
                const fields = pick(data, FIELDS.comment);
                fields.articleId = articleId;
                fields.ownerId = resolveId('owner', data.ownerUuid);
                const res = await upsertByUuid(M.comment, idByUuid.comment, revByUuid.comment, op.uuid, incomingRev, fields, transaction);
                if (res === 'applied') appliedCommentUuids.add(op.uuid);
                tally(res);
                continue;
            }

            if (entity === 'annotation') {
                const articleId = resolveId('article', data.articleUuid);
                if (articleId == null) { warnings.push(`Annotation ${op.uuid}: article ${data.articleUuid} not present; skipping`); skipped++; continue; }
                const fields = pick(data, FIELDS.annotation);
                fields.articleId = articleId;
                const res = await upsertByUuid(M.annotation, idByUuid.annotation, revByUuid.annotation, op.uuid, incomingRev, fields, transaction);
                tally(res);
                continue;
            }

            if (MEDIA_ENTITIES.has(entity)) {
                const articleId = resolveId('article', data.articleUuid);
                if (articleId == null) { warnings.push(`${entity} ${op.uuid}: article ${data.articleUuid} not present; skipping`); skipped++; continue; }

                // Revision gate first so we don't overwrite a newer local file
                // with older bundle bytes.
                if (idByUuid[entity].has(op.uuid)) {
                    const localRev = revByUuid[entity].get(op.uuid) || 0;
                    if (REVISION_GATE_ENABLED && incomingRev <= localRev) { skipped++; continue; }
                }

                const meta = mediaIndex.get(op.uuid);
                const ext = meta ? meta.ext : '';
                const relPath = ext ? `${op.uuid}.${ext}` : op.uuid;
                const buf = await getMediaBuffer(op.uuid);
                if (buf) {
                    const folder = mediaFolder(config, entity);
                    ensureFolderExists(folder);
                    await fs.writeFile(path.join(folder, relPath), buf);
                    mediaWritten++;
                } else {
                    warnings.push(`${entity} ${op.uuid}: media bytes not found in bundle`);
                }

                const fields = pick(data, FIELDS[entity]);
                fields.articleId = articleId;
                fields.path = relPath;
                // name/type are NOT NULL on the media tables — backfill defensively.
                if (fields.name == null) fields.name = relPath;
                if (fields.type == null) fields.type = ext || 'application/octet-stream';
                const res = await upsertByUuid(M[entity], idByUuid[entity], revByUuid[entity], op.uuid, incomingRev, fields, transaction);
                // Record local row info so the post-pass can re-link embedded
                // media nodes (uuid -> local id/path) in article/comment bodies.
                mediaInfoByUuid.set(op.uuid, {
                    id: idByUuid[entity].get(op.uuid),
                    name: fields.name,
                    type: fields.type,
                    path: fields.path,
                    size: fields.size != null ? fields.size : null,
                    description: fields.description != null ? fields.description : null,
                    duration: fields.duration != null ? fields.duration : null,
                    width: fields.width != null ? fields.width : null,
                    height: fields.height != null ? fields.height : null,
                });
                tally(res);
                continue;
            }

            // ----- junctions -----
            if (entity === 'articleTagRel' || entity === 'articleGroupRel' || entity === 'articleArticleRel') {
                const articleId = resolveId('article', data.articleUuid);
                let fields;
                let pairWhere;
                if (entity === 'articleTagRel') {
                    const tagId = resolveId('tag', data.tagUuid);
                    if (articleId == null || tagId == null) { skipped++; continue; }
                    fields = { articleId, tagId, tagOrdering: data.tagOrdering ?? null };
                    pairWhere = { articleId, tagId };
                } else if (entity === 'articleGroupRel') {
                    const groupId = resolveId('group', data.groupUuid);
                    if (articleId == null || groupId == null) { skipped++; continue; }
                    fields = { articleId, groupId, groupOrdering: data.groupOrdering ?? null };
                    pairWhere = { articleId, groupId };
                } else {
                    const relatedArticleId = resolveId('article', data.relatedArticleUuid);
                    if (articleId == null || relatedArticleId == null) { skipped++; continue; }
                    fields = { articleId, relatedArticleId, relatedArticleOrdering: data.relatedArticleOrdering ?? null };
                    pairWhere = { articleId, relatedArticleId };
                }

                // Junctions are keyed/updated by uuid (composite-PK tables
                // have no `id`).
                if (idByUuid[modelName].has(op.uuid)) {
                    const localRev = revByUuid[modelName].get(op.uuid) || 0;
                    if (REVISION_GATE_ENABLED && incomingRev <= localRev) { skipped++; continue; }
                    await M[modelName].update({ ...fields, revision: incomingRev }, { where: { uuid: op.uuid }, hooks: false, transaction });
                    revByUuid[modelName].set(op.uuid, incomingRev);
                    applied++;
                    continue;
                }
                // Same logical relation may already exist under a different
                // uuid (e.g. its tag was deduped by name). Don't double-insert.
                const existing = await M[modelName].findOne({ where: pairWhere, transaction });
                if (existing) {
                    idByUuid[modelName].set(op.uuid, op.uuid);
                    revByUuid[modelName].set(op.uuid, incomingRev);
                    skipped++;
                    continue;
                }
                await M[modelName].create({ ...fields, uuid: op.uuid, revision: incomingRev }, { hooks: false, transaction });
                idByUuid[modelName].set(op.uuid, op.uuid);
                revByUuid[modelName].set(op.uuid, incomingRev);
                applied++;
                continue;
            }

            warnings.push(`Unhandled entity "${entity}"; skipping ${op.uuid}`);
            skipped++;
        }

        // ----- post-pass: re-link embedded media (uuid -> local id/path) -----
        // Only for articles/comments we actually wrote this run; skipped rows
        // already hold the local renderer's id/path and must not be touched.
        const articleIdsToRewrite = [...appliedArticleUuids]
            .map((u) => idByUuid.article.get(u)).filter((id) => id != null);
        const commentIdsToRewrite = [...appliedCommentUuids]
            .map((u) => idByUuid.comment.get(u)).filter((id) => id != null);

        if (articleIdsToRewrite.length || commentIdsToRewrite.length) {
            const arts = articleIdsToRewrite.length
                ? await M.article.findAll({ where: { id: { [Op.in]: articleIdsToRewrite } }, transaction })
                : [];
            const cmts = commentIdsToRewrite.length
                ? await M.comment.findAll({ where: { id: { [Op.in]: commentIdsToRewrite } }, transaction })
                : [];

            // Some embedded media may belong to a previously-imported bundle
            // (not this one) — backfill their local info from the DB.
            const referenced = new Set();
            for (const a of arts) {
                collectMediaUuids(a.textTiptapJson, referenced);
                collectMediaUuids(a.explanationTiptapJson, referenced);
            }
            for (const c of cmts) collectMediaUuids(c.tiptapTextJson, referenced);
            const missing = [...referenced].filter((u) => !mediaInfoByUuid.has(u));
            if (missing.length) {
                for (const entity of ['image', 'audio', 'video']) {
                    const rows = await M[entity].findAll({ where: { uuid: { [Op.in]: missing } }, transaction });
                    for (const r of rows) {
                        mediaInfoByUuid.set(r.uuid, {
                            id: r.id, name: r.name, type: r.type, path: r.path,
                            size: r.size != null ? r.size : null,
                            description: r.description != null ? r.description : null,
                            duration: r.duration != null ? r.duration : null,
                            width: r.width != null ? r.width : null,
                            height: r.height != null ? r.height : null,
                        });
                    }
                }
            }

            for (const a of arts) {
                const r1 = resolveTiptapMedia(a.textTiptapJson, mediaInfoByUuid);
                const r2 = resolveTiptapMedia(a.explanationTiptapJson, mediaInfoByUuid);
                const h1 = await resolveHtmlMedia(a.text, mediaInfoByUuid);
                const h2 = await resolveHtmlMedia(a.explanation, mediaInfoByUuid);
                if (r1.changed || r2.changed || h1.changed || h2.changed) {
                    const upd = {};
                    if (r1.changed) upd.textTiptapJson = r1.doc;
                    if (r2.changed) upd.explanationTiptapJson = r2.doc;
                    if (h1.changed) upd.text = h1.html;
                    if (h2.changed) upd.explanation = h2.html;
                    await M.article.update(upd, { where: { id: a.id }, hooks: false, transaction });
                }
            }
            for (const c of cmts) {
                const r = resolveTiptapMedia(c.tiptapTextJson, mediaInfoByUuid);
                const h = await resolveHtmlMedia(c.text, mediaInfoByUuid);
                if (r.changed || h.changed) {
                    const upd = {};
                    if (r.changed) upd.tiptapTextJson = r.doc;
                    if (h.changed) upd.text = h.html;
                    await M.comment.update(upd, { where: { id: c.id }, hooks: false, transaction });
                }
            }
        }

        // ----- post-pass: reconcile the authoritative media set -----
        // The bundle's article is authoritative for its own attachments: for
        // every article we actually wrote this run, delete any local media
        // (rows + files) whose uuid the incoming bundle's article no longer
        // includes. This turns a media-less or partial-media update into a
        // prune instead of leaving the recipient's removed attachments
        // orphaned. Articles whose upsert was revision-gated (skipped) are NOT
        // in appliedArticleUuids, so their media is never touched.
        if (appliedArticleUuids.size > 0) {
            // uuid set of media the bundle claims for each article, regardless
            // of whether each media op itself passed its own revision gate (a
            // skipped-but-present media uuid is still part of the set, so we
            // keep the local copy rather than prune it).
            const bundleMediaUuidsByArticleUuid = new Map();
            for (const op of ops) {
                if (op.type === 'upsert' && MEDIA_ENTITIES.has(op.entity)) {
                    const au = op.data && op.data.articleUuid;
                    if (au == null) continue;
                    let set = bundleMediaUuidsByArticleUuid.get(au);
                    if (!set) { set = new Set(); bundleMediaUuidsByArticleUuid.set(au, set); }
                    set.add(op.uuid);
                }
            }
            for (const articleUuid of appliedArticleUuids) {
                const localArticleId = idByUuid.article.get(articleUuid);
                if (localArticleId == null) continue;
                const keep = bundleMediaUuidsByArticleUuid.get(articleUuid) || new Set();
                const { deleted, deletedIds } = await reconcileArticleMedia(M, config, localArticleId, keep, transaction);
                mediaDeleted += deleted;
                // Scrub the now-dangling media nodes out of this article and
                // its comments — including revision-gated (skipped) comment
                // bodies, which the upsert pass never rewrote and would
                // otherwise still embed the deleted attachments.
                if (deletedIds.size > 0) {
                    await stripDanglingMediaRefs(M, localArticleId, deletedIds, transaction);
                }
            }
        }

        await M.appliedBundle.create({
            bundleId: manifest.bundleId,
            appliedAt: new Date().toISOString(),
            opCount: manifest.opCount != null ? manifest.opCount : ops.length,
            articleCount: Array.isArray(manifest.articles) ? manifest.articles.length : 0,
            sourceApp: manifest.sourceApp || 'unknown',
            sourceAppVersion: manifest.sourceAppVersion || null,
            schemaVersion: manifest.schemaVersion != null ? manifest.schemaVersion : 1,
        }, { transaction });

        await transaction.commit();
    } catch (err) {
        await transaction.rollback();
        throw err;
    }

    return {
        alreadyApplied: false,
        bundleId: manifest.bundleId,
        applied,
        skipped,
        mediaWritten,
        mediaDeleted,
        articleCount: Array.isArray(manifest.articles) ? manifest.articles.length : 0,
        articleEffects,
        warnings,
    };

    // ---- closures over the counters used by the entity branches above ----
    function tally(res) {
        if (res === 'applied') applied++;
        else skipped++;
    }
}

// Insert or revision-gated update keyed on uuid. Returns 'applied' or
// 'skipped'. Mutates the supplied id/rev maps so later ops resolve FKs.
async function upsertByUuid(Model, idMap, revMap, uuid, incomingRev, fields, transaction) {
    if (idMap.has(uuid)) {
        const localRev = revMap.get(uuid) || 0;
        if (REVISION_GATE_ENABLED && incomingRev <= localRev) return 'skipped';
        const id = idMap.get(uuid);
        await Model.update({ ...fields, revision: incomingRev }, { where: { id }, hooks: false, transaction });
        revMap.set(uuid, incomingRev);
        return 'applied';
    }
    const created = await Model.create({ ...fields, uuid, revision: incomingRev }, { hooks: false, transaction });
    idMap.set(uuid, created.id);
    revMap.set(uuid, incomingRev);
    return 'applied';
}

// Prunes the local media of one article down to the bundle's authoritative
// set: deletes every image/audio/video row for `articleId` whose uuid is not
// in `keepUuids`, unlinking the file before destroying the row (so a failed
// unlink aborts the transaction rather than orphaning bytes). A local media
// row with no uuid is purely local and not in the bundle's set, so it is
// pruned too. Returns { deleted, deletedIds } where deletedIds holds every
// pruned row's local id in both number and string form (tiptap attrs.id type
// is not guaranteed) so callers can scrub dangling node references.
async function reconcileArticleMedia(M, config, articleId, keepUuids, transaction) {
    let deleted = 0;
    const deletedIds = new Set();
    for (const [entity, folderKey] of [['image', 'imagesFolderPath'], ['audio', 'audiosFolderPath'], ['video', 'videosFolderPath']]) {
        const rows = await M[entity].findAll({ where: { articleId }, transaction });
        for (const r of rows) {
            if (r.uuid && keepUuids.has(r.uuid)) continue;
            if (r.path) await safeUnlink(path.join(config[folderKey], r.path));
            await r.destroy({ hooks: false, transaction });
            deletedIds.add(r.id);
            deletedIds.add(String(r.id));
            deleted++;
        }
    }
    return { deleted, deletedIds };
}

// Removes references to just-deleted media (by local id) from an article's
// own tiptap bodies and every one of its comments' tiptap bodies. This is
// the cleanup half of media reconciliation: the rows are gone, so any body
// still embedding them — notably revision-gated comment bodies the upsert
// pass left untouched — must drop those nodes or they render broken.
async function stripDanglingMediaRefs(M, articleId, deletedIds, transaction) {
    const art = await M.article.findOne({
        attributes: ['id', 'text', 'textTiptapJson', 'explanation', 'explanationTiptapJson'],
        where: { id: articleId },
        transaction,
    });
    if (art) {
        const t = stripMediaNodesById(art.textTiptapJson, deletedIds);
        const e = stripMediaNodesById(art.explanationTiptapJson, deletedIds);
        const h1 = await stripHtmlMediaById(art.text, deletedIds);
        const h2 = await stripHtmlMediaById(art.explanation, deletedIds);
        if (t.changed || e.changed || h1.changed || h2.changed) {
            const upd = {};
            if (t.changed) upd.textTiptapJson = t.doc;
            if (e.changed) upd.explanationTiptapJson = e.doc;
            if (h1.changed) upd.text = h1.html;
            if (h2.changed) upd.explanation = h2.html;
            await M.article.update(upd, { where: { id: articleId }, hooks: false, transaction });
        }
    }

    const comments = await M.comment.findAll({
        attributes: ['id', 'text', 'tiptapTextJson'],
        where: { articleId },
        transaction,
    });
    for (const c of comments) {
        const r = stripMediaNodesById(c.tiptapTextJson, deletedIds);
        const h = await stripHtmlMediaById(c.text, deletedIds);
        if (r.changed || h.changed) {
            const upd = {};
            if (r.changed) upd.tiptapTextJson = r.doc;
            if (h.changed) upd.text = h.html;
            await M.comment.update(upd, { where: { id: c.id }, hooks: false, transaction });
        }
    }
}

// Hard-deletes an article and everything hanging off it, unlinking media
// bytes first (so a failed unlink aborts the transaction rather than
// orphaning files). Mirrors the desktop's own cascade on article delete.
async function cascadeDeleteArticle(M, config, articleId, transaction) {
    for (const [entity, folderKey] of [['image', 'imagesFolderPath'], ['audio', 'audiosFolderPath'], ['video', 'videosFolderPath']]) {
        const rows = await M[entity].findAll({ where: { articleId }, transaction });
        for (const r of rows) {
            if (r.path) await safeUnlink(path.join(config[folderKey], r.path));
            await r.destroy({ hooks: false, transaction });
        }
    }
    await M.comment.destroy({ where: { articleId }, hooks: false, transaction });
    await M.annotation.destroy({ where: { articleId }, hooks: false, transaction });
    await M.article_tag_rel.destroy({ where: { articleId }, hooks: false, transaction });
    await M.article_group_rel.destroy({ where: { articleId }, hooks: false, transaction });
    await M.article_article_rel.destroy({
        where: { [Op.or]: [{ articleId }, { relatedArticleId: articleId }] },
        hooks: false,
        transaction,
    });
    await M.article.destroy({ where: { id: articleId }, hooks: false, transaction });
}
