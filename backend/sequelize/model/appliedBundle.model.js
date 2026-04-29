// Phase 1: receiver-side log of every bundle that has been applied to this
// DB, keyed by the bundle's manifest.bundleId. Symmetric across desktop and
// mobile per docs/mobile-sync-plan.md §3g — but in v1 (one-way desktop ->
// mobile) it stays empty on the desktop and is written only by the mobile
// applier.
//
// Engine table — NOT a member of SYNCABLE_MODELS; bundle-application state
// is per-device and never travels across the wire.
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
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        opCount: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        sourceApp: {
            type: DataTypes.STRING,
        },
        sourceVersion: {
            type: DataTypes.STRING,
        },
    }, {
        tableName: 'applied_bundles',
        timestamps: false,
    });

    return AppliedBundle;
};
