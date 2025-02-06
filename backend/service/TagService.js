import { ipcMain } from 'electron';
import { Op } from 'sequelize';
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
    const result = await sequelize.models.tag.findAll({
        attributes: {
            include: [
                [sequelize.fn('COUNT', sequelize.col('articles.id')), 'articleCount'],
            ]
        },
        include: [
            {
                model: sequelize.models.article,
                as: 'articles',
                attributes: [], // We don't need any attributes from Article
            },
        ],
        group: ['Tag.id'], // Group by Category ID
    });
    return result.map(item => item.dataValues);
}



async function getAllCategories() {
    const result = await sequelize.models.category.findAll({
        attributes: {
            include: [
                [sequelize.fn('COUNT', sequelize.col('articles.id')), 'articleCount'],
            ]
        },
        include: [
            {
                model: sequelize.models.article,
                as: 'articles',
                attributes: [], // We don't need any attributes from Article
            },
        ],
        group: ['Category.id'], // Group by Category ID
    });
    return result.map(item => item.dataValues);
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