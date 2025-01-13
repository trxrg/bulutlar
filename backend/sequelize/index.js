const { Sequelize, DataTypes } = require('sequelize');
const { setRelations } = require('./relations');
const { ensureFolderExists } = require('../fsOps');
const path = require('path');
const { config } = require('../config.js');

let sequelize;
function startSequelize() {
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

    // programSequelize = new Sequelize({
    //     dialect: 'sqlite',
    //     storage: dbPath,
    // });
}

async function stopSequelize() {
	await sequelize.close();
}

const modelDefiners = [
	require('./model/owner.model'),
	require('./model/article.model'),
	require('./model/tag.model'),
	require('./model/category.model'),
	require('./model/comment.model'),
	require('./model/group.model'),
	require('./model/image.model'),
	require('./model/annotation.model'),
	require('./model/lookup.model'),
];

async function initDB() {
	console.info('initializing db');
	
	for (const modelDefiner of modelDefiners) {
		modelDefiner(sequelize, DataTypes);
	}
	
	// We execute any extra setup after the models are defined, such as adding associations.
	setRelations(sequelize);

	await sequelize.sync();
}

startSequelize();

// We export the sequelize connection instance to be used around our app.
module.exports = { sequelize, initDB, startSequelize, stopSequelize };