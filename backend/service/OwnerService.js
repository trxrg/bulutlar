const { ipcMain } = require('electron')
const { Op } = require("sequelize");
const { sequelize } = require("../sequelize");

function initService() {
    ipcMain.handle('owner/create', (event, owner) => createOwner(owner));
    ipcMain.handle('owner/updateName', (event, id, newName) => updateOwnerName(id, newName));
    ipcMain.handle('owner/getAll', getAllOwners);
    ipcMain.handle('owner/getById', (event, id) => getOwnerById(id));
    ipcMain.handle('owner/deleteById', (event, id) => deleteOwnerById(id));

    ipcMain.handle('getOwnerWithName', (event, ownerName) => getOwnerWithName(ownerName));
    ipcMain.handle('getOwnerWithNameLike', (event, nameLike) => getOwnerWithNameLike(nameLike));

    ipcMain.handle('deleteOwnerWithName', (event, ownerName) => deleteOwnerWithName(ownerName));
}

async function createOwner(owner) {
    try {
        const result = await sequelize.models.owner.create({ name: owner.name.trim() });
        return result.dataValues;
    } catch (e) {
        return { error: e };
    }
}

async function updateOwnerName(id, newName) {
    try {
        const owner = await sequelize.models.owner.findByPk(id);
        const result = await owner.update({ name: newName });
        return result.dataValues;
    } catch (e) {
        console.error('Error updating owner name:', e);
        return { error: e };
    }
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

async function getOwnerById(id) {
    const result = await sequelize.models.owner.findByPk(id);
    if (!result)
        return { error: 'Owner not found' };
    result.dataValues.articleCount = await result.countArticles();
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
    const result = await sequelize.models.owner.findAll({
        attributes: {
            include: [
                [sequelize.fn('COUNT', sequelize.col('articles.id')), 'articleCount'],
            ]
        },
        include: [
            {
                model: sequelize.models.article,
                as: 'articles',
                attributes: [],
            },
        ],
        group: ['Owner.id'],
    });
    return result.map(item => item.dataValues);
}

async function deleteOwnerWithName(ownerName) {
    await sequelize.models.owner.destroy({ where: { name: ownerName } });
    return getAllOwners();
}

async function deleteOwnerById(id) {

    try {
        const owner = await sequelize.models.owner.findByPk(id);
        const articleCount = await owner.countArticles();

        if (articleCount > 0)
            throw ('Cannot delete owner with articles');

        if (!owner)
            throw ('no owner found with id: ' + id);

        await owner.destroy();

    } catch (err) {
        console.error('Error in deleteOwner', err);
    }
}

module.exports = {
    addOwner: createOwner,
    getOwnerWithNameAddIfNotPresent,
    initService
};
