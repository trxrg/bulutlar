import { Sequelize } from 'sequelize';
import { Umzug, SequelizeStorage } from 'umzug';

// Use the same Sequelize instance as in your index.js
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './data/main.db',
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

// Configure Umzug for migrations
const umzug = new Umzug({
  migrations: {
    glob: '../migrations/*.js',
  },
  storage: new SequelizeStorage({ sequelize }),
  context: sequelize.getQueryInterface(),
  logger: console,
});

(async () => {
  try {
    await umzug.up();
    console.log('Migrations applied successfully');
  } catch (error) {
    console.error('Failed to apply migrations:', error);
  } finally {
    await sequelize.close();
  }
})();

// run using 
// node migrate.js