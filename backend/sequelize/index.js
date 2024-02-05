const { Sequelize, DataTypes } = require('sequelize');
const { applyExtraSetup } = require('./extra-setup');

// In a real app, you should keep the database connection URL as an environment variable.
// But for this example, we will just use a local SQLite database.
// const sequelize = new Sequelize(process.env.DB_CONNECTION_URL);
const sequelize = new Sequelize({
	dialect: 'sqlite',
	storage: './backend/db/test.db',
	logQueryParameters: true,
	benchmark: true,
	define: {
		timestamps: false
	}
});

const modelDefiners = [
	require('./models/user.model'),
	require('./models/instrument.model'),
	require('./models/orchestra.model'),
	require('./models/owner.model'),
	require('./models/article.model')
	// Add more models here...
	// require('./models/item'),
];

function initDB() {
	// We define all models according to their files.
	for (const modelDefiner of modelDefiners) {
		modelDefiner(sequelize, DataTypes);
	}

	// We execute any extra setup after the models are defined, such as adding associations.
	applyExtraSetup(sequelize);

	sequelize.sync();
}

// We export the sequelize connection instance to be used around our app.
module.exports = { sequelize, initDB };