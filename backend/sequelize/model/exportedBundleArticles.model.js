// Phase 3 mapping table — records "this article was sent in this bundle".
//
// Used by SharingService.getCandidates() as the canonical "previously
// shared" oracle, replacing the brittle "has any outbox row with
// exportedAt IS NOT NULL" proxy. Two rows are inserted per export per
// participating article (one for each `latestState` AND each
// `manualDelete` uuid) inside the same transaction that writes the
// `exported_bundles` row and stamps `sync_outbox.exportedAt`.
//
// Engine-only — NOT a member of SYNCABLE_MODELS; never travels across
// the wire. Created via sequelize.sync() on next boot, same fresh-table
// pattern as sync_outbox / applied_bundles / exported_bundles.
export default (sequelize, DataTypes) => {
    const ExportedBundleArticle = sequelize.define('exportedBundleArticle', {
        bundleId:    { type: DataTypes.STRING, primaryKey: true, allowNull: false },
        articleUuid: { type: DataTypes.STRING, primaryKey: true, allowNull: false },
    }, {
        tableName: 'exported_bundle_articles',
        timestamps: false,
        indexes: [
            { fields: ['articleUuid'], name: 'exported_bundle_articles_uuid' },
        ],
    });

    return ExportedBundleArticle;
};
