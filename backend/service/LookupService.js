const { ipcMain } = require('electron')
const { sequelize } = require("../sequelize");

function initService() {
    ipcMain.handle('lookup/create', (event, lookup) => createLookup(lookup));
    ipcMain.handle('lookup/getByLabel', (event, label) => getArticleByLabel(label));
}

async function createLookup(lookup) {
    try {
        const result = await sequelize.models.lookup.create(lookup);

        return result;
    } catch (err) {
        console.error('Error in createLookup ', err);
    }
}

async function getArticleByLabel(label) {
    try {
        const lookup = await sequelize.models.lookup.findOne({
            where: {
                label: label
            }
        });

        if (!lookup)
            throw ('no lookup found with label: ' + label);

        return lookup;
    } catch (err) {
        console.error('Error in getArticleByLabel', err);
    }
}

module.exports = {
    initService
};
