import { Sequelize, DataTypes } from 'sequelize';
import { setRelations } from './relations.js';
import { ensureFolderExists } from '../fsOps.js';
import path from 'path';
import { config } from '../config.js';
import ownerModel from './model/owner.model.js';
import articleModel from './model/article.model.js';
import tagModel from './model/tag.model.js';
import categoryModel from './model/category.model.js';
import commentModel from './model/comment.model.js';
import groupModel from './model/group.model.js';
import imageModel from './model/image.model.js';
import audioModel from './model/audio.model.js';
import videoModel from './model/video.model.js';
import annotationModel from './model/annotation.model.js';
import lookupModel from './model/lookup.model.js';
import syncOutboxModel from './model/syncOutbox.model.js';
import appliedBundleModel from './model/appliedBundle.model.js';
import exportedBundleModel from './model/exportedBundle.model.js';
import exportedBundleArticlesModel from './model/exportedBundleArticles.model.js';
import { SYNCABLE_MODELS } from '../sync/syncableModels.js';
import { backfillUuids } from '../sync/backfill.js';
import { registerSyncHooks } from '../sync/hooks.js';

let sequelize;
const startSequelize = async () => {
    const contentDbPath = config.contentDbPath;
    ensureFolderExists(path.dirname(contentDbPath));
    console.info('Resolved contentDbPath:', contentDbPath);

    sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: contentDbPath,
        logQueryParameters: true,
        benchmark: true,
        logging: (msg) => {
            if (msg.startsWith('Executing (default)') && msg.includes('ERROR')) {
                console.error(msg);
            }
        },
        define: {
            timestamps: true
        }
    });

    await initDB();
    
    // Add health check to ensure database is ready
    try {
        await sequelize.authenticate();
        console.info('Database connection has been established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        throw error;
    }
};

const stopSequelize = async () => {
    await sequelize.close();
};

const modelDefiners = [
    ownerModel,
    articleModel,
    tagModel,
    categoryModel,
    commentModel,
    groupModel,
    imageModel,
    audioModel,
    videoModel,
    annotationModel,
    lookupModel,
    syncOutboxModel,
    appliedBundleModel,
    exportedBundleModel,
    exportedBundleArticlesModel,
];

// Accepts either a raw Sequelize DataType (e.g. DataTypes.JSON) or a full
// attribute spec object ({ type, allowNull, defaultValue, ... }).
const addColumnIfMissing = async (qi, table, column, typeOrSpec) => {
    const cols = await qi.describeTable(table);
    if (!cols[column]) {
        const spec = (typeOrSpec && typeof typeOrSpec === 'object' && 'type' in typeOrSpec)
            ? typeOrSpec
            : { type: typeOrSpec };
        await qi.addColumn(table, column, spec);
        console.info(`Added column ${column} to ${table}`);
    }
};

const indexExists = async (qi, table, indexName) => {
    try {
        const indexes = await qi.showIndex(table);
        return indexes.some((idx) => idx.name === indexName);
    } catch (err) {
        console.warn(`Could not list indexes for ${table}:`, err.message);
        return false;
    }
};

const addUniqueIndexIfMissing = async (qi, table, column) => {
    const indexName = `${table}_${column}_unique`;
    if (await indexExists(qi, table, indexName)) return;
    try {
        await qi.addIndex(table, [column], { unique: true, name: indexName });
        console.info(`Added unique index ${indexName} on ${table}.${column}`);
    } catch (err) {
        console.warn(`Could not add unique index ${indexName} on ${table}.${column}:`, err.message);
    }
};

const initDB = async () => {
    for (const modelDefiner of modelDefiners) {
        modelDefiner(sequelize, DataTypes);
    }
    setRelations(sequelize);
    await sequelize.sync();

    // these column additions can be removed after a few releases
    const qi = sequelize.getQueryInterface();
    await addColumnIfMissing(qi, 'articles', 'textTiptapJson', DataTypes.JSON);
    await addColumnIfMissing(qi, 'articles', 'explanationTiptapJson', DataTypes.JSON);
    await addColumnIfMissing(qi, 'comments', 'tiptapTextJson', DataTypes.JSON);

    // Phase 0a sync schema: uuid + revision on every syncable table.
    // Both columns are added unconditionally on existing installs; the unique
    // index on uuid is added separately after backfill so it doesn't fail on
    // the all-NULL column.
    for (const modelName of SYNCABLE_MODELS) {
        const Model = sequelize.models[modelName];
        if (!Model) {
            console.warn(`Syncable model "${modelName}" not found in sequelize.models; skipping`);
            continue;
        }
        const tableName = Model.getTableName();
        await addColumnIfMissing(qi, tableName, 'uuid', { type: DataTypes.STRING, allowNull: true });
        await addColumnIfMissing(qi, tableName, 'revision', { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 });
    }

    await backfillUuids(sequelize);

    for (const modelName of SYNCABLE_MODELS) {
        const Model = sequelize.models[modelName];
        if (!Model) continue;
        await addUniqueIndexIfMissing(qi, Model.getTableName(), 'uuid');
    }

    registerSyncHooks(sequelize);
};

export { startSequelize, stopSequelize, initDB, sequelize };