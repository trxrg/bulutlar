const { ipcMain } = require('electron')
const { sequelize }= require('../../sequelize');


function initService() {
    ipcMain.handle('ping', () => 'pong');
    ipcMain.handle('getFromDb', getFromDb);
    ipcMain.handle('checkDbConnection', assertDatabaseConnectionOk);
    ipcMain.handle('addOwnerAndArticle', addOwnerAndArticle);
    ipcMain.handle('getAllOwners', getAllOwners);
    ipcMain.handle('getAllArticles', getAllArticles);
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

function getAllOwners() {
    return sequelize.models.owner.findAll();
}

function getAllArticles() {
    return sequelize.models.article.findAll();
}

async function addOwnerAndArticle() {
    const owner1 = await sequelize.models.owner.create({ name: "owner1" });
    owner1.createArticle({
        title: "title1",
        text: "text1"
    })
}


module.exports = { initService }