import fs from 'fs/promises';

// Append a single row to the sync_outbox table inside the caller's
// transaction.
//
// Pointer-only: we record (uuid, entityType, op) and nothing else. The
// payload is reconstructed at export time by JOINing to the live entity
// table; deletes carry no body in the wire format. See
// docs/mobile-sync-plan.md §10.2.
//
// `sequelize` MUST be passed in (we can't `import { sequelize } from
// '../sequelize/index.js'` here without creating a circular import — the
// outbox is wired from inside the sequelize bootstrap).
//
// `options.transaction` is the caller's transaction; the outbox INSERT
// joins it so the outbox row commits or rolls back atomically with the
// entity write. If the caller didn't pass a transaction, the INSERT runs
// in autocommit mode — this is best-effort only and atomicity with the
// entity write is not guaranteed (acceptable for v1; in practice all
// service write paths that matter run inside a transaction).
//
// Throws on failure so the caller's transaction rolls back. Never swallow
// here — the whole point of the outbox is that the entity write and the
// outbox row succeed or fail together.
export async function appendOutbox(sequelize, { uuid, entityType, op }, { transaction } = {}) {
    if (!uuid) {
        // Defensive: Phase 0a guarantees uuid presence on every syncable row,
        // so this should never fire. If it does, log loud and skip rather
        // than insert a row mobile can't address — but DON'T throw, because
        // throwing would roll back the entity write the user just did.
        console.warn(`appendOutbox: missing uuid for entityType=${entityType} op=${op}; skipping`);
        return;
    }

    const SyncOutbox = sequelize.models.syncOutbox;
    if (!SyncOutbox) {
        throw new Error('appendOutbox: syncOutbox model not registered on sequelize instance');
    }

    await SyncOutbox.create(
        { uuid, entityType, op, createdAt: new Date() },
        { transaction }
    );
}

// ENOENT-tolerant unlink. Used by media-service deleters to remove the
// underlying file BEFORE the DB destroy, so a failed unlink (e.g. EACCES,
// EBUSY) aborts the transaction and leaves the row in place rather than
// orphaning the file.
//
// Lifted from the rolled-back 0b attempt's wipe.js — the file-unlink-
// before-DB-mutation ordering survived the soft-delete rollback because
// it's a real win on its own.
export async function safeUnlink(absPath) {
    try {
        await fs.unlink(absPath);
    } catch (err) {
        if (err && err.code === 'ENOENT') return;
        throw err;
    }
}
