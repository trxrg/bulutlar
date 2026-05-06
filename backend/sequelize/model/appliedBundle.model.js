import { Sequelize } from 'sequelize';

// Receiver-side log of every bundle that has been applied to this DB,
// keyed by manifest.bundleId. Schema is symmetric across desktop and
// mobile (see docs/mobile-sync-plan.md §1c) so a content.db snapshot
// from either side applies cleanly on the other. Engine table — NOT a
// member of SYNCABLE_MODELS; bundle-application state is per-device
// and never travels across the wire.
export default (sequelize, DataTypes) => {
    const AppliedBundle = sequelize.define('appliedBundle', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        bundleId: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        appliedAt: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: Sequelize.literal("(datetime('now'))"),
        },
        opCount: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        articleCount: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        sourceApp: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        sourceAppVersion: {
            type: DataTypes.STRING,
        },
        schemaVersion: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
    }, {
        tableName: 'applied_bundles',
        timestamps: false,
    });

    return AppliedBundle;
};
