const { Sequelize, DataTypes } = require('sequelize');
const { setRelations } = require('./relations');

// In a real app, you should keep the database connection URL as an environment variable.
// But for this example, we will just use a local SQLite database.
// const sequelize = new Sequelize(process.env.DB_CONNECTION_URL);
const sequelize = new Sequelize({
	dialect: 'sqlite',
	storage: './backend/db/test.db',
	logQueryParameters: true,
	benchmark: true,
	logging: (msg) => {
		if (msg.startsWith('Executing (default)') && msg.includes('ERROR')) {
			// Log only messages containing 'ERROR' (adjust condition as per your Sequelize version)
			console.error(msg);
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
	require('./model/comment.model')
];

function initDB() {
	console.log('initializing db');

	for (const modelDefiner of modelDefiners) {
		modelDefiner(sequelize, DataTypes);
	}

	// We execute any extra setup after the models are defined, such as adding associations.
	setRelations(sequelize);

	sequelize.sync();
}

// We export the sequelize connection instance to be used around our app.
module.exports = { sequelize, initDB };