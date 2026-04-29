// Phase 1: desktop-side "what have I shared" log written by the Phase 3
// export feature and read by the Phase 5 history UI. See
// docs/mobile-sync-plan.md §3g and §4g.
//
// Engine table — NOT a member of SYNCABLE_MODELS; export bookkeeping is
// desktop-only and never travels across the wire.
export default (sequelize, DataTypes) => {
    const ExportedBundle = sequelize.define('exportedBundle', {
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
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        opCount: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        articleCount: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        sizeBytes: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        filePath: {
            type: DataTypes.STRING,
        },
    }, {
        tableName: 'exported_bundles',
        timestamps: false,
    });

    return ExportedBundle;
};
