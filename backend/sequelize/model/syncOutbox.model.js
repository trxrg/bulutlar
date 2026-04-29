// Phase 0b transactional outbox.
//
// One row per write to a syncable entity (append-only). The Phase 0b after-
// hooks in backend/sync/hooks.js insert into this table inside the caller's
// transaction so the outbox row commits or rolls back atomically with the
// entity write.
//
// Pointer-only: we record THAT a row changed, not WHAT it changed to. State
// is read from the live entity table at export time (Phase 3) via a
// LEFT JOIN on (entityType, uuid). Repeated writes to the same row collapse
// at export time — see docs/mobile-sync-plan.md §10.6.
//
// Not a member of SYNCABLE_MODELS — this is the engine, not a synced entity.
export default (sequelize, DataTypes) => {
    const SyncOutbox = sequelize.define('syncOutbox', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        uuid: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        entityType: {
            type: DataTypes.STRING(64),
            allowNull: false,
        },
        op: {
            type: DataTypes.STRING(8),
            allowNull: false,
            validate: {
                isIn: [['create', 'update', 'delete']],
            },
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        exportedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    }, {
        tableName: 'sync_outbox',
        timestamps: false,
        indexes: [
            { name: 'sync_outbox_pending', fields: ['exportedAt'] },
            { name: 'sync_outbox_entity', fields: ['entityType', 'uuid'] },
        ],
    });

    return SyncOutbox;
};
