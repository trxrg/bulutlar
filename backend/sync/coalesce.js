// Phase 3 export-time coalescing query, per docs/mobile-sync-plan.md §10.6.
//
// The hook layer (Phase 0b) appends one row per write to sync_outbox; this
// helper collapses repeated writes per (entityType, uuid) down to a single
// "final op" the export pipeline emits. Coalescing happens at export time
// (Q9 resolved 2026-04-29: append-only outbox, coalesce here).
//
// Op precedence at the same row:
//   delete  > create > update
//
// `delete` wins because once mobile applies a tombstone the row is gone;
// any update before it is moot. `create` beats `update` because the
// coalesced op is going to a peer that's never seen this row before
// (otherwise we'd have classified the article as "updated" not "created").
//
// `hadCreate` is the export-time filter switch: when an outbox sequence
// reads as create+...+delete with no peer ack between (i.e. no row in
// `exported_bundle_articles` for this uuid), the entire op set should be
// dropped — the receiver never saw the row, nothing to delete.

import { QueryTypes } from 'sequelize';

// Returns one row per (entityType, uuid) for pending outbox rows, with
// the coalesced final op and a flag indicating whether any of the
// underlying rows was a 'create'. Pending = `exportedAt IS NULL`.
//
// `options.entityTypes` (string[]) restricts the GROUP scope; pass
// `['article']` for SharingService.getCandidates(), or all 13 syncable
// types for full export.
//
// `options.maxOutboxId` (number, optional) caps the snapshot to a stable
// upper bound the caller pre-snapshotted with `MAX(id) FROM sync_outbox`.
// Without it, a write happening between coalesce and stamp would land in
// the bundle but never be marked exported. Callers that mutate
// sync_outbox after the SELECT MUST pass this.
//
// `options.transaction` is forwarded to the underlying query.
export async function coalescePending(sequelize, options = {}) {
    const { entityTypes, maxOutboxId, transaction } = options;

    const where = ['exportedAt IS NULL'];
    const replacements = {};

    if (Array.isArray(entityTypes) && entityTypes.length > 0) {
        where.push('entityType IN (:entityTypes)');
        replacements.entityTypes = entityTypes;
    }

    if (typeof maxOutboxId === 'number') {
        where.push('id <= :maxOutboxId');
        replacements.maxOutboxId = maxOutboxId;
    }

    const sql = `
        SELECT
            entityType,
            uuid,
            MAX(id) AS lastId,
            CASE
                WHEN SUM(CASE WHEN op = 'delete' THEN 1 ELSE 0 END) > 0 THEN 'delete'
                WHEN SUM(CASE WHEN op = 'create' THEN 1 ELSE 0 END) > 0 THEN 'create'
                ELSE 'update'
            END AS finalOp,
            (SUM(CASE WHEN op = 'create' THEN 1 ELSE 0 END) > 0) AS hadCreate
        FROM sync_outbox
        WHERE ${where.join(' AND ')}
        GROUP BY entityType, uuid
    `;

    const rows = await sequelize.query(sql, {
        type: QueryTypes.SELECT,
        replacements,
        transaction,
    });

    return rows.map((r) => ({
        entityType: r.entityType,
        uuid: r.uuid,
        lastId: Number(r.lastId),
        finalOp: r.finalOp,
        hadCreate: Boolean(Number(r.hadCreate)),
    }));
}

// Returns the current MAX(id) of sync_outbox, used as the snapshot
// upper bound by callers that will later UPDATE exportedAt.
//
// Returns 0 if the table is empty (any subsequent stamp UPDATE will
// match nothing, which is the correct behavior).
export async function snapshotOutboxMaxId(sequelize, { transaction } = {}) {
    const rows = await sequelize.query(
        'SELECT COALESCE(MAX(id), 0) AS maxId FROM sync_outbox',
        { type: QueryTypes.SELECT, transaction }
    );
    return Number(rows[0]?.maxId || 0);
}
