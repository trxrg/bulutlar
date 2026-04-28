import { v7 as uuidv7 } from 'uuid';
import { SYNCABLE_MODELS } from './syncableModels.js';

// Fills `uuid` for every row in every syncable table that still has NULL.
// Idempotent: a no-op once every row has a uuid.
//
// Uses raw Sequelize updates with `hooks: false` to avoid the revision-bump
// hook firing during backfill (which would also be a no-op since we don't
// touch the revision column here, but `hooks: false` makes the intent
// explicit).
export async function backfillUuids(sequelize) {
    let totalBackfilled = 0;
    for (const modelName of SYNCABLE_MODELS) {
        const Model = sequelize.models[modelName];
        if (!Model) {
            console.warn(`backfillUuids: model "${modelName}" not found; skipping`);
            continue;
        }

        // Junction tables use composite PKs (no `id` column), so derive the
        // PK column names from the model itself rather than hardcoding `id`.
        const pkAttrs = Model.primaryKeyAttributes && Model.primaryKeyAttributes.length > 0
            ? Model.primaryKeyAttributes
            : ['id'];

        let rows;
        try {
            rows = await Model.findAll({ where: { uuid: null }, attributes: pkAttrs });
        } catch (err) {
            // If the column doesn't exist yet (race during a partial migration),
            // skip rather than crash. addColumnIfMissing in initDB should have
            // added it before we got here, but be defensive.
            console.warn(`backfillUuids: findAll failed for ${modelName}:`, err.message);
            continue;
        }

        if (rows.length === 0) continue;

        for (const row of rows) {
            const where = {};
            for (const k of pkAttrs) where[k] = row[k];
            try {
                await Model.update(
                    { uuid: uuidv7() },
                    { where, hooks: false }
                );
                totalBackfilled += 1;
            } catch (err) {
                console.error(`backfillUuids: update failed for ${modelName} pk=${JSON.stringify(where)}:`, err.message);
            }
        }
        console.info(`backfillUuids: filled ${rows.length} uuid(s) on ${modelName}`);
    }

    if (totalBackfilled > 0) {
        console.info(`backfillUuids: backfilled ${totalBackfilled} row(s) total`);
    }
}
