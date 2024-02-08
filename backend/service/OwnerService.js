const { ipcMain } = require('electron')
const { sequelize } = require("../sequelize");

function initService() {
    ipcMain.handle('addOwner', (event, ownerName) => addOwner(ownerName));
    ipcMain.handle('updateOwnerName', (event, ownerName, newName) => updateOwnerName(ownerName, newName));
    ipcMain.handle('getOwnerWithName', (event, ownerName) => getOwnerWithName(ownerName));
    ipcMain.handle('getAllOwners', getAllOwners);
}

function addOwner(ownerName) {
    return sequelize.models.owner.create({ name: ownerName });
}

function updateOwnerName(ownerName, newName) {
    getOwnerWithName(ownerName).then(owner => owner.update({ name: newName }));
}

function getOwnerWithName(ownerName) {
    return sequelize.models.owner.findOne({ where: { name: ownerName } });
}

function getAllOwners() {
    return sequelize.models.owner.findAll();
}

module.exports = initService;