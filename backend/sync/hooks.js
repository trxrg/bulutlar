import { v7 as uuidv7 } from 'uuid';
import { SYNCABLE_MODELS } from './syncableModels.js';
import { appendOutbox } from './outbox.js';

// Registers Sequelize lifecycle hooks on each syncable model so every write
// path automatically maintains `uuid` and `revision` (Phase 0a) and appends
// a row to `sync_outbox` (Phase 0b).
//
// Phase 0a (uuid + revision):
//   - beforeCreate / beforeBulkCreate: assign a fresh uuidv7 if missing,
//     and force revision = 1.
//   - beforeUpdate (instance): increment revision by 1.
//   - beforeBulkUpdate (Model.update({ where })): inject
//     `revision = revision + 1` into the SET clause, unless the caller
//     already set a revision value in the same update.
//
// Phase 0b (transactional outbox, pointer-only):
//   - afterCreate / afterBulkCreate: append outbox row(s) op='create'.
//   - afterUpdate: append outbox row op='update'.
//   - afterDestroy: append outbox row op='delete'.
//   - bulk-update / bulk-destroy can't see per-row instances in the after
//     hook, so we pre-fetch affected uuids in beforeBulk{Update,Destroy}
//     and emit one row per uuid in afterBulk{Update,Destroy}.
//
// All Phase-0b INSERTs are joined to the caller's `options.transaction` so
// the outbox row commits or rolls back atomically with the entity write.
//
// Backfill in ./backfill.js intentionally passes `{ hooks: false }` to
// suppress these hooks during one-shot uuid population — important for
// 0b v2 too, otherwise the upgrade boot would emit retroactive outbox
// rows for every pre-existing row.
export function registerSyncHooks(sequelize) {
    for (const name of SYNCABLE_MODELS) {
        const Model = sequelize.models[name];
        if (!Model) {
            console.warn(`registerSyncHooks: model "${name}" not found; skipping`);
            continue;
        }

        // ------------------------------------------------------------------
        // Phase 0a — uuid + revision maintenance
        // ------------------------------------------------------------------

        Model.beforeCreate((row) => {
            if (!row.uuid) row.uuid = uuidv7();
            if (row.revision == null) row.revision = 1;
        });

        Model.beforeBulkCreate((rows) => {
            for (const row of rows) {
                if (!row.uuid) row.uuid = uuidv7();
                if (row.revision == null) row.revision = 1;
            }
        });

        Model.beforeUpdate((row) => {
            row.revision = (row.revision || 0) + 1;
        });

        Model.beforeBulkUpdate(async (opts) => {
            opts.attributes = opts.attributes || {};
            if (opts.attributes.revision == null) {
                opts.attributes.revision = sequelize.literal('revision + 1');
                // Sequelize 6 filters attributes against options.fields, which
                // is initialized to Object.keys(values). If revision wasn't in
                // the original values it must be added explicitly or it gets
                // dropped before the SQL is built.
                if (Array.isArray(opts.fields) && !opts.fields.includes('revision')) {
                    opts.fields.push('revision');
                }
            }

            // Phase 0b: pre-fetch affected uuids so afterBulkUpdate can emit
            // one outbox row per row (the after hook itself doesn't get the
            // instances — Sequelize bulk hooks only see the options bag).
            try {
                const rows = await Model.findAll({
                    where: opts.where,
                    attributes: ['uuid'],
                    transaction: opts.transaction,
                });
                opts._outboxUuids = rows.map((r) => r.uuid).filter(Boolean);
            } catch (err) {
                console.warn(`beforeBulkUpdate: uuid pre-fetch failed for ${name}:`, err.message);
                opts._outboxUuids = [];
            }
        });

        // ------------------------------------------------------------------
        // Phase 0b — outbox emission
        // ------------------------------------------------------------------

        Model.afterCreate(async (instance, options) => {
            await appendOutbox(
                sequelize,
                { uuid: instance.uuid, entityType: name, op: 'create' },
                { transaction: options.transaction }
            );
        });

        Model.afterBulkCreate(async (instances, options) => {
            for (const inst of instances) {
                await appendOutbox(
                    sequelize,
                    { uuid: inst.uuid, entityType: name, op: 'create' },
                    { transaction: options.transaction }
                );
            }
        });

        Model.afterUpdate(async (instance, options) => {
            await appendOutbox(
                sequelize,
                { uuid: instance.uuid, entityType: name, op: 'update' },
                { transaction: options.transaction }
            );
        });

        Model.afterBulkUpdate(async (opts) => {
            const uuids = opts._outboxUuids || [];
            for (const uuid of uuids) {
                await appendOutbox(
                    sequelize,
                    { uuid, entityType: name, op: 'update' },
                    { transaction: opts.transaction }
                );
            }
        });

        Model.beforeBulkDestroy(async (opts) => {
            try {
                const rows = await Model.findAll({
                    where: opts.where,
                    attributes: ['uuid'],
                    transaction: opts.transaction,
                });
                opts._outboxUuids = rows.map((r) => r.uuid).filter(Boolean);
            } catch (err) {
                console.warn(`beforeBulkDestroy: uuid pre-fetch failed for ${name}:`, err.message);
                opts._outboxUuids = [];
            }
        });

        Model.afterDestroy(async (instance, options) => {
            await appendOutbox(
                sequelize,
                { uuid: instance.uuid, entityType: name, op: 'delete' },
                { transaction: options.transaction }
            );
        });

        Model.afterBulkDestroy(async (opts) => {
            const uuids = opts._outboxUuids || [];
            for (const uuid of uuids) {
                await appendOutbox(
                    sequelize,
                    { uuid, entityType: name, op: 'delete' },
                    { transaction: opts.transaction }
                );
            }
        });
    }

    console.info(`registerSyncHooks: registered hooks on ${SYNCABLE_MODELS.length} syncable models`);
}
