# Bulutlar Desktop → Mobile Sync — Plan & Review

Status: **Phases 0a + 0b v2 + 0c + 1 + 3 complete. uuid + revision on all 13 syncable tables (incl. junctions). `sync_outbox` populated atomically by Sequelize after-hooks; pointer-only (no payload). Article-cascade wrapped in a single transaction; media-service deleters now `safeUnlink` before DB destroy. Wire-format contract locked: JSDoc typedefs + frozen constants triple in `backend/sync/`. Engine tables: `applied_bundles`, `exported_bundles`, `exported_bundle_articles`. Phase 3 (export feature) shipped: `Settings → Sharing → Generate Update Bundle` UI; `SharingService.getCandidates()` classifies articles into created/updated/unchanged + auto-included deletions; `exportBundle()` emits `.blt` zip via `bundleBuilder.js` (FK→uuid, tiptap media-attr rewrite, sha256 op + media checksums) inside one transaction that also writes `exported_bundles` + `exported_bundle_articles` and stamps `sync_outbox.exportedAt`. Next: Phase 5 (history UI, multi-part splitting, schema-version-aware export) and the mobile applier (depends only on `backend/sync/types.js` + a sample `.blt`).**
Last updated: 2026-04-29

---

## 0. Implementation log

What's actually landed on the desktop side, in chronological order. Treat
this section as the source of truth for "what's already done"; the rest of
the document is the original plan + review and may not be re-edited as
phases ship.

### 2026-04-28 — Phase 0a + 0c shipped together

Added `uuid` (UUIDv7) and `revision` columns to every syncable table —
including the three junction tables — and wired automatic maintenance via
Sequelize hooks. No service code was edited; the ~70 `.create()` /
`.update()` / `.destroy()` call sites all keep working unchanged because
hooks fire on every Sequelize write path.

**New files**

- `backend/sync/syncableModels.js` — `SYNCABLE_MODELS` array, the single
  source of truth for which models participate in sync (10 entities + 3
  junctions = 13).
- `backend/sync/backfill.js` — `backfillUuids(sequelize)`. Idempotent;
  reads PK names from `Model.primaryKeyAttributes` so it works for both
  `id`-PK entity tables and the composite-PK junctions; uses
  `{ hooks: false }` so it doesn't bump `revision`.
- `backend/sync/hooks.js` — `registerSyncHooks(sequelize)`. Wires
  `beforeCreate` / `beforeBulkCreate` / `beforeUpdate` / `beforeBulkUpdate`
  on each syncable model. The bulk-update branch pushes `'revision'` into
  `options.fields` so Sequelize 6 doesn't filter it out before SQL is
  generated (real bug caught during smoke testing).

**Schema changes**

- All 10 entity model files declare:
  ```js
  uuid:     { type: DataTypes.STRING, allowNull: true, unique: true }
  revision: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 }
  ```
- `backend/sequelize/relations.js` — same two columns added to
  `article_tag_rel`, `article_group_rel`, `article_article_rel`.
- `backend/sequelize/index.js` — `addColumnIfMissing` generalized to
  accept full attribute specs. New `addUniqueIndexIfMissing` adds the
  `<table>_uuid_unique` index post-backfill, idempotently. `initDB` now:
  `sync()` → `addColumnIfMissing(uuid, revision)` for all 13 →
  `backfillUuids` → unique index per table → `registerSyncHooks`.

**Dependencies**

- `uuid@^14.0.0` added (provides `v7`). Installed with
  `--legacy-peer-deps` to clear an unrelated pre-existing
  `draft-js-export-html`/`immutable` peer conflict in the lockfile.

**Resolved design choices (originally open in §9)**

- ID scheme: **UUIDv7** via `import { v7 as uuidv7 } from 'uuid'`.
- Junction op shape: **separate ops** with their own `uuid`+`revision`
  (junctions are first-class syncable rows). The columns are already
  present; the actual op emission is phase 3 work.
- Migration mechanism: stayed with `addColumnIfMissing` in `initDB` (not
  Umzug), so existing installs migrate on first launch.
- Revision policy: every UPDATE bumps revision (including UI-only
  toggles like `setIsRead`). Acceptable for v1.

**Verified by smoke test (24/24)**

Ran a self-contained in-memory SQLite script (since `backend/sequelize/`
can't be imported standalone — it pulls `electron` via `config.js`) that
exercised every write path on both fresh and pre-populated DBs:

- `Model.create`, `bulkCreate`, instance `.update()`,
  `Model.update({where})`, and `belongsToMany` association
  (`article.addTag(tag)`) all assign `uuid` and bump `revision` correctly.
- Pre-existing rows with NULL `uuid` (including a junction row with
  composite PK) get backfilled; `revision` stays at 1; backfill is
  idempotent on re-run; post-backfill updates resume bumping normally.
- `articles.code` field is untouched.

The smoke-test file was deleted after passing; recreate from the same
patterns if regression-testing is needed later.

### 2026-04-29 — Phase 0b (soft delete) attempted, rolled back

Implemented privacy-preserving soft delete (`deletedAt` + `paranoid: true`,
content-column wipe on tombstone, FK-preserving cascade, junction
restore-or-create dance). Smoke-tested 162/162 in-memory. Real-DB boot
then surfaced two SQLite-level traps the in-memory smoke had no way to
reproduce:

1. Sequelize 6's SQLite `changeColumn` (used to relax `NOT NULL` on
   content columns so a tombstone could hold NULL) is implemented as a
   recreate-table dance through a `<table>_backup` staging table. The
   backup-table CREATE uses `IF NOT EXISTS`, so a stale staging table
   from a partial run is silently reused → the next INSERT trips a PK
   conflict, surfaced as a cryptic `Validation error` (Sequelize wraps
   SQLite's `UniqueConstraintError` with that message).
2. The same dance does `DROP TABLE owners; ...` while other tables
   still hold FKs into it; SQLite refuses with `FOREIGN KEY constraint
   failed`. The dance preserves FK target values bit-perfect, so the
   right fix is `PRAGMA foreign_keys = OFF` for the migration scope —
   but the dance does not handle that for you.

Both traps were fixed (defensive backup-drop + FK pragma toggle), but
the root-cause review pointed to a more fundamental concern: the
strategy itself was paying recurring complexity for a one-way
desktop-authoritative app that does not need server-side history.

Specifically, the soft-delete strategy required:

- `paranoid: true` on every entity + junction model (10 + 3 files).
- Working around two Sequelize 6 paranoid traps in the wipe helper:
  `instance.update({ deletedAt })` silently strips `deletedAt` from the
  SET clause (it's read-only on paranoid models); `instance.restore()`
  calls `save({hooks:false})` so `revision` does NOT bump on restore.
  Both routed through `Model.update(..., { paranoid: false })` instead.
- Relaxing `NOT NULL` on 11 content columns across 7 tables so a
  tombstone could hold NULL — the `relaxAllowNullIfNeeded` migration
  with the SQLite recreate-table footguns above.
- Junction re-add dance: with `paranoid: true` on junction tables, a
  re-added association would PK-conflict against the tombstoned
  junction row, requiring `findOne({paranoid:false}) → restoreTombstone()
  else create()` in every `addAssociation` site.
- An explicit `CONTENT_COLUMNS` map per model to drive the wipe.
- Tombstones living forever in tables, requiring `paranoid: true`
  filtering on every read path.

**Decision:** roll back and replace with a **transactional outbox**
(see §10). Hard-delete the row, record the operation in a separate
`sync_outbox` table within the same transaction. This makes the
existing 0a hooks the natural emission point for the Phase-3 wire
format, removes every paranoid-mode footgun, keeps live tables clean,
and makes the privacy story stronger (the row is genuinely gone, not
nulled out).

**Working-tree state:** all 0b changes reverted in git
(`backend/sequelize/index.js` + 10 model files + `relations.js` + 10
service files + `syncableModels.js` modifications + `wipe.js` removed).

**Customer-DB residue (intentionally left in place):** any DB that
booted on the 0b code retains:

- `deletedAt DATETIME` columns on every syncable table.
- Relaxed `NOT NULL` on these content columns: `articles.title`,
  `owners.name`, `categories.name`, `tags.name`, `groups.name`,
  `images.{name,type,path}`, `audios.{name,type,path}`,
  `videos.{name,type,path}`.

These are harmless — the new code will not write to `deletedAt`, and
`NOT NULL` validation now lives at the model level so the relaxed
DB-level constraint is just slack we do not use. Dropping them would
require another `changeColumn` dance with the same FK / `_backup`
traps. Defer to a later optional cleanup migration if a tidy schema
becomes worth the cost.

**Documented for future reference (do not relearn):**

- Sequelize-SQLite uses a single connection
  (`sqlite/connection-manager.js`), so `PRAGMA foreign_keys = OFF/ON`
  set on the `sequelize` instance applies to every sub-query.
- Sequelize 6 paranoid mode adds `deletedAt` to
  `Model._readOnlyAttributes`; `instance.update({deletedAt})` silently
  strips it. Use `Model.update(payload, { where, paranoid: false })`.
- Sequelize 6 `instance.restore()` calls `save({hooks: false})` so
  model hooks do NOT fire on restore.
- SQLite has no in-place DDL for `NOT NULL` / `UNIQUE` / type / default
  changes; Sequelize's `changeColumn` implements the SQLite-recommended
  "12-step" recreate-table dance.
- Sequelize's recreate dance leaks intermediate `<table>_backup` tables
  on partial failure; defensively `DROP TABLE IF EXISTS` before retry.

### 2026-04-29 — Phase 0b v2 (transactional outbox) shipped

Pointer-only outbox per §10; design decisions in §9 Q7/Q9 honored
verbatim (no `payload`, no `revision` column on `sync_outbox`;
coalescing happens at export time). Article cascade in a single
transaction; image/audio/video deleters `safeUnlink` before the DB
destroy and thread `options.transaction`.

**New files**

- `backend/sequelize/model/syncOutbox.model.js` — defines table
  `sync_outbox` with `(id, uuid, entityType, op, createdAt,
  exportedAt)`, partial-eligible index `sync_outbox_pending` on
  `exportedAt`, and `sync_outbox_entity` on `(entityType, uuid)`.
  Registered in `modelDefiners` so `sequelize.sync()` creates it on
  every install.
- `backend/sync/outbox.js` — exports `appendOutbox(sequelize,
  {uuid, entityType, op}, {transaction})` (single INSERT, throws on
  failure so the caller's tx rolls back, skips with a warning if
  `uuid` is null) and `safeUnlink(absPath)` (ENOENT-tolerant
  unlink). The first arg is the sequelize instance — pulling it
  from `backend/sequelize/index.js` would have created a circular
  import since the outbox is wired from inside the sequelize boot.

**Schema changes**

- `sync_outbox` table created via `sequelize.sync()`. No
  `addColumnIfMissing` dance — fresh table, never altered after
  creation. No FK back to entity tables (rows of deleted entities
  must remain referenceable; there's no live row to FK to).
- Existing customer DBs that booted on the rolled-back 0b retain
  their `deletedAt` columns and relaxed `NOT NULL`s on content
  columns. Verified harmless by the boot test below: the new code
  never writes to `deletedAt`, and `NOT NULL` validation now lives
  at the model level so the DB-level slack is unused.

**Code changes**

- `backend/sync/hooks.js` extended with six new bindings per
  syncable model (`afterCreate`, `afterBulkCreate`, `afterUpdate`,
  `afterDestroy`, `afterBulkUpdate`, `afterBulkDestroy`).
  Bulk-update and bulk-destroy can't see per-row instances in the
  after hook, so the **existing** `beforeBulkUpdate` and a new
  `beforeBulkDestroy` pre-fetch `[{uuid}]` from the affected rows
  inside the caller's transaction and stash them on
  `opts._outboxUuids`; the after hook iterates the stash and emits
  one row per uuid. Service code therefore stays untouched —
  `Model.update({where})`, `Model.destroy({where})`,
  `article.addTag(...)`, `article.removeTag(...)` etc. all keep
  working unchanged.
- `backend/service/ArticleService.js#deleteArticleById` wraps the
  cascade in a single `sequelize.transaction()` and threads
  `{transaction: tx}` through every child-service deleter and the
  parent destroy. If any step throws (including `safeUnlink`
  rejecting on a non-ENOENT error), the entire cascade — entity
  rows AND outbox rows — rolls back.
- `backend/service/CommentService.js#deleteCommentsByArticleId` and
  `backend/service/AnnotationService.js#deleteAnnotationsByArticleId`
  now accept `(articleId, options = {})` and forward
  `options.transaction` to `Model.destroy`. Silent top-level
  `try/catch` removed from both — errors propagate to the cascade tx.
- `backend/service/ImageService.js`, `AudioService.js`,
  `VideoService.js` deleters refactored:
  - New internal `delete<Type>Entity(entity, {transaction})` does
    `await safeUnlink(absPath)` **before** `entity.destroy({transaction})`.
  - Public `delete<Type>ById(id)` (the IPC handler) wraps the
    internal helper in its own `sequelize.transaction()` so the
    single-media-delete UI path is also atomic.
  - Public `delete<Type>sByArticleId(articleId, {transaction} = {})`
    accepts the parent tx, finds rows in that tx, and calls the
    internal helper for each. Silent top-level `try/catch` removed.
  - Two real bugs fixed in passing: `fs.unlink(...)` without `await`
    (fire-and-forget) and the swallow-and-log pattern that hid IPC
    errors from the renderer.

**Open questions resolved this round**

- ~~Q7 (outbox payload shape)~~ → **pointer-only**. Locked in §9.
- ~~Q9 (coalescing)~~ → **append-only, coalesce at export**. Locked
  in §9. Append-only chosen over UPSERT mode after weighing hook
  complexity vs steady-state storage; ~50–80 bytes per outbox row
  makes the duplicate-rows-between-exports cost negligible, while
  hooks stay trivial INSERTs with no op-precedence merge logic.

**Still open** (not blocking 0b)

- Q8 (peer registry / pruning) — `sync_peers` table and
  `pruneOutbox(beforeId)` helper land alongside Phase 3 when the
  first peer ack arrives. Schema is ready (`exportedAt` column).

**Verified by smoke test (8/8)**

In-memory SQLite, single-file Node script wiring the same model +
relations + hooks pipeline as `initDB` (since `backend/sequelize/`
still can't be imported standalone — it pulls `electron` via
`config.js`). Exercised every case in §10.10:

- Each of the 10 entity models: `create` / `update` / `destroy`
  emits exactly one outbox row each with the right
  `(uuid, entityType, op)`.
- `belongsToMany` add/remove on all 3 junctions emits one
  `article_*_rel` row per association, both `'create'` and
  `'delete'`.
- `Model.update({where: {id: [a, b]}})` matching 2 of 3 rows emits
  exactly 2 outbox rows; same for `Model.destroy({where})`.
- Article cascade in one transaction: every cascaded child + junction
  + parent emits its own `'delete'` outbox row, all visible after
  commit.
- Cascade rollback: throwing inside the tx leaves zero outbox rows
  AND zero destroyed entity rows.
- Pre-0b row inserted via raw SQL (simulating a customer DB row
  predating 0b v2) emits no outbox row; the next Sequelize update on
  that row emits exactly one.
- §10.6 coalescing query with the four canonical patterns:
  - `5x update` → `finalOp='update'`, `hadCreate=false`.
  - `create + 3x update` → `finalOp='create'`, `hadCreate=true`.
  - `update + delete` → `finalOp='delete'`, `hadCreate=false`.
  - `create + delete` → `finalOp='delete'`, `hadCreate=true` (the
    flag the export-time filter uses to drop the op entirely).
- `appendOutbox` failure inside a transaction: dropping the
  `sync_outbox` table mid-flight to make the next INSERT throw
  causes the entity update to roll back too.

**Verified by boot test (2/2)**

Mirrors `initDB`'s pipeline against real on-disk SQLite files
(not `:memory:`), so `sequelize.sync()`'s
CREATE-TABLE-IF-NOT-EXISTS semantics get exercised:

- Fresh DB: bootstrap creates `sync_outbox` + both indexes; first
  write emits the expected row; second boot of the same file is
  idempotent (no retroactive emission).
- Customer DB with 0b residue: pre-seed the file with all the
  `deletedAt` columns from the rolled-back 0b code, plus two
  legacy articles with backfilled uuids. Bootstrap adds
  `sync_outbox` cleanly; legacy articles emit zero retroactive
  rows on boot; the next normal update emits exactly one.

Both smoke and boot scripts deleted after passing; recreate from
the same patterns if regression-testing is needed later.

**Manual UI smoke (deferred to user)**

Driving the actual Electron app — create an article, edit title,
delete a comment, delete the article — is the user's
responsibility since it requires the desktop window. The
programmatic paths above cover everything below the IPC layer.

### 2026-04-29 — Phase 1 (types & constants) shipped

The wire-format contract is now written down and the two
bookkeeping engine tables are in. No service code touched; this
phase is pure scaffolding.

**New files**

- `backend/sync/syncConstants.js` — frozen exports for the on-disk
  format: `SYNC_FORMAT='bulutlar-sync'`, `SYNC_FORMAT_VERSION=1`,
  `SYNC_FILE_EXT='.blt'`,
  `SYNC_MIME_TYPE='application/vnd.bulutlar.sync+zip'`,
  `SYNC_IOS_UTI='com.bulutlar.sync'`,
  `SYNC_SOURCE_APP='bulutlar-desktop'`, `SYNC_SCHEMA_VERSION=1`.
  These ship in every bundle's `manifest.json` and on-disk
  filename and must never change once Phase 3 ships.
- `backend/sync/types.js` — JSDoc-only (Q1 resolved → JSDoc, not
  TS, matches the rest of the repo per §3a). Defines `Manifest`,
  `Operation` discriminated union (`UpsertOp` | `DeleteOp`),
  `EntityType` string union, per-entity `*Data` typedefs for all
  13 syncable entities (10 entities + 3 junctions), and
  `TiptapMediaNodeAttrs = { uuid, name?, description? }` per Q4.
  Only runtime export is the frozen `APPLY_ORDER` array used by
  both desktop emitter and mobile applier to sequence ops
  dependency-first (owner → category → tag → group → article →
  comment/annotation/media → junctions).
- `backend/sequelize/model/appliedBundle.model.js` — engine table
  `applied_bundles` with `(id, bundleId UNIQUE, appliedAt,
  opCount, sourceApp, sourceVersion)`. Symmetric across desktop
  and mobile per §3g; idle on desktop in v1, mobile uses for
  idempotent re-apply detection.
- `backend/sequelize/model/exportedBundle.model.js` — engine
  table `exported_bundles` with `(id, bundleId UNIQUE, createdAt,
  opCount, articleCount, sizeBytes, filePath)`. Desktop-only
  "what have I shared" log; written by Phase 3 export, read by
  the Phase 5 history UI.

**Schema changes**

- Both tables created via `sequelize.sync()` — same fresh-table
  pattern as `sync_outbox`, no `addColumnIfMissing` dance because
  the tables are brand new on every install. `timestamps: false`
  on both since they manage their own `appliedAt` / `createdAt`
  columns explicitly.
- Neither table is in `SYNCABLE_MODELS`. They are engine tables
  (sync infrastructure itself); writes do NOT emit outbox rows —
  verified by smoke test below. Same status as `sync_outbox`.

**Code changes**

- `backend/sequelize/index.js` — two new imports
  (`appliedBundleModel`, `exportedBundleModel`), two new entries
  in `modelDefiners` next to `syncOutboxModel`. No other changes.

**Open questions resolved this round**

- ~~Q1 (JSDoc vs TS for shared sync surface)~~ → **JSDoc** in
  `backend/sync/types.js`. Matches the rest of the repo (plain
  ESM JS, no tsconfig); cheapest path that gives mobile a single
  file to copy.
- ~~Q4 (Tiptap media-node `attrs` rewrite policy)~~ →
  **`{ uuid, name, description }`** (uuid-plus-display). Keeps a
  display fallback if media fails to apply on the receiver.
  Phase 3's tiptap rewriter MUST drop `id`, `path`, `type`,
  `size` from the original `attrs` before emit.

**Verified by smoke + boot test (22/22)**

Single-file Node script wiring the same model + relations + hooks
pipeline as `initDB` (still can't import `backend/sequelize/`
standalone — pulls `electron` via `config.js`).

- In-memory smoke (11 checks): both new tables present;
  `bundleId` UNIQUE rejects duplicates on each; engine tables do
  NOT emit outbox rows on create; syncable tables still DO emit
  outbox rows; neither model is in `SYNCABLE_MODELS`.
- Fresh on-disk boot (5 checks): tables created; row written;
  second boot is idempotent and the row persists.
- Customer-DB-with-residue boot (6 checks): seed a DB with 0a
  uuid+revision columns AND the rolled-back 0b `deletedAt`
  residue, plus legacy owner+article rows; bootstrap on top with
  the new modelDefiners adds both new tables cleanly; legacy
  rows survive untouched (uuids preserved); `appliedBundle.create`
  works on the customer DB.

Test script deleted after passing per the same hygiene used in
0a / 0b v2; recreate from the same patterns if regression-testing
is needed later.

### 2026-04-29 — Phase 3 (export feature) shipped

The desktop side of the contract is now wired end-to-end. User can
open `Settings → Sharing → Generate Update Bundle`, pick which
articles ship in the next bundle (with explicit `Latest State` vs
`Sil Komutu` modes), and the resulting `.blt` lands in their
Downloads folder ready for WhatsApp.

**New files**

- `backend/sync/coalesce.js` — exports `coalescePending(sequelize,
  {entityTypes?, maxOutboxId?, transaction?})` (the §10.6 query as
  a parameterized helper) and `snapshotOutboxMaxId(sequelize)`.
  Op precedence at the same row: `delete > create > update`. The
  snapshot helper gives callers an upper bound to pass to the
  post-build stamp UPDATE so it doesn't race writes that landed
  after the SELECT.
- `backend/sync/tiptapRewrite.js` — `rewriteTiptap(doc, idToUuid)`.
  Walks the tiptap tree, rewrites `imageNode` / `audioNode` /
  `videoNode` `attrs` to the locked `TiptapMediaNodeAttrs` shape
  (`{ uuid, name?, description? }`), drops `id` / `path` / `type` /
  `size`. Pure; returns a fresh tree, never mutates.
- `backend/sync/bundleBuilder.js` — `build({...})` writes a stored
  (uncompressed) zip via `archiver`. Layout matches §6:
  `manifest.json`, `operations.json`, `media/{images,audios,videos}/<uuid>.<ext>`.
  Streamed sha256 over each media file → `mediaChecksums`; sha256
  over `operations.json` bytes → `operationsChecksum`. Filename
  format: `bulutlar-YYYY-MM-DD-<bundleIdShort>.blt` (the §4
  `bundleId`-in-filename refinement). Exports
  `SENTINEL_DELETE_REVISION = INT32_MAX = 2147483647` for
  auto-included tombstones whose desktop revision is gone (see
  Q10 below).
- `backend/service/SharingService.js` — registers four IPC
  handlers (`sharing/getCandidates`, `sharing/getLastExport`,
  `sharing/exportBundle`, `sharing/showInFolder`) and orchestrates
  the export. All Sequelize knowledge lives here; the three sync
  modules above stay pure.
- `backend/sequelize/model/exportedBundleArticles.model.js` — new
  engine table `exported_bundle_articles` with composite PK
  `(bundleId, articleUuid)` and an index on `articleUuid`. Two
  rows per export per participating article uuid (one per
  `latestState` AND each `manualDelete` uuid). Replaces the
  brittle "has any outbox row with `exportedAt IS NOT NULL`"
  proxy as the canonical "previously shared" oracle. NOT in
  `SYNCABLE_MODELS`. Created via `sequelize.sync()` on next boot.
- `src/components/settings/SharingSettings.jsx` — accordion
  contents in `Settings`: button + last-export label.
- `src/components/settings/SharingModal.jsx` — fixed-height
  (`85vh`) two-pane modal. Left = available since last export
  with four filter checkboxes (created / updated / deleted /
  unchanged) + auto-included deletions read-only block. Right =
  selected items with per-row `Latest State ↔ Sil Komutu` toggle
  and red visual cues (border, title strikethrough, error chip,
  red toggle fill) on `manualDelete` rows. Summary footer + 250 MB
  soft warning constant.

**Schema changes**

- `exported_bundle_articles` created via `sequelize.sync()` —
  same fresh-table pattern as the other engine tables. No
  `addColumnIfMissing` dance.
- Hook layer untouched; export-time stamping is plain
  `UPDATE sync_outbox SET exportedAt WHERE id <= :maxId AND
  exportedAt IS NULL AND uuid IN (:participatingUuids)`. The
  `IN` clause excludes manual-delete uuids (those rows had no
  outbox writes).

**Code changes**

- `backend/sequelize/index.js` — registers the new model.
- `backend/service/index.js` — registers `SharingService`.
- `backend/preload.js` — new `sharing` namespace exposing four
  invokes.
- `backend/service/SharingService.js#exportBundle` is the
  transactional pivot: build the zip on disk first (idempotent
  per `bundleId`; orphan files are harmless), then in one tx
  insert `exported_bundles` + `exported_bundle_articles` rows
  and stamp the outbox. If the tx fails, the `.blt` lingers but
  the user can retry; the next attempt gets a fresh `bundleId`
  and re-exports cleanly.
- Translations: 30+ keys added to `src/locales/{en,tr}/translation.json`
  (Title Case conventions normalized for the sharing surface).
  Theme-aware MUI overrides in `src/styles/themes.css` scoped to
  `.sharing-modal` so the modal renders cleanly in both light and
  dark themes (forces FormControlLabel / ToggleButton / Chip /
  IconButton / TextField text colors to `var(--text-primary)`,
  red selected state for the `manualDelete` toggle).

**Dependencies**

- `archiver@^7` added (streaming zip writer; chosen over `yazl`
  because it's the more idiomatic Node choice for this use case
  and Bulutlar already pays the install cost via transitive
  pulls). Installed with `--legacy-peer-deps` to clear the same
  pre-existing `draft-js-export-html` peer conflict that 0a hit.

**Open questions resolved this round**

- ~~Q5 — bundle size cap~~ → **250 MB soft warning**, hardcoded as
  `SIZE_WARNING_BYTES` in `SharingModal.jsx`. WhatsApp's hard cap
  is 2 GB; 250 MB leaves headroom and matches §4 recommendation.
  User-configurable can land in Phase 5 if needed.
- ~~Q10 (newly raised) — "previously shared" classifier
  fidelity~~ → **`exported_bundle_articles` mapping table**.
  Stamping `sync_outbox.exportedAt` was insufficient because an
  article that's been shared once and never written to since
  has no pending outbox rows to inspect; the new table records
  every `(bundleId, articleUuid)` shipped (both `latestState`
  AND `manualDelete`) so the classifier has an authoritative
  answer.
- ~~Q11 (newly raised) — pending-desktop-deletes UX in the
  modal~~ → **auto-include, read-only summary**. Users cannot
  individually inspect or skip pending deletes (the live row is
  gone; we have only the uuid). Every export carries every
  pending desktop delete; the modal shows count + creation
  timestamp summary.
- ~~Q12 (newly raised) — remote-only delete (manualDelete)~~ →
  **per-row `Sil Komutu` toggle in the right pane**. Emits a
  `DeleteOp` with `revision = liveRev + 1` without touching
  the desktop row. **Caveat:** if the desktop user later edits
  the same article, the next bundle's upsert will resurrect
  the row on mobile. Documented as known v1 behavior.
- ~~Q13 (newly raised) — dangling `articleArticleRel`
  targets~~ → **skip at export time**. If
  `relatedArticleUuid` is neither in the current bundle's
  selected articles NOR in `exported_bundle_articles` from any
  prior bundle, drop the rel. Mobile can't apply a rel whose
  target it's never seen.
- ~~Q14 (newly raised) — `DeleteOp` revision for auto-included
  desktop deletes~~ → **`SENTINEL_DELETE_REVISION = INT32_MAX`**.
  The pointer-only outbox doesn't store the revision-at-time-of-
  delete and the live row is gone, so we use a sentinel high
  enough that mobile applies the tombstone regardless of any
  revision it might already have. uuids never repeat on
  desktop (hard-delete + uuidv7), so the sentinel can never
  collide with a future legitimate revision for the same uuid.

**Verified by smoke test (56/56)**

In-memory SQLite, single-file Node script wiring the same
model + relations + hooks pipeline as `initDB`, replicating
`SharingService.getCandidates` / `exportBundle` inline (the
service can't be imported standalone — pulls `electron` for
`app.getVersion()` / `app.getPath` / `shell.showItemInFolder`
/ `ipcMain`). Six articles seeded covering every classifier
branch (latestState / manualDelete / autoDelete / previously-
shared / unchanged / dangling-rel target):

- All four classifier branches return the right uuids
  (created / updated / unchanged / deleted-summary).
- Bundle file exists, ends in `.blt`, parses as a stored zip
  (custom mini-parser since archiver's reverse cousin isn't
  in deps).
- Manifest constants match the locked triple
  (`bulutlar-sync` / `1` / `bulutlar-desktop` / schema 1).
- Ops sorted by `APPLY_ORDER`.
- Article ops resolve `ownerUuid` / `categoryUuid` from
  numeric FKs and drop `ownerId` / `categoryId`.
- Embedded `imageNode` carries `{ uuid, name, description }`
  only (no `id` / `path` / `type` / `size`).
- `manualDelete` op revision = `liveRev + 1`; live row
  unchanged after export.
- `autoDelete` op revision = `SENTINEL_DELETE_REVISION`.
- `articleArticleRel` to a previously-shared article kept;
  rel to a never-shared dangling target dropped.
- `operationsChecksum` matches sha256 of `operations.json`
  bytes; `mediaChecksums[uuid]` matches sha256 of the media
  file in the zip.
- `exported_bundles` row inserted; `exported_bundle_articles`
  has `latestState` + `manualDelete` uuids but NOT
  `autoDelete` uuids.
- `sync_outbox.exportedAt` stamped for participating uuids;
  `manualDelete`'s pre-existing stamped/pending counts
  unchanged (the live row was never touched).
- Re-running `getCandidates` after export reclassifies
  correctly: previously-created articles drop to `unchanged`,
  the auto-deleted article disappears from the deleted
  summary.

Test script deleted after passing per the same hygiene used
in 0a / 0b v2 / 1; recreate from the same patterns if
regression-testing is needed later.

**Manual UI smoke (deferred to user)**

Driving the actual Electron app — opening Settings, generating a
bundle, verifying the file shows up in Downloads, tapping `Show in
Folder`, sending the bundle through WhatsApp — is the user's
responsibility since it requires the desktop window. The
programmatic paths above cover everything below the IPC layer.

### Next steps

Phase 5 candidates (none blocking, pick whichever the product needs
first):

- **History UI on top of `exported_bundles` + `exported_bundle_articles`**
  ("you've already shared this article in N bundles, last on X").
  Most of the data is already populated; this is a pure UI add.
- **Multi-part splitting** for bundles over the 250 MB soft
  warning. Requires bumping the manifest's `partIndex` /
  `partTotal` (already reserved as `1/1` in v1) and a receiver-
  side stitcher. Not urgent unless real-world bundles trigger
  the warning.
- **Schema-version-aware export** (refuse to emit if mobile's
  last-known `schemaVersion` is too old). Depends on Q6
  (mobile-side mismatch behavior).
- **Optional bundle encryption** with a passphrase shared
  out-of-band.
- **Reverse direction** (mobile → desktop). Significant work;
  triggers conflict-resolution policy decisions explicitly out
  of scope for v1 (§7).

The mobile applier is independent — it depends on
`backend/sync/types.js` (copy verbatim) plus a sample `.blt` to
test against (the smoke-test pipeline above can synthesize one on
demand). Apply in `APPLY_ORDER`; dispatch on `op.type` (`'upsert'`
vs `'delete'`); honor `revision` last-writer-wins on the live row.

**Still open** (none blocking the desktop side):

- Q6 — schema-version mismatch behavior on mobile (mobile-side).
- Q8 — pruning / peer registry. Schema supports it
  (`sync_outbox.exportedAt` is set by Phase 3 export; the
  `sync_peers` table can land when the first peer registry is
  needed). For a single-peer v1 over WhatsApp, manual prune
  ("delete outbox rows older than X" on the desktop user's
  command) is enough.

---

## 1. Goal & constraints

Let a desktop user export a single file containing a set of article changes
(creates / updates / deletes) plus their associated media, share it over
WhatsApp (or any other channel), and have the mobile recipient apply it to
their local DB by tapping the file.

Constraints:

- Fully local, no backend, no network calls, no auth (per `CLAUDE.md`).
- One-way for v1: desktop → mobile only.
- Must survive WhatsApp's document handling.
- Single-tap apply on the recipient device.

---

## 2. Original plan (desktop side)

### Step 1 — Database schema additions (do first; desktop and mobile must match)

#### 1a. Add two columns to every syncable table

Tables affected: `owners`, `articles`, `categories`, `tags`, `groups`,
`comments`, `annotations`, `images`, `videos`, `audios`, `article_tag_rels`,
`article_group_rels`, `article_article_rels`.

| column     | type                          | notes                                |
| ---------- | ----------------------------- | ------------------------------------ |
| `uuid`     | `TEXT UNIQUE`                 | ULID or UUIDv7, generated at INSERT  |
| `revision` | `INTEGER NOT NULL DEFAULT 1`  | Bumped on every update               |

#### 1b. Backfill existing rows

One-time migration: generate a `uuid` for every row that has `NULL`, set
`revision = 1`. Local INTEGER PKs stay (still used for joins inside SQLite).
Only `uuid` crosses devices.

#### 1c. Add the `applied_bundles` table

Used only by mobile in v1, but kept symmetric to ease later changes.

```sql
CREATE TABLE applied_bundles (
  id            INTEGER PRIMARY KEY,
  bundleId      TEXT NOT NULL UNIQUE,
  appliedAt     INTEGER NOT NULL,
  opCount       INTEGER NOT NULL,
  sourceApp     TEXT,
  sourceVersion TEXT
);
```

#### 1d. Bump `schemaVersion`

This is the number written into `manifest.json`.

### Step 2 — Application-level changes for `uuid` / `revision`

- On every `INSERT`: generate a new `uuid` (ULID/UUIDv7) and set `revision = 1`.
- On every `UPDATE`: increment `revision` (`revision = revision + 1`).
- On every `DELETE` of syncable rows: prefer soft-delete (`isDeleted = 1` plus
  `revision` bump) instead of hard delete. Hard deletes can't be communicated
  reliably through bundles.
- Foreign-key references stay numeric internally; anywhere a row is serialized
  for export, resolve the FK to the related row's `uuid`
  (e.g. `article.ownerId` → `ownerUuid`).

### Step 3 — Lock down the shared types

Before writing any export code, define the on-disk format types. Ideally the
same file is shared between desktop and mobile (copy/paste is fine for v1).

- Manifest shape (see §6 below).
- Operation union (`upsert` / `delete`) for each entity.
- The constants triple: extension `.blt`, MIME
  `application/vnd.bulutlar.sync+zip`, iOS UTI `com.bulutlar.sync`. Put these
  in `syncConstants.*` and never change them.

### Step 4 — Desktop bundle export

Build in this order:

#### 4a. Selection UI

A "Generate update bundle" button. For v1 the simplest UX is:

- Multi-select articles (or "all changed since date").
- No selective row-level granularity — whole article + media + rels go.

#### 4b. Operation builder

For each selected article, emit:

- `upsert` op for the article itself, with `data` containing all article
  columns plus `ownerUuid`, `categoryUuid` (resolved from FKs).
- `tags`, `groups`, `relatedArticles` arrays of uuids on the article op
  (full set, not deltas) — see §3d below for revision.
- `upsert` ops for each `comment`, `annotation`, `image`, `video`, `audio`
  belonging to the article (each carries `articleUuid`).
- `upsert` ops for `owners` / `categories` / `tags` / `groups` referenced by
  the included articles (so the receiver has them).
- Order ops dependency-first: owners → categories → tags → groups →
  articles → comments / annotations / media → rels. Or wrap apply in a
  deferred-FK transaction on the receiver.

#### 4c. Media collection

For each `image` / `video` / `audio` op, copy the source file from the
desktop into the bundle as `media/<kind>/<uuid>.<ext>` (or by content hash if
dedup later). Do NOT include the local path column in `data` — the receiver
writes its own path.

#### 4d. Manifest generation

```jsonc
{
  "format": "bulutlar-sync",
  "formatVersion": 1,
  "bundleId": "01HXX…",            // fresh ULID per export
  "createdAt": "2026-04-28T07:41:00Z",
  "sourceApp": "bulutlar-desktop",
  "sourceAppVersion": "2.0.3",      // app.getVersion() at runtime
  "schemaVersion": 7,
  "opCount": 0,
  "mediaCount": 0,
  "totalSizeBytes": 0,
  "checksum": "sha256:…",          // see §3e for what this hashes
  "partIndex": 1,
  "partTotal": 1
}
```

#### 4e. Zipping

- Layout: `manifest.json` at root, `operations.json` at root, `media/images/…`,
  `media/videos/…`, `media/audios/…`.
- Output extension: `.blt` (NOT `.zip`).
- Suggested filename: `bulutlar-YYYY-MM-DD.blt` (see §3a for refinement).

#### 4f. Output + share

- Save to Downloads (or user-chosen folder).
- Open OS share sheet, or "Show in folder" — whichever Electron API is easiest.
  The user sends it through WhatsApp themselves.

#### 4g. Bookkeeping

Record exported `bundleId`s in a small desktop-only table so the user can see
"you've already shared this bundle on …".

### Step 5 — Constraints to respect during export

- Size cap: keep bundles under what the chosen channel accepts (WhatsApp now
  allows 2 GB; ~250 MB is a safe v1 target — see §4).
- Don't recompress media. Bundles are bit-exact copies; the receiver replays
  them as-is.
- Don't put the desktop's local path into the row data — it leaks the
  desktop's filesystem layout and is wrong on mobile.

### Step 6 — Recommended phasing

- **Phase 0** — Schema migration: add `uuid` + `revision`, backfill, add
  `applied_bundles`. Update all INSERT/UPDATE/DELETE code to maintain them.
- **Phase 1** — Define and share the manifest/operation types and the
  constants triple.
- **Phase 3** — Build the export feature itself (steps 4a–4g).
- **Phase 5** — Later polish: multi-part splitting, schema-version-aware
  export, "what have I shared" log.

Phases 0 and 1 are blocking — mobile can't even start its apply work until
the schema and types are locked.

---

## 3. Codebase-grounded review (Bulutlar specifics)

The original plan is sound. The notes below are the deltas needed to make it
fit this codebase precisely.

### 3a. The repo is plain ESM JS, not TypeScript

`package.json` is `"type": "module"`, no `tsconfig`, no `.ts` files, React
side is `.jsx`. The "shared TS types" step needs to become one of:

- A shared JSDoc `@typedef` module (e.g. `backend/sync/types.js`) that both
  apps copy. **Recommended** — cheapest, matches rest of project.
- Introduce TS only for the sync surface (`backend/sync/*.ts`) and run it
  through Babel.
- Drop typing and rely on JSON Schema validation in both apps.

### 3b. Migration mechanism is non-standard — pick the right one

Two parallel mechanisms exist:

- `backend/sequelize/migrate.js` + the `migrations/` folder uses Umzug, but
  it's a manual `node migrate.js` script that production users almost
  certainly never run.
- The actual on-startup schema evolution is the ad-hoc `addColumnIfMissing`
  loop in `backend/sequelize/index.js` (`initDB`).

For `uuid` / `revision`, `addColumnIfMissing` is the only path that will
reach existing installs. Extend it to add `uuid` + `revision` to all 13
tables, plus a one-shot backfill loop in the same `initDB`. Don't rely on
Umzug for this unless you also wire Umzug into app startup.

### 3c. `articles.code` already exists — don't reuse it

`backend/sequelize/model/article.model.js` defines `code: STRING`, set in
`ArticleService.createArticle` to `Math.random().toString(36).substring(2)`.
Not unique-constrained, ~10 chars of entropy — collisions are realistic.
Keep `code` for whatever uses it today, add a fresh `uuid` column.

### 3d. The plan loses junction-table ordering

`relations.js` defines per-relation ordering on every junction:

```js
article_tag_rel:     { tagOrdering: INTEGER }
article_group_rel:   { groupOrdering: INTEGER }
article_article_rel: { relatedArticleOrdering: INTEGER }
```

Plain `tags: [uuid]` arrays silently lose `tagOrdering` /
`groupOrdering` / `relatedArticleOrdering`, which the UI uses
(`articleEntity2Json` and `updateRelatedArticleOrderings`). Two options:

- `tags: [{ uuid, ordering }]` instead of `tags: [uuid]`, **or**
- Separate `upsert` ops for `articleTagRel` / `articleGroupRel` /
  `articleArticleRel`, each carrying its own `uuid` + `revision`.

The latter is more consistent ("everything is a row with `uuid`+`revision`")
and matches the "13 syncable tables" count which already includes the
junctions. **Recommended.**

### 3e. Tiptap JSON contains embedded media references that must be rewritten

`createArticleProgrammatically` shows the data shape:

```js
mediaNodes.push({
  type: 'imageNode',
  attrs: { id: dv.id, name: dv.name, type: dv.type, path: dv.path, size: dv.size, description: dv.description }
});
```

These `attrs.id` and `attrs.path` are desktop-local. `textTiptapJson` and
`explanationTiptapJson` (on `articles`) and `tiptapTextJson` (on `comments`)
all carry these.

Export must walk each tiptap JSON tree and replace `attrs.id` / `attrs.path`
with `attrs.uuid` (and drop the rest), so the mobile applier can re-link
them after writing media files. Without this, mobile articles will render
with broken images even if all the rows apply correctly.

This is the single biggest spec-level item missing from the original plan.
Pin down the rewrite rules before any code lands.

### 3f. Hard deletes today, soft deletes tomorrow

`articles.isDeleted` exists in the model but `deleteArticleById` does a real
`article.destroy()` plus cascading hard-delete of comments / images / audios
/ videos / annotations. The other syncable tables (comments, annotations,
images, audios, videos, tags, groups, owners, categories, the three
junctions) don't have `isDeleted` at all.

Adding `isDeleted` everywhere is a separate, larger schema migration than
`uuid` + `revision` and changes service semantics. Either:

- Add `isDeleted` only to entities the user can directly delete (articles,
  comments, annotations, single-media items, junction rows) and accept that
  "delete a tag" is communicated by absence of the relationship row, not by
  a tombstone for the tag itself, **or**
- Add it everywhere and update every service `destroy()` call.

Pick before shipping the schema migration; you don't want to add `isDeleted`
in a second wave because mobile receivers will need to know which version of
the schema they got.

**Update (2026-04-29):** the soft-delete strategy was attempted in §0's
2026-04-29 entry and rolled back in favor of a **transactional outbox**.
Hard deletes stay; delete operations are communicated through the
`sync_outbox` table written inside the same transaction as the entity
destroy. See §10 for the new design.

### 3g. `applied_bundles` vs the desktop's "exported bundles" log

These are different semantics. Use **two** tables, not one:

- `applied_bundles` on both sides: same schema, used by mobile when apply
  succeeds, used by desktop only if reverse direction is ever added.
- `exported_bundles` desktop-only with
  `(bundleId, createdAt, opCount, sizeBytes, articleCount, filePath)`.

**Update (Phase 3):** a third desktop-only engine table,
`exported_bundle_articles`, was added to track which articles were
included in which bundles
(composite PK `(bundleId, articleUuid)`, index on `articleUuid`).
This is the canonical "previously shared" oracle used by the modal's
classifier — see Q10 in the 2026-04-29 Phase 3 entry of §0. It
records every uuid in either `latestState` OR `manualDelete` for a
given bundle.

### 3h. Media on disk is already `relPath`-only

`backend/service/ImageService.js` (and Audio/Video equivalents) store
`relPath = name + '_' + Date.now()` inside `config.imagesFolderPath`, not
absolute paths. The plan's "don't put desktop's local path into the row
data" still applies because the embedded timestamp would be wrong on mobile,
but be aware that the column isn't an absolute path; it's a desktop-folder
filename.

---

## 4. Issues with the on-disk format spec

- **`bundleId` in the filename**: include a short prefix of `bundleId` in the
  filename so re-shares of the same bundle on different days are reconciled
  on mobile (idempotency by `bundleId`). E.g.
  `bulutlar-2026-04-28-01HXX1234.blt`.
- **Checksum**: "compute over the zip then patch into manifest" is awkward
  (changes the zip you just hashed). Simpler: SHA-256 over `operations.json`
  bytes, plus a `mediaChecksums: { "<uuid>": "<sha256>" }` map in the
  manifest. Each piece is independently verifiable, `manifest.json` is the
  last thing zipped, no patch step.
- **schemaVersion mismatch policy**: when the receiver's `schemaVersion` is
  older than the bundle's, "reject with a friendly message and ask user to
  upgrade mobile app" is the only safe v1 behavior. Document it.
- **`sourceAppVersion`**: read from `app.getVersion()` at runtime, not from
  imported `package.json` — asar-packaged apps can lie about the latter.
- **Optional `articles` index**: include `articles: [uuid]` in the manifest
  so mobile can preview "this bundle contains 17 articles" without parsing
  `operations.json`.

### WhatsApp file-handling reality check

- WhatsApp on Android/iOS only opens documents whose extension+MIME it
  recognizes. An unknown `application/vnd.bulutlar.sync+zip` MIME often gets
  stripped to `application/octet-stream` during transfer. That's fine for
  the goal — it means the recipient experience depends entirely on the
  mobile OS's file-association handling for `.blt`, not on WhatsApp.
- WhatsApp's document size cap is 2 GB now (bumped from 100 MB years ago).
  The plan's ~100 MB is conservative. Cap at ~250 MB for v1 to leave
  headroom; revisit splitting later.

---

## 5. Sequencing — Phase 0 is bigger than it looks

Desktop-side "Phase 0" was originally planned as three sub-phases. As of
2026-04-28, 0a and 0c shipped together (the junction-uuid work was cheap
once the hook infrastructure existed):

1. **0a. Add `uuid` + `revision` columns + backfill.** ✅ **Done.** See §0.
2. **0b. Op-emission machinery.** ✅ **Done (2026-04-29).** Originally
   planned as a soft-delete migration (`isDeleted` + cascading
   tombstones); attempted on 2026-04-28 and rolled back on 2026-04-29
   (see §0). Shipped as a **transactional outbox** later that day:
   every create / update / delete writes a row to `sync_outbox`
   inside the same transaction as the entity write, via Sequelize
   after-hooks (no service edits except the article-cascade
   transaction wrapper and the media-deleter `safeUnlink` cleanup).
3. **0c. Junction rows get `uuid`+`revision`** (`article_tag_rel`,
   `article_group_rel`, `article_article_rel`). ✅ **Done as part of 0a.**

All three sub-phases are now in. The gate to start work on bundle
emission (Phase 3) is fully open: every syncable write produces an
`sync_outbox` row atomically with the entity write, and the §10.6
coalescing query is the concrete export-time entry point.

**Update (2026-04-29):** Phase 3 shipped the same day. See §0's Phase
3 entry for what landed; the §10.6 query is now wired through
`backend/sync/coalesce.js` and consumed by `SharingService.exportBundle`.

---

## 6. Operation / Manifest shapes (draft)

Defined as JSDoc typedefs to share between desktop and mobile.

```jsonc
// Manifest
{
  "format": "bulutlar-sync",
  "formatVersion": 1,
  "bundleId": "01HXX…",
  "createdAt": "2026-04-28T07:41:00Z",
  "sourceApp": "bulutlar-desktop",
  "sourceAppVersion": "2.0.3",
  "schemaVersion": 7,
  "opCount": 42,
  "mediaCount": 7,
  "totalSizeBytes": 12345678,
  "operationsChecksum": "sha256:…",
  "mediaChecksums": { "<mediaUuid>": "sha256:…" },
  "articles": ["<articleUuid>", "..."],
  "partIndex": 1,
  "partTotal": 1
}
```

```jsonc
// Operation union — operations.json is { "ops": [Op, ...] }
{ "type": "upsert", "entity": "article",        "uuid": "...", "revision": 3, "data": { /* per-entity shape */ } }
{ "type": "upsert", "entity": "owner",          "uuid": "...", "revision": 1, "data": { "name": "..." } }
{ "type": "upsert", "entity": "category",       "uuid": "...", "revision": 1, "data": { "name": "...", "color": "#..." } }
{ "type": "upsert", "entity": "tag",            "uuid": "...", "revision": 1, "data": { "name": "..." } }
{ "type": "upsert", "entity": "group",          "uuid": "...", "revision": 1, "data": { "name": "..." } }
{ "type": "upsert", "entity": "comment",        "uuid": "...", "revision": 2, "data": { "articleUuid": "...", "tiptapTextJson": {...}, ... } }
{ "type": "upsert", "entity": "annotation",     "uuid": "...", "revision": 1, "data": { "articleUuid": "...", "quote": "...", "note": "...", "ordering": 0 } }
{ "type": "upsert", "entity": "image",          "uuid": "...", "revision": 1, "data": { "articleUuid": "...", "name": "...", "type": "jpg", "size": 12345, "description": "..." } }
{ "type": "upsert", "entity": "audio",          "uuid": "...", "revision": 1, "data": { "articleUuid": "...", "name": "...", "type": "mp3", "size": 12345, "duration": 30 } }
{ "type": "upsert", "entity": "video",          "uuid": "...", "revision": 1, "data": { "articleUuid": "...", "name": "...", "type": "mp4", "size": 12345, "duration": 30, "width": 1920, "height": 1080 } }
{ "type": "upsert", "entity": "articleTagRel",  "uuid": "...", "revision": 1, "data": { "articleUuid": "...", "tagUuid": "...",   "tagOrdering": 0 } }
{ "type": "upsert", "entity": "articleGroupRel","uuid": "...", "revision": 1, "data": { "articleUuid": "...", "groupUuid": "...", "groupOrdering": 0 } }
{ "type": "upsert", "entity": "articleArticleRel","uuid": "...", "revision": 1, "data": { "articleUuid": "...", "relatedArticleUuid": "...", "relatedArticleOrdering": 0 } }
{ "type": "delete", "entity": "<entityName>",   "uuid": "...", "revision": N }   // tombstone; receiver applies if its local revision < N
```

`article.data` includes:

- All article columns except local FKs (`ownerId`, `categoryId`) and
  `id`/timestamps.
- `ownerUuid`, `categoryUuid` (resolved from FKs).
- `textTiptapJson` / `explanationTiptapJson` rewritten so embedded
  `imageNode` / `audioNode` / `videoNode` `attrs` carry only `uuid` (plus
  optional display fields like `description`).

Apply order on receiver (or one big deferred-FK transaction):

1. `owner`, `category`, `tag`, `group`
2. `article`
3. `comment`, `annotation`, `image`, `audio`, `video`
4. `articleTagRel`, `articleGroupRel`, `articleArticleRel`
5. After all writes commit, walk newly-written tiptap JSON and resolve
   `attrs.uuid` references to the receiver-local media row IDs/paths.

---

## 7. Out of scope for v1 (named so they don't get asked)

- No encryption of the bundle (rely on transport).
- No multi-part splitting (`partIndex` / `partTotal` reserved but always
  `1/1`).
- No reverse direction (mobile → desktop), so desktop never reads its own
  `applied_bundles`.
- No conflict resolution beyond `revision` last-writer-wins; mobile-only
  edits to a row will be silently overwritten when the next desktop bundle
  arrives.

---

## 8. Master checklist (paste into desktop project tracker)

### Phase 0a — `uuid` + `revision` ✅ Done (2026-04-28)

- [x] Extend `addColumnIfMissing` loop in `backend/sequelize/index.js` to add
      `uuid TEXT UNIQUE` + `revision INTEGER NOT NULL DEFAULT 1` to all 13
      syncable tables (10 entities + 3 junctions)
- [x] One-shot backfill in `initDB` to populate `uuid` for every existing
      row (UUIDv7); set `revision = 1`
- [x] Add UUIDv7 generator dependency (`uuid@^14.0.0`)
- [x] Wire `uuid` generation into every INSERT path (via Sequelize hooks
      registered on each syncable model — no service edits required)
- [x] Wire `revision = revision + 1` into every UPDATE path (via
      `beforeUpdate` + `beforeBulkUpdate` hooks)

Done as part of Phase 1:

- [x] Decide JSDoc-only vs adopt TS for `backend/sync/`; create
      `backend/sync/types.js` with shared typedefs
- [x] Create `backend/sync/syncConstants.js` with `.blt`,
      `application/vnd.bulutlar.sync+zip`, `com.bulutlar.sync`

### Phase 0b v2 — transactional outbox ✅ Done (2026-04-29)

Replaces the soft-delete approach attempted on 2026-04-28 and rolled
back on 2026-04-29 (see §0 log). Design lives in §10. Q7 and Q9
resolved 2026-04-29 → **pointer-only outbox, coalesce at export**.

- [x] Add `sync_outbox` Sequelize model (`backend/sequelize/model/syncOutbox.model.js`)
      with columns `(id, uuid, entityType, op, createdAt, exportedAt)` —
      no `payload`, no `revision` (see §10.2). `sequelize.sync()`
      creates the table on existing installs.
- [x] `sync_outbox` is NOT in `SYNCABLE_MODELS` — engine, not synced
      entity.
- [x] New `backend/sync/outbox.js` exporting `appendOutbox(sequelize,
      {uuid, entityType, op}, {transaction})` and `safeUnlink(absPath)`
      (ENOENT-tolerant; rethrows other errors). Sequelize is passed in
      to avoid a circular import with `backend/sequelize/index.js`.
- [x] Extended `backend/sync/hooks.js` with `afterCreate` /
      `afterBulkCreate` / `afterUpdate` / `afterBulkUpdate` /
      `afterDestroy` / `afterBulkDestroy` hooks. Bulk-update and
      bulk-destroy use a `beforeBulk*` uuid pre-fetch to materialize
      the affected rows for the after-hook (Sequelize bulk hooks
      don't iterate rows). All outbox INSERTs join the caller's
      `options.transaction`.
- [x] Wrapped `ArticleService.deleteArticleById` cascade in a single
      `sequelize.transaction()`; `commentService` and
      `annotationService`'s `deleteByArticleId` variants accept and
      forward `options.transaction`.
- [x] `ImageService` / `AudioService` / `VideoService` deleters:
      `safeUnlink` BEFORE `entity.destroy()`. Both single-id and
      by-article variants thread `options.transaction`. Silent
      top-level `try/catch` removed; `fs.unlink(...)` without `await`
      bug fixed in passing.
- [x] Service-side `.destroy()` and `removeAssociation` calls left
      as-is — the outbox row is emitted by the hook layer.
- [ ] Optional `pruneOutbox({beforeId})` helper for use after bundle
      export ACK (no caller in 0b itself; lands when Phase 3 ships)

### Phase 0c — junction uuids ✅ Subsumed into 0a (2026-04-28)

- [x] Add `uuid` + `revision` to `article_tag_rel`, `article_group_rel`,
      `article_article_rel` and backfill
- [x] Update `addTag` / `removeTag` / `addGroup` / `removeGroup` /
      `addRelatedArticle` / ordering update paths to maintain
      `uuid` + `revision` — no service edits needed; hooks fire on the
      implicit `bulkCreate` Sequelize emits for `belongsToMany` writes

### Phase 1 — types & constants ✅ Done (2026-04-29)

- [x] JSDoc typedefs for `Manifest`, `Operation`, `UpsertOp`, `DeleteOp`,
      per-entity `data` shapes (see §6) — in `backend/sync/types.js`,
      with `APPLY_ORDER` as the only runtime export and
      `TiptapMediaNodeAttrs` locking Q4's `{ uuid, name, description }`
      shape
- [x] `applied_bundles` table created (symmetric, idle on desktop in v1) —
      `backend/sequelize/model/appliedBundle.model.js`, registered in
      `modelDefiners`, NOT in `SYNCABLE_MODELS`
- [x] `exported_bundles` table created (desktop-only) —
      `backend/sequelize/model/exportedBundle.model.js`, registered in
      `modelDefiners`, NOT in `SYNCABLE_MODELS`

### Phase 3 — export feature ✅ Done (2026-04-29)

- [x] Article selector UI ("Generate Update Bundle" + dual-list with
      created/updated/deleted/unchanged filter checkboxes + per-row
      `Latest State ↔ Sil Komutu` toggle) — `SharingModal.jsx` /
      `SharingSettings.jsx`, accordion in `SettingsScreen.jsx`
- [x] Operation builder: emit ops in `APPLY_ORDER` with `uuid`
      references (§6) — `bundleBuilder.js#build()` consumes the
      shape-only inputs prepared by `SharingService.exportBundle`
- [x] Tiptap JSON rewrite: walk `textTiptapJson` /
      `explanationTiptapJson` / `tiptapTextJson` and replace media
      `attrs` with the locked `TiptapMediaNodeAttrs` shape —
      `tiptapRewrite.js#rewriteTiptap()`
- [x] Resolve `ownerId` / `categoryId` to `ownerUuid` /
      `categoryUuid` in article `data` (and `articleId` →
      `articleUuid` on every child + junction row) —
      `SharingService.exportBundle`
- [x] Media collection: copy each image/video/audio file into
      `media/<kind>/<uuid>.<ext>` — `bundleBuilder.js`, stored
      uncompressed (no recompression of already-compressed
      JPEGs/MP3s/MP4s)
- [x] SHA-256 each media file → `mediaChecksums` map (streamed,
      no double-buffering)
- [x] SHA-256 `operations.json` → `operationsChecksum`
- [x] Read `sourceAppVersion` from `app.getVersion()` at runtime
- [x] Generate `bundleId` (UUIDv7 — chose UUIDv7 over ULID to match
      the rest of the codebase's id scheme locked in 0a) and embed
      short prefix in filename: `bulutlar-YYYY-MM-DD-<bundleIdShort>.blt`
- [x] Zip → save with `.blt` extension to Downloads (or app
      cwd if `app.getPath('downloads')` fails)
- [x] "Show in folder" via `shell.showItemInFolder` after success
      (skipped OS share sheet — `Show in folder` matches the rest of
      the app's flow and lets the user attach to WhatsApp via the
      OS file picker)
- [x] Insert row into `exported_bundles` + new
      `exported_bundle_articles` (Q10 fix) inside the same
      transaction that stamps `sync_outbox.exportedAt`
- [x] Size cap soft warning at 250 MB (Q5 resolved) — hardcoded
      `SIZE_WARNING_BYTES` constant in `SharingModal.jsx`

**Phase 3 also delivered (not in original checklist):**

- [x] **Auto-include pending desktop deletes** (Q11) — read-only
      summary in the left pane; tombstone op emitted with
      `SENTINEL_DELETE_REVISION = INT32_MAX` (Q14) since the
      pointer-only outbox doesn't store the row's
      revision-at-delete-time.
- [x] **Remote-only delete via `Sil Komutu` toggle** (Q12) — emits
      `DeleteOp` with `revision = liveRev + 1` without touching
      the desktop row. Resurrection caveat documented.
- [x] **Skip dangling `articleArticleRel` at export time** (Q13) —
      a rel whose `relatedArticleUuid` is neither in the bundle
      nor in `exported_bundle_articles` is silently dropped.

### Phase 5 — later

- [ ] Multi-part splitting via `partIndex` / `partTotal`
- [ ] Schema-version-aware export (refuse to emit if mobile's last-known
      `schemaVersion` is too old)
- [ ] "What have I shared" UI on top of `exported_bundles`
- [ ] Optional bundle encryption with passphrase
- [ ] Reverse direction (mobile → desktop)

---

## 9. Open questions

Resolved during 0a:

- ~~**Q1 — ID scheme**: ULID vs UUIDv7~~ → **UUIDv7** via `uuid@^14`.
- ~~**Q2 — Junction op shape**~~ → **separate ops** with their own
  `uuid`+`revision` (junctions are first-class syncable rows; columns
  shipped in 0a).

Resolved during 0b rollback (2026-04-29):

- ~~**Q3 — Soft-delete scope**~~ → strategy switched to
  **transactional outbox**. Hard-delete + outbox row for every write.
  No `isDeleted` / `deletedAt` columns added on new installs (existing
  customer DBs keep theirs as harmless residue; see §0). Reads no
  longer need any tombstone filtering. See §10.

Resolved during 0b v2 design (2026-04-29):

- ~~**Q7 — Outbox payload shape**~~ → **pointer-only**. The outbox
  stores `(uuid, entityType, op)` and nothing else; no `payload`
  column, no `revision` column. Creates/updates resolve to current
  state via `LEFT JOIN` to the live entity table at export time;
  deletes carry no body in the wire format (§6) so the outbox row
  itself IS the delete op. Trade-off: history is not reconstructable
  on the receiver — only the latest state at each export. Explicitly
  acceptable per product requirements ("last version is enough").
- ~~**Q9 — Coalescing multiple updates between exports**~~ →
  **coalesce at export, store one row per write**. The hook layer
  appends a row on every write (no in-hook deduping); the export
  query collapses to one op per `(entityType, uuid)` via `GROUP BY`.
  See §10.6 for the query. Falls out of pointer-mode for free since
  the outbox row carries no per-op state worth preserving.

Resolved during Phase 1 (2026-04-29):

- ~~**JSDoc vs TypeScript** for the shared sync surface~~ →
  **JSDoc**. Lives in `backend/sync/types.js` as a single file
  mobile copies verbatim. Matches the rest of the repo (plain
  ESM JS, no tsconfig per §3a); cheapest path. The only runtime
  export is the `APPLY_ORDER` array; everything else is `@typedef`.
- ~~**Q4 — Tiptap node `attrs`** rewrite policy~~ →
  **`{ uuid, name, description }`** (uuid-plus-display). Locked
  in `backend/sync/types.js` as `TiptapMediaNodeAttrs`. Keeps a
  display fallback on the receiver if media fails to apply.
  Phase 3's tiptap rewriter MUST drop `id`, `path`, `type`, `size`
  from the original `attrs` before emit.

Resolved during Phase 3 (2026-04-29):

- ~~**Q5 — Bundle size cap**~~ → **250 MB soft warning, no hard cap**.
  WhatsApp's hard limit is 2 GB; 250 MB matches §4's recommendation
  and leaves headroom. Implemented as `SIZE_WARNING_BYTES` constant
  in `SharingModal.jsx`; user can proceed past the warning.
  User-configurable threshold (per §8 "configurable" hedge) deferred
  to Phase 5 — no real-world bundle has hit it yet.
- ~~**Q10 — "previously shared" classifier fidelity**~~ →
  **`exported_bundle_articles` mapping table**. Stamping
  `sync_outbox.exportedAt` was insufficient: an article shared in a
  prior bundle and never written to since has no pending outbox rows
  for the classifier to inspect. The new desktop-only engine table
  records `(bundleId, articleUuid)` for every article shipped (both
  `latestState` and `manualDelete` modes). See §3g and §0's Phase 3
  entry.
- ~~**Q11 — Pending-desktop-deletes UX**~~ → **auto-include,
  read-only summary**. Users cannot individually inspect or skip
  pending deletes (the live row is gone — only the uuid remains).
  Every export carries every pending desktop delete; the modal shows
  count + creation timestamp.
- ~~**Q12 — Remote-only delete (manualDelete)**~~ → **per-row
  `Sil Komutu` toggle in the right pane**. Emits a `DeleteOp` with
  `revision = liveRev + 1` without touching the desktop row.
  **Resurrection caveat:** if the desktop user later edits the same
  article, the next bundle's upsert will resurrect the row on mobile.
  Documented as known v1 behavior; the user opted in by toggling.
- ~~**Q13 — Dangling `articleArticleRel` targets**~~ → **silently
  drop at export time**. If a rel's `relatedArticleUuid` is neither
  in the current bundle's selected articles NOR in
  `exported_bundle_articles` from any prior bundle, skip the rel.
  Mobile can't apply a rel whose target it's never seen.
- ~~**Q14 — `DeleteOp.revision` for auto-included desktop deletes**~~
  → **`SENTINEL_DELETE_REVISION = INT32_MAX = 2147483647`**. The
  pointer-only outbox doesn't store the row's revision-at-time-of-
  delete and the live row is gone, so we use a sentinel high enough
  that mobile applies the tombstone regardless of any revision it
  might already have for that uuid. uuids never repeat on desktop
  (hard-delete + uuidv7), so the sentinel can never collide with a
  legitimate future revision.

Still open, not blocking Phase 3 or downstream phases:

- **Q8 — Pruning policy / peer registry**. When can an outbox row be
  GC'd? Single mobile peer in v1 → prune after
  `peer.lastAckedOutboxId`. Schema supports it (`exportedAt` is now
  populated by Phase 3 export). The `sync_peers` table
  (`peerId`, `lastAckedOutboxId`, `lastAckedAt`) lands when the first
  peer registry is needed; for single-peer-via-WhatsApp v1, manual
  prune ("delete outbox rows older than X" on user command) is enough
  and adds no surface area.

Still open, blocking later mobile work:

- **Q6 — Schema-version mismatch behavior on mobile**: hard reject
  newer-than-mobile bundles, or allow with warning? Belongs to the
  mobile applier (which doesn't exist yet), so this only matters
  once that side starts.

---

## 10. Phase 0b — Transactional outbox (design reference, shipped 2026-04-29)

Replaces the privacy-preserving soft-delete approach attempted on
2026-04-28 and rolled back on 2026-04-29 (see §0 log). This section
was the design surface that drove the 0b v2 implementation and is
preserved as the reference for the on-disk side; the actual
landed-code summary is in §0's 2026-04-29 entry. Phase 3 (export)
will use §10.6 as its starting point.

### 10.1 Why outbox

- Live tables stay clean — no tombstone filtering on reads.
- Hard delete = the row is genuinely gone; privacy is automatic.
- Phase-3 export becomes a `LEFT JOIN` from `sync_outbox` to each
  entity table, grouped by `(entityType, uuid)` to coalesce repeated
  writes. See §10.6.
- Removes every Sequelize-6 paranoid footgun (§0 log).
- Removes the `_backup`-table dance entirely (no `changeColumn` needed
  on new installs).
- Junction re-add becomes a plain INSERT; no restore-or-create branch.

The cost is one new table and a slightly fatter hook layer.

### 10.2 Schema sketch

Pointer-only per Q7 — the outbox records *that* a row changed, not
*what* it changed to. State is read from the live entity table at
export time.

```sql
CREATE TABLE sync_outbox (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,  -- total order
  uuid         VARCHAR(255) NOT NULL,              -- entity uuid (the row's, not a separate one)
  entityType   VARCHAR(64)  NOT NULL,              -- 'article' | 'tag' | 'article_tag_rel' | ...
  op           VARCHAR(8)   NOT NULL,              -- 'create' | 'update' | 'delete'
  createdAt    DATETIME     NOT NULL,
  exportedAt   DATETIME                            -- NULL = pending; set by export, prune key
);
CREATE INDEX sync_outbox_pending ON sync_outbox (exportedAt) WHERE exportedAt IS NULL;
CREATE INDEX sync_outbox_entity  ON sync_outbox (entityType, uuid);
```

No `payload` column (would have stored the row JSON; not needed —
`create`/`update` JOIN to the live table, `delete` carries no body
in the wire format).

No `revision` column either. The outbox just says "this row is
dirty"; the live row's current `revision` is what mobile sees. The
op-time revision would only matter if we cared about the *sequence*
of intermediate revisions, which we explicitly don't (Q9 → coalesce).

### 10.3 Hook flow

The Phase 0a `registerSyncHooks` already wires `beforeCreate` /
`beforeBulkCreate` / `beforeUpdate` / `beforeBulkUpdate` to generate
`uuid` and bump `revision`. Phase 0b adds matching `after*` hooks
(plus `afterDestroy` / `afterBulkDestroy`) that append outbox rows.
With pointer-mode the hooks are near-trivial — no per-entity
serialization, no JSON column to maintain:

```js
afterCreate(instance, options) {
    return appendOutbox({
        uuid:       instance.uuid,
        entityType: model.name,
        op:         'create',
    }, { transaction: options.transaction });
}

afterUpdate(instance, options) {
    return appendOutbox({
        uuid:       instance.uuid,
        entityType: model.name,
        op:         'update',
    }, { transaction: options.transaction });
}

afterDestroy(instance, options) {
    return appendOutbox({
        uuid:       instance.uuid,
        entityType: model.name,
        op:         'delete',
    }, { transaction: options.transaction });
}
```

`options.transaction` is the caller's transaction; the outbox append
joins it so the outbox row commits or rolls back atomically with the
entity write. Bulk variants iterate over `instances` (or use a single
bulk INSERT into `sync_outbox`).

### 10.4 Cascade

`ArticleService.deleteArticleById` becomes:

```js
const tx = await sequelize.transaction();
try {
    // Conservative ordering: unlink files BEFORE any DB mutation.
    // safeUnlink swallows ENOENT, rethrows any other error → tx rolls back.
    for (const m of mediaRows) await safeUnlink(absPath(m));

    // Hard-delete cascades inside the same tx; each destroy fires its
    // own afterDestroy hook → outbox row.
    await commentService.deleteCommentsByArticleId(id,    { transaction: tx });
    await imageService.deleteImagesByArticleId(id,        { transaction: tx });
    await audioService.deleteAudiosByArticleId(id,        { transaction: tx });
    await videoService.deleteVideosByArticleId(id,        { transaction: tx });
    await annotationService.deleteAnnotationsByArticleId(id, { transaction: tx });
    // junctions: plain Model.destroy({where:{articleId:id}, transaction: tx})
    await article.destroy({ transaction: tx });

    await tx.commit();
} catch (e) {
    await tx.rollback();
    throw e;
}
```

One outbox row per cascaded destroy. The wire-format §6 still
applies — junctions and children carry `articleUuid` and the receiver
either runs the apply inside a deferred-FK transaction or sorts ops
dependency-first. Per-row `id` order in the outbox is not load-bearing
once we coalesce at export (see §10.6); dependency ordering on the
emit side is what mobile relies on.

### 10.5 Privacy on hard delete

Same conservative ordering as the rolled-back 0b: file unlink BEFORE
DB transaction; non-ENOENT unlink failures abort everything. After
commit, the row + its content + its media are all gone. The outbox
row stores only `(uuid, entityType, op)` — no row content, so no
content leakage there either.

### 10.6 Export query (coalescing)

Phase-3 work, but the shape matters here because it's why the outbox
schema can stay so thin. Per Q9 the outbox stores one row per write;
collapsing to one op per `(entityType, uuid)` happens at export time.

Pseudocode for "build the next bundle":

```sql
-- Pick the latest pending op per (entityType, uuid).
-- Op precedence at the same row: delete > update > create
-- (a row that was created and then deleted before any export
--  collapses to "skip entirely" — handled in app code, not SQL).
WITH pending AS (
  SELECT entityType, uuid,
         MAX(id) AS lastId,
         -- 'delete' wins, else 'create' if any, else 'update'
         CASE
           WHEN SUM(op = 'delete') > 0 THEN 'delete'
           WHEN SUM(op = 'create') > 0 THEN 'create'
           ELSE 'update'
         END AS finalOp,
         SUM(op = 'create') > 0 AS hadCreate
  FROM sync_outbox
  WHERE exportedAt IS NULL
  GROUP BY entityType, uuid
)
SELECT * FROM pending;
```

Then in app code:

- For each `pending` row with `finalOp IN ('create', 'update')`:
  `LEFT JOIN` to the live entity table by `(entityType, uuid)` and
  emit an `upsert` op with the current row state. If the JOIN comes
  back empty, the row was deleted between coalescing and export —
  treat as `delete` instead.
- For each `pending` row with `finalOp = 'delete'`:
  - If `hadCreate` is true AND no peer has previously acked any op
    for this `(entityType, uuid)` → drop the row entirely (the
    receiver never saw it; nothing to delete).
  - Otherwise → emit a `delete` op (just `uuid` + `entityType`; the
    wire format §6 needs nothing more).
- Sort emitted ops dependency-first per §6 (owners → categories →
  tags → groups → articles → comments/annotations/media → rels).
- After zip is written and bundle is committed: update
  `exportedAt = now()` for all coalesced source rows
  (`WHERE id <= maxIdAtSnapshotTime AND exportedAt IS NULL`).

### 10.7 Pruning

Out of scope for the 0b code itself. The schema is ready: when
bundle export ACKs arrive, set `exportedAt` on the relevant rows;
later, `DELETE FROM sync_outbox WHERE exportedAt < :retention_cutoff`.
The `sync_peers` table from Q8 lands when the first peer registry is
needed.

### 10.8 Edge cases to keep in mind

- **Burst writes within one user action**. e.g. updating an article's
  title in the editor calls `Model.update` which fires `afterUpdate`
  once per affected row → one outbox row per row touched. Multiple
  bursts on the same row before export collapse at export time
  (§10.6).
- **Bulk operations the user triggers** (e.g. "delete all selected
  articles") need to thread one transaction through the whole loop so
  partial failures roll back, including their outbox rows.
- **Hooks must not throw silently**. If `appendOutbox` fails, the
  whole transaction must roll back; otherwise the entity write
  succeeds but mobile never hears about it. Test this explicitly in
  the smoke test.
- **`uuid` must exist by the time the after-hook runs**. Phase 0a
  before-hooks set it on instance creation, so this is already true
  for `create`/`update`. For `destroy`, the row must already have a
  `uuid` (true for any post-0a row; backfilled rows are also covered).
- **Junction destroys with composite PKs**. Use the row's `uuid` as
  the outbox identity (Phase 0a put `uuid` on every junction row);
  the composite PK is reconstructable at export time from the live
  junction table for `create`/`update` ops, and the wire-format
  delete op only needs the junction row's `uuid`.
- **Create-then-delete before any export**. Coalesces to "drop"
  (don't emit anything). See §10.6. This is correct for v1's single
  peer; multi-peer would need to consult the peer ack registry first.
- **Concurrent edits on multiple devices** (out of v1 scope per §7).
  Last-writer-wins by `revision` on the live row still applies; the
  outbox is just the transport.

### 10.9 What gets carried over from the 0b attempt

These were paid for during the rolled-back 0b attempt and are worth
re-introducing in the 0b-v2 patch:

- `safeUnlink(absPath)` helper — ENOENT-tolerant unlink, rethrows
  other errors. Lift into `backend/sync/outbox.js` (or a small
  `backend/sync/fsHelpers.js`).
- Conservative file-unlink-then-DB ordering in image/audio/video
  services.
- Removal of silent top-level `try/catch` in those services so IPC
  errors surface to the renderer.
- `sequelize.transaction()` wrapping `ArticleService.deleteArticleById`.
- `options.transaction` plumbing through media-service deleters.

### 10.10 Smoke-test surface (what to exercise before declaring 0b v2 done)

- Each syncable model: `create` → exactly one outbox row with the
  right `(uuid, entityType, op='create')`.
- Each syncable model: `update` (instance + bulk) → one outbox row
  per affected row with `op='update'`.
- Each syncable model: `destroy` (instance + bulk) → one outbox row
  per destroyed row with `op='delete'`.
- `ArticleService.deleteArticleById` cascade: one transaction, one
  outbox row per cascaded child + junction + parent, all visible in
  `sync_outbox` after commit, none after rollback.
- File unlink failure → entire cascade rolls back → no DB rows
  destroyed and no outbox rows appended.
- Pre-populated DB upgrade path: existing rows (with `uuid` from 0a)
  do NOT generate retroactive outbox rows on first boot. Only writes
  after Phase 0b v2 ships emit ops.
- Coalescing (Phase 3 territory but worth a unit test now):
  - 5 sequential `update`s to one row → outbox has 5 rows; the §10.6
    coalesce query returns 1 row with `finalOp='update'`.
  - `create` → 3× `update` → outbox has 4 rows; coalesce returns
    1 row with `finalOp='create'` (the create dominates updates).
  - `update` → `delete` → outbox has 2 rows; coalesce returns 1 row
    with `finalOp='delete'`.
  - `create` → `delete` (with no prior peer ack) → coalesce returns
    `finalOp='delete'` and `hadCreate=true`; app-level filter drops
    it from the emitted op list.
- `appendOutbox` rejection inside a transaction → the entity write
  rolls back too (no orphan entity write without a matching outbox
  row).
