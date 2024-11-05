const { ipcMain } = require('electron')
const { Op } = require("sequelize");
const { sequelize } = require("../sequelize");

function initService() {
    ipcMain.handle('tag/create', (event, tag) => createTag(tag));
    ipcMain.handle('tag/updateName', (event, id, newName) => updateTagName(id, newName));
    ipcMain.handle('tag/getAll', getAllTags);
    ipcMain.handle('tag/getById', (event, id) => getTagWithId(id));
    ipcMain.handle('tag/deleteById', (event, id) => deleteTagById(id));
}

async function createTag(tag) {
    const result = await sequelize.models.tag.create({ name: tag.name });
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

async function getTagWithNameAddIfNotPresent(tagName, transaction = null) {
    let result = await getTagWithName(tagName, transaction); 
    if (!result)
        result = await sequelize.models.tag.create({ name: tagName }, { transaction });

    return result;
}

async function getTagWithName(tagName, transaction = null) {
    return await sequelize.models.tag.findOne({ where: { name: tagName }, transaction });
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

async function deleteTagById(tagName) {
    await sequelize.models.tag.destroy({ where: { name: tagName } });
    return getAllTags();
}

module.exports = {
    addTag: createTag,
    addTagIfNotPresent,
    getTagWithName,
    getTagWithNameAddIfNotPresent,
    initService
};