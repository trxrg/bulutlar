const { ipcMain } = require('electron')
const sequelize = require('../../sequelize');


function initService() {
    ipcMain.handle('ping', () => 'pong');
    ipcMain.handle('getFromDb', getFromDb);
    ipcMain.handle('checkDbConnection', assertDatabaseConnectionOk);
}

function getFromDb() {
    return sequelize.models.orchestra.findAll();
}

async function assertDatabaseConnectionOk() {
    console.log(`Checking database connection...`);
    try {
        await sequelize.authenticate();
        console.log('Database connection OK!');
    } catch (error) {
        console.log('Unable to connect to the database:');
        console.log(error.message);
        process.exit(1);
    }
}

module.exports = { initService }