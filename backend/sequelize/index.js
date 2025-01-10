const { Sequelize, DataTypes } = require('sequelize');
const { setRelations } = require('./relations');
const { ensureFolderExists } = require('../fsOps');
const path = require('path');
const { config } = require('../config.js');
const { log, error, warn } = require('../logger');

const dbPath = config.dbPath;
ensureFolderExists(path.dirname(dbPath));

log('Resolved dbPath:', dbPath);

const sequelize = new Sequelize({
	dialect: 'sqlite',
	storage: dbPath,
	logQueryParameters: true,
	benchmark: true,
	logging: (msg) => {
		if (msg.startsWith('Executing (default)') && msg.includes('ERROR')) {
			// Log only messages containing 'ERROR' (adjust condition as per your Sequelize version)
			error(msg);
		}
	},
	define: {
		timestamps: true
	}
});

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
	log('initializing db');

	for (const modelDefiner of modelDefiners) {
		modelDefiner(sequelize, DataTypes);
	}

	// We execute any extra setup after the models are defined, such as adding associations.
	setRelations(sequelize);

	await sequelize.sync();
}

// We export the sequelize connection instance to be used around our app.
module.exports = { sequelize, initDB };