import { v7 as uuidv7 } from 'uuid';
import { SYNCABLE_MODELS } from './syncableModels.js';

// Registers Sequelize lifecycle hooks on each syncable model so every write
// path automatically maintains `uuid` and `revision`:
//
//   - beforeCreate / beforeBulkCreate: assign a fresh uuidv7 if missing,
//     and force revision = 1.
//   - beforeUpdate (instance): increment revision by 1.
//   - beforeBulkUpdate (Model.update({ where })): inject
//     `revision = revision + 1` into the SET clause, unless the caller
//     already set a revision value in the same update.
//
// Backfill in ./backfill.js intentionally passes `{ hooks: false }` to
// suppress these hooks during one-shot uuid population.
export function registerSyncHooks(sequelize) {
    for (const name of SYNCABLE_MODELS) {
        const Model = sequelize.models[name];
        if (!Model) {
            console.warn(`registerSyncHooks: model "${name}" not found; skipping`);
            continue;
        }

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

        Model.beforeBulkUpdate((opts) => {
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
        });
    }

    console.info(`registerSyncHooks: registered hooks on ${SYNCABLE_MODELS.length} syncable models`);
}
