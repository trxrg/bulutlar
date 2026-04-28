# Bulutlar Desktop → Mobile Sync — Plan & Review

Status: **Phase 0a + 0c complete (uuid + revision on all 13 syncable tables, including junctions). Phase 0b (soft delete) is next.**
Last updated: 2026-04-28

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

### Next step — Phase 0b (soft delete)

See §8 checklist below. Open question 3 ("soft-delete scope") needs to
resolve before coding. Phase 0c is no longer a separate ship — its schema
work was rolled into 0a; any remaining 0c bookkeeping is covered by the
hooks.

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
- The constants triple: extension `.blz`, MIME
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
- Output extension: `.blz` (NOT `.zip`).
- Suggested filename: `bulutlar-YYYY-MM-DD.blz` (see §3a for refinement).

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

### 3g. `applied_bundles` vs the desktop's "exported bundles" log

These are different semantics. Use **two** tables, not one:

- `applied_bundles` on both sides: same schema, used by mobile when apply
  succeeds, used by desktop only if reverse direction is ever added.
- `exported_bundles` desktop-only with
  `(bundleId, createdAt, opCount, sizeBytes, articleCount, filePath)`.

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
  `bulutlar-2026-04-28-01HXX1234.blz`.
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
  mobile OS's file-association handling for `.blz`, not on WhatsApp.
- WhatsApp's document size cap is 2 GB now (bumped from 100 MB years ago).
  The plan's ~100 MB is conservative. Cap at ~250 MB for v1 to leave
  headroom; revisit splitting later.

---

## 5. Sequencing — Phase 0 is bigger than it looks

Desktop-side "Phase 0" was originally planned as three sub-phases. As of
2026-04-28, 0a and 0c shipped together (the junction-uuid work was cheap
once the hook infrastructure existed):

1. **0a. Add `uuid` + `revision` columns + backfill.** ✅ **Done.** See §0.
2. **0b. Soft-delete migration** (separate because it touches every
   service). Set `isDeleted`, keep cascading from articles. **Next up.**
3. **0c. Junction rows get `uuid`+`revision`** (`article_tag_rel`,
   `article_group_rel`, `article_article_rel`). ✅ **Done as part of 0a.**

Only after 0a–0c are in everyone's hands should bundle emission start;
otherwise old desktops will produce bundles missing junction uuids and the
mobile applier will struggle. With 0a+0c shipped, that gate is half-open;
0b unblocks delete propagation.

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

Deferred to Phase 1 (typing & constants):

- [ ] Decide JSDoc-only vs adopt TS for `backend/sync/`; create
      `backend/sync/types.js` with shared typedefs
- [ ] Create `backend/sync/syncConstants.js` with `.blz`,
      `application/vnd.bulutlar.sync+zip`, `com.bulutlar.sync`

### Phase 0b — soft delete (next)

- [ ] Decide soft-delete scope (which tables get `isDeleted`) — open
      question §9.3
- [ ] Add `isDeleted BOOLEAN DEFAULT 0` to chosen tables (use the same
      `addColumnIfMissing` loop pattern as 0a)
- [ ] Update every `destroy()` call in services to soft-delete + bump
      `revision` (NOTE: setting `isDeleted = 1` via Sequelize update will
      automatically bump `revision` thanks to the 0a hooks — no manual
      bump needed, just don't set revision in the update)
- [ ] Filter `isDeleted = 1` in all read paths
- [ ] Cascade: `deleteArticleById` should soft-delete the article AND its
      child comments / annotations / images / audios / videos / junction
      rows (mirrors current hard-delete cascade in `ArticleService.js`)

### Phase 0c — junction uuids ✅ Subsumed into 0a (2026-04-28)

- [x] Add `uuid` + `revision` to `article_tag_rel`, `article_group_rel`,
      `article_article_rel` and backfill
- [x] Update `addTag` / `removeTag` / `addGroup` / `removeGroup` /
      `addRelatedArticle` / ordering update paths to maintain
      `uuid` + `revision` — no service edits needed; hooks fire on the
      implicit `bulkCreate` Sequelize emits for `belongsToMany` writes

### Phase 1 — types & constants

- [ ] JSDoc typedefs for `Manifest`, `Operation`, `UpsertOp`, `DeleteOp`,
      per-entity `data` shapes (see §6)
- [ ] `applied_bundles` table created (symmetric, idle on desktop in v1)
- [ ] `exported_bundles` table created (desktop-only)

### Phase 3 — export feature

- [ ] Article selector UI ("Generate bundle" + multi-select + optional
      "changed since")
- [ ] Operation builder: emit ops in dependency order with `uuid` references
      (§6)
- [ ] Tiptap JSON rewrite: walk `textTiptapJson` /
      `explanationTiptapJson` / `tiptapTextJson` and replace media `attrs`
      with `uuid`-only refs
- [ ] Resolve `ownerId` / `categoryId` to `ownerUuid` / `categoryUuid` in
      article `data`
- [ ] Media collection: copy each image/video/audio file into
      `media/<kind>/<uuid>.<ext>`
- [ ] SHA-256 each media file → `mediaChecksums` map
- [ ] SHA-256 `operations.json` → `operationsChecksum`
- [ ] Read `sourceAppVersion` from `app.getVersion()` at runtime
- [ ] Generate `bundleId` (ULID) and embed short prefix in filename
- [ ] Zip → rename to `.blz` → save to Downloads
- [ ] Trigger OS share sheet / "Show in folder"
- [ ] Insert row into `exported_bundles`
- [ ] Size cap warning at ~250 MB (configurable)

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

- ~~**ID scheme**: ULID vs UUIDv7~~ → **UUIDv7** via `uuid@^14`.
- ~~**Junction op shape**~~ → **separate ops** with their own
  `uuid`+`revision` (junctions are first-class syncable rows; columns
  shipped in 0a).

Still open, blocking phase 0b:

3. **Soft-delete scope**: every syncable table vs only user-deletable
    entities (articles, comments, annotations, images, audios, videos,
    junction rows). Tags/groups/owners/categories don't currently expose
    a delete UI to the user; arguably they don't need `isDeleted`.

Still open, blocking later phases (phase 1 / phase 3):

1. **JSDoc vs TypeScript** for the shared sync surface — pick before
   phase 1.
4. **Tiptap node `attrs`**: keep just `uuid`, or also keep
    `description` / `name` for display fallback?
5. **Bundle size cap**: 100 MB (conservative) vs 250 MB (recommended) vs
    let user override.
6. **Schema-version mismatch behavior on mobile**: hard reject newer-than-
    mobile bundles, or allow with warning?
