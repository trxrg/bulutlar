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
];

const initDB = async () => {
    for (const modelDefiner of modelDefiners) {
        modelDefiner(sequelize, DataTypes);
    }
    setRelations(sequelize);
    await sequelize.sync();
};

export { startSequelize, stopSequelize, initDB, sequelize };