import { ipcMain } from 'electron';
import { sequelize } from '../sequelize/index.js';

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

async function updateTagName(id, newName) {
    try {
        const tag = await sequelize.models.tag.findByPk(id);
        const result = await tag.update({ name: newName });
        return result.dataValues;
    } catch (error) {
        console.error('error in updateTagName', error);
        return { error: error.message };
    }
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

async function getTagWithId(id) {
    const result = await sequelize.models.tag.findByPk(id);
    if (!result)
        return { error: 'Tag not found' };
    result.dataValues.articleCount = await result.countArticles();
    return result.dataValues;
}

async function getAllTags() {
    const result = await sequelize.models.tag.findAll();
    if (!result)
        return { error: 'No tags found' };

    return await Promise.all(result.map(async item => {
        const data = item.dataValues;
        data.articleCount = await item.countArticles();
        return data;
    }));
}

async function deleteTagById(id) {
    const tag = await sequelize.models.tag.findByPk(id);
    if (tag)
        await tag.destroy();
    else
        console.error('tag not found with id', id);
    return getAllTags();
}

const TagService = {
    addTag: createTag ,
    addTagIfNotPresent,
    getTagWithName,
    getTagWithNameAddIfNotPresent,
    initService
};

export default TagService;