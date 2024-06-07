const { ipcMain } = require('electron')
const { Op } = require("sequelize");
const { sequelize } = require("../sequelize");

function initService() {
    ipcMain.handle('addTag', (event, tagName) => addTag(tagName));
    ipcMain.handle('updateTagName', (event, tagName, newName) => updateTagName(tagName, newName));
    ipcMain.handle('getTagWithName', (event, tagName) => getTagWithName(tagName));
    ipcMain.handle('getTagWithNameLike', (event, nameLike) => getTagWithNameLike(nameLike));
    ipcMain.handle('getTagWithId', (event, id) => getTagWithId(id));
    ipcMain.handle('getAllTags', getAllTags);
    ipcMain.handle('deleteTagWithName', deleteTagWithName);
}

async function addTag(tagName) {
    const result = await sequelize.models.tag.create({ name: tagName });
    return result.dataValues;
}

async function addTagIfNotPresent(tagName) {
    if (!getTagWithName(tagName)) {
        const result = await sequelize.models.tag.create({ name: tagName });
        return result.dataValues;
    }
}

async function updateTagName(tagName, newName) {
    const tag = await sequelize.models.tag.findOne({ where: { name: tagName } });
    const result = await tag.update({ name: newName });
    return result.dataValues;
}

async function getTagWithNameAddIfNotPresent(tagName) {
    let result = await getTagWithName(tagName); 
    if (!result)
        result = await sequelize.models.tag.create({ name: tagName });

    return result;
}

async function getTagWithName(tagName) {
    return await sequelize.models.tag.findOne({ where: { name: tagName } });
}

async function getTagDataWithName(tagName) {
    const result = await sequelize.models.tag.findOne({ where: { name: tagName } });
    return result.dataValues; 
}

async function getTagWithId(id) {
    const result = await sequelize.models.tag.findByPk(id);
    return result.dataValues;
}

async function getTagWithNameLike(nameLike) {
    const result = await sequelize.models.tag.findAll({
        where: {
            name: {
                [Op.like]: '%' + nameLike + '%'
            }
        }
    });
    return result.map(item => item.dataValues);
}

async function getAllTags() {
    const result = await sequelize.models.tag.findAll();
    return result.map(item => item.dataValues);
}

async function deleteTagWithName(tagName) {
    await sequelize.models.tag.destroy({ where: { name: tagName } });
    return getAllTags();
}

module.exports = {
    addTag,
    addTagIfNotPresent,
    getTagWithName,
    getTagWithNameAddIfNotPresent,
    initService
};