const { ipcMain } = require('electron')
const { Op } = require("sequelize");
const { sequelize } = require("../sequelize");

function initService() {
    ipcMain.handle('owner/create', (event, owner) => createOwner(owner));


    ipcMain.handle('updateOwnerName', (event, ownerName, newName) => updateOwnerName(ownerName, newName));
    ipcMain.handle('getOwnerWithName', (event, ownerName) => getOwnerWithName(ownerName));
    ipcMain.handle('getOwnerWithNameLike', (event, nameLike) => getOwnerWithNameLike(nameLike));
    ipcMain.handle('getOwnerWithId', (event, id) => getOwnerWithId(id));
    ipcMain.handle('getAllOwners', getAllOwners);
    ipcMain.handle('deleteOwnerWithName', (event, ownerName) => deleteOwnerWithName(ownerName));
}

async function createOwner(owner) {
    try {
        const result = await sequelize.models.owner.create({ name: owner.name.trim() });
        return result.dataValues;
    } catch (e) {
        return {error: e};
    }
}

async function updateOwnerName(ownerName, newName) {
    const owner = await sequelize.models.owner.findOne({ where: { name: ownerName } });
    const result = await owner.update({ name: newName });
    return result.dataValues;
}

async function getOwnerWithName(ownerName) {
    return await sequelize.models.owner.findOne({ where: { name: ownerName } });
}

async function getOwnerDataWithName(ownerName) {
    const result = await sequelize.models.owner.findOne({ where: { name: ownerName } });
    return result.dataValues;
}

async function getOwnerWithNameAddIfNotPresent(ownerName) {

    let result = await getOwnerWithName(ownerName);
    if (!result)
        result = await sequelize.models.owner.create({ name: ownerName });

    return result;
}

async function getOwnerWithId(id) {
    const result = await sequelize.models.owner.findByPk(id);
    return result.dataValues;
}

async function getOwnerWithNameLike(nameLike) {
    const result = await sequelize.models.owner.findAll({
        where: {
            name: {
                [Op.like]: '%' + nameLike + '%'
            }
        }
    });
    return result.map(item => item.dataValues);
}

async function getAllOwners() {
    const result = await sequelize.models.owner.findAll();
    return result.map(item => item.dataValues);
}

async function deleteOwnerWithName(ownerName) {
    await sequelize.models.owner.destroy({ where: { name: ownerName } });
    return getAllOwners();
}

module.exports = {
    addOwner: createOwner,
    getOwnerWithNameAddIfNotPresent,
    initService
};
