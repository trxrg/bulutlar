// Shared sync wire-format types. JSDoc-only (no TS in this repo per
// docs/mobile-sync-plan.md §3a / Q1). The mobile app should copy this file
// verbatim so both sides agree on the on-disk contract.
//
// The only RUNTIME export is APPLY_ORDER, used by:
//   - desktop emitter (Phase 3): sort coalesced ops dependency-first.
//   - mobile applier:            iterate entities in this order so FKs
//                                resolve without deferred-FK transactions.
//
// Per-entity `*Data` typedefs intentionally omit local primary keys (`id`)
// and timestamp columns (`createdAt`/`updatedAt`); identity travels in the
// Op envelope via `uuid`. Foreign keys are resolved to `*Uuid` strings so
// the receiver can re-link them to its own local INTEGER ids.
//
// Tiptap media-node rewrite (Q4 / §3e) emits TiptapMediaNodeAttrs for every
// imageNode / audioNode / videoNode embedded in textTiptapJson /
// explanationTiptapJson / tiptapTextJson. Phase 3's rewriter strips
// everything else from the original `attrs` (path, id, type, size, ...).

/**
 * Order in which entity types must be emitted in operations.json and applied
 * on the receiver. Owner / Category / Tag / Group come before Article so the
 * article's FKs resolve; junctions come last so both sides of the relation
 * already exist.
 *
 * @type {ReadonlyArray<EntityType>}
 */
export const APPLY_ORDER = Object.freeze([
    'owner',
    'category',
    'tag',
    'group',
    'article',
    'comment',
    'annotation',
    'image',
    'audio',
    'video',
    'articleTagRel',
    'articleGroupRel',
    'articleArticleRel',
]);

// =====================================================================
// Wire format envelope
// =====================================================================

/**
 * Discriminator value for the `entity` field on every Operation. Matches
 * APPLY_ORDER; junction names use camelCase (`articleTagRel`, not the
 * SQL-table `article_tag_rel`).
 *
 * @typedef {(
 *   'article'  | 'owner'      | 'category'  | 'tag'   | 'group' |
 *   'comment'  | 'annotation' | 'image'     | 'audio' | 'video' |
 *   'articleTagRel' | 'articleGroupRel' | 'articleArticleRel'
 * )} EntityType
 */

/**
 * Top-level manifest written to manifest.json at the root of every .blt
 * bundle. See docs/mobile-sync-plan.md §6.
 *
 * @typedef {Object} Manifest
 * @property {'bulutlar-sync'} format               Always SYNC_FORMAT.
 * @property {number}          formatVersion        Always SYNC_FORMAT_VERSION (1 in v1).
 * @property {string}          bundleId             Per-export ULID; primary key on the receiver's applied_bundles.
 * @property {string}          createdAt            ISO-8601 UTC timestamp of export.
 * @property {string}          sourceApp            Always SYNC_SOURCE_APP ('bulutlar-desktop').
 * @property {string}          sourceAppVersion     From electron `app.getVersion()` at runtime — NOT package.json (asar can lie). §4.
 * @property {number}          schemaVersion        Bundle's schema version; SYNC_SCHEMA_VERSION at emit time.
 * @property {number}          opCount              Number of entries in operations.json.
 * @property {number}          mediaCount           Number of files under media/.
 * @property {number}          totalSizeBytes       Uncompressed byte total of operations.json + every media file.
 * @property {string}          operationsChecksum   `sha256:<hex>` over operations.json bytes. §4 Issues with checksum.
 * @property {Object<string, string>} mediaChecksums Map of media `uuid` -> `sha256:<hex>` over the media file bytes.
 * @property {string[]}        articles             Array of article uuids included; lets mobile preview without parsing operations.json.
 * @property {number}          partIndex            Always 1 in v1 (no multi-part).
 * @property {number}          partTotal            Always 1 in v1.
 */

/**
 * Operation union — operations.json is `{ "ops": Operation[] }`.
 *
 * @typedef {UpsertOp | DeleteOp} Operation
 */

/**
 * Insert-or-update op. `data` shape is per-entity; see *Data typedefs below.
 * `revision` is the live row's revision at export time; mobile applies the
 * upsert iff its local revision is < this value (last-writer-wins per §7).
 *
 * @typedef {Object} UpsertOp
 * @property {'upsert'}    type
 * @property {EntityType}  entity
 * @property {string}      uuid
 * @property {number}      revision
 * @property {EntityData}  data
 */

/**
 * Tombstone op. No body; mobile applies the delete iff its local revision
 * is < this value.
 *
 * @typedef {Object} DeleteOp
 * @property {'delete'}    type
 * @property {EntityType}  entity
 * @property {string}      uuid
 * @property {number}      revision
 */

/**
 * Discriminated union over all per-entity `data` shapes. Use the `entity`
 * field on the parent UpsertOp to narrow.
 *
 * @typedef {(
 *   ArticleData    | OwnerData         | CategoryData       |
 *   TagData        | GroupData         | CommentData        |
 *   AnnotationData | ImageData         | AudioData          |
 *   VideoData      | ArticleTagRelData | ArticleGroupRelData|
 *   ArticleArticleRelData
 * )} EntityData
 */

// =====================================================================
// Tiptap media-node attrs (Q4)
// =====================================================================

/**
 * Surviving fields on imageNode / audioNode / videoNode `attrs` after the
 * Phase 3 tiptap rewriter walks textTiptapJson / explanationTiptapJson /
 * tiptapTextJson. `name` and `description` are kept as a display fallback
 * (Q4: uuid-plus-display) so mobile renders something useful even if the
 * media row fails to apply.
 *
 * Phase 3 rewriter MUST drop the original `id`, `path`, `type`, `size` —
 * those are desktop-local or recomputable on the receiver.
 *
 * @typedef {Object} TiptapMediaNodeAttrs
 * @property {string}  uuid          Matches one of {Image,Audio,Video}Data.uuid in the same bundle.
 * @property {string}  [name]        Original filename or display name; optional but recommended for fallback rendering.
 * @property {string}  [description] User-supplied description; optional.
 */

// =====================================================================
// Per-entity data shapes
// =====================================================================
//
// One typedef per syncable entity. Every shape excludes `id` (local PK),
// `uuid`/`revision` (live on the Op envelope), and `createdAt`/`updatedAt`
// (Sequelize-managed; receiver writes its own). Tiptap JSON columns carry
// rewritten media-node attrs per TiptapMediaNodeAttrs.

/**
 * Article row data. `ownerUuid` / `categoryUuid` are resolved from local
 * `ownerId` / `categoryId` at emit time (§4b). Tiptap JSON columns must be
 * pre-rewritten so embedded media nodes carry only TiptapMediaNodeAttrs.
 *
 * `code` is a legacy desktop-side random id (§3c); kept verbatim so
 * round-tripping back to desktop wouldn't collide, but mobile is free to
 * ignore it.
 *
 * @typedef {Object} ArticleData
 * @property {string}        title
 * @property {string|null}   [date]                 ISO-8601 or null.
 * @property {number|null}   [number]
 * @property {string|null}   [date2]
 * @property {number|null}   [number2]
 * @property {number|null}   [ordering]
 * @property {string|null}   [explanation]
 * @property {Object|null}   [explanationJson]      Legacy draft-js JSON; kept opaque.
 * @property {Object|null}   [explanationTiptapJson] Tiptap doc with TiptapMediaNodeAttrs on media nodes.
 * @property {string|null}   [text]
 * @property {Object|null}   [textJson]             Legacy draft-js JSON; kept opaque.
 * @property {Object|null}   [textTiptapJson]       Tiptap doc with TiptapMediaNodeAttrs on media nodes.
 * @property {string|null}   [code]
 * @property {boolean}       [isEditable]
 * @property {boolean}       [isDateUncertain]
 * @property {boolean}       [isStarred]
 * @property {boolean}       [isPublished]
 * @property {boolean}       [isDeleted]
 * @property {boolean}       [isArchived]
 * @property {boolean}       [isDraft]
 * @property {boolean}       [isHidden]
 * @property {boolean}       [isProtected]
 * @property {boolean}       [isFeatured]
 * @property {boolean}       [isPinned]
 * @property {boolean}       [isPrivate]
 * @property {boolean}       [isRead]
 * @property {string|null}   [field1]
 * @property {string|null}   [field2]
 * @property {string|null}   [field3]
 * @property {string|null}   ownerUuid              FK resolution of articles.ownerId.
 * @property {string|null}   categoryUuid           FK resolution of articles.categoryId.
 */

/**
 * @typedef {Object} OwnerData
 * @property {string}        name
 * @property {number|null}   [ordering]
 * @property {string|null}   [field1]
 * @property {string|null}   [field2]
 */

/**
 * @typedef {Object} CategoryData
 * @property {string}        name
 * @property {string|null}   [color]
 * @property {number|null}   [ordering]
 * @property {string|null}   [field1]
 * @property {string|null}   [field2]
 */

/**
 * @typedef {Object} TagData
 * @property {string}        name
 * @property {number|null}   [ordering]
 * @property {string|null}   [field1]
 * @property {string|null}   [field2]
 */

/**
 * @typedef {Object} GroupData
 * @property {string}        name
 * @property {number|null}   [ordering]
 * @property {string|null}   [field1]
 * @property {string|null}   [field2]
 */

/**
 * Comment row. `articleUuid` resolved from `articleId`; `ownerUuid` from
 * `ownerId` (the comments table has both FKs per relations.js).
 *
 * @typedef {Object} CommentData
 * @property {string}        articleUuid
 * @property {string|null}   [ownerUuid]
 * @property {string|null}   [date]
 * @property {string|null}   [text]
 * @property {Object|null}   [textJson]             Legacy draft-js JSON.
 * @property {Object|null}   [tiptapTextJson]       Tiptap doc with TiptapMediaNodeAttrs on media nodes.
 * @property {number|null}   [ordering]
 * @property {string|null}   [field1]
 * @property {string|null}   [field2]
 */

/**
 * @typedef {Object} AnnotationData
 * @property {string}        articleUuid
 * @property {string|null}   [quote]
 * @property {string|null}   [note]
 * @property {number|null}   [ordering]
 * @property {string|null}   [field1]
 * @property {string|null}   [field2]
 */

/**
 * Image row. The on-disk file lives at `media/images/<uuid>.<type>` inside
 * the bundle (§4c); the desktop's local `path` column is NOT carried — the
 * receiver writes its own.
 *
 * @typedef {Object} ImageData
 * @property {string}        articleUuid
 * @property {string}        name
 * @property {string}        type                   File extension / mime suffix (e.g. 'jpg').
 * @property {number|null}   [size]                 Bytes.
 * @property {string|null}   [description]
 * @property {number|null}   [ordering]
 * @property {string|null}   [field1]
 * @property {string|null}   [field2]
 */

/**
 * Audio row. File at `media/audios/<uuid>.<type>`. Same path-omission rule
 * as ImageData.
 *
 * @typedef {Object} AudioData
 * @property {string}        articleUuid
 * @property {string}        name
 * @property {string}        type
 * @property {number|null}   [size]
 * @property {string|null}   [description]
 * @property {number|null}   [duration]             Seconds.
 * @property {number|null}   [ordering]
 * @property {string|null}   [field1]
 * @property {string|null}   [field2]
 */

/**
 * Video row. File at `media/videos/<uuid>.<type>`. Same path-omission rule
 * as ImageData.
 *
 * @typedef {Object} VideoData
 * @property {string}        articleUuid
 * @property {string}        name
 * @property {string}        type
 * @property {number|null}   [size]
 * @property {string|null}   [description]
 * @property {number|null}   [duration]
 * @property {number|null}   [width]
 * @property {number|null}   [height]
 * @property {number|null}   [ordering]
 * @property {string|null}   [field1]
 * @property {string|null}   [field2]
 */

// Junction rows are first-class syncable entities (§3d / Q2): each has its
// own uuid + revision, and emits separate Ops rather than embedding into
// article.data. tagOrdering / groupOrdering / relatedArticleOrdering are
// preserved bit-for-bit so the UI's drag-to-reorder state survives sync.

/**
 * @typedef {Object} ArticleTagRelData
 * @property {string}        articleUuid
 * @property {string}        tagUuid
 * @property {number|null}   [tagOrdering]
 */

/**
 * @typedef {Object} ArticleGroupRelData
 * @property {string}        articleUuid
 * @property {string}        groupUuid
 * @property {number|null}   [groupOrdering]
 */

/**
 * @typedef {Object} ArticleArticleRelData
 * @property {string}        articleUuid
 * @property {string}        relatedArticleUuid
 * @property {number|null}   [relatedArticleOrdering]
 */
