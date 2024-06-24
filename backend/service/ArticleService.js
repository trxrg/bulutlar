const { ipcMain } = require('electron')
const { Op } = require("sequelize");
const { sequelize } = require("../sequelize");
const tagService = require('./TagService');
const ownerService = require('./OwnerService');
const categoryService = require('./CategoryService');

function initService() {
    ipcMain.handle('addArticle', (event, article) => addArticle(article));
    ipcMain.handle('updateArticle', (event, articleId, article) => updateArticle(articleId, article));
    ipcMain.handle('getArticleWithId', (event, articleId) => getArticleWithId(articleId));
    ipcMain.handle('getArticleWithTitleLike', (event, titleLike) => getArticleWithTitleLike(titleLike));
    ipcMain.handle('getAllArticlesOfOwnerName', (event, ownerName) => getAllArticlesOfOwnerName(ownerName));
    ipcMain.handle('getAllArticles', (event) => getAllArticles());
}

async function addArticle(article) {

    article.number = calculateNumber(article.date);
    const entity = await sequelize.models.article.create(article);

    if (article.owner)
        await entity.setOwner(await ownerService.getOwnerWithNameAddIfNotPresent(article.owner));

    if (article.category)
        await entity.setCategory(await categoryService.getCategoryWithNameAddIfNotPresent(article.category));

    if (article.tags)
        for (const tagName of article.tags)
            await entity.addTag(await tagService.getTagWithNameAddIfNotPresent(tagName));

    return await getArticleWithId(entity.dataValues.id);
}

async function updateArticle(articleId, newArticle) {
    const article = await sequelize.models.article.findByPk(articleId);
    const entity = await article.update(newArticle);
    return getArticleWithId(entity.dataValues.id);
}

async function getArticleWithId(articleId) {
    const entity = await sequelize.models.article.findByPk(articleId,
        {
            include: [
                { model: sequelize.models.owner },
                { model: sequelize.models.category },
                { model: sequelize.models.comment },
                { model: sequelize.models.tag }
            ]
        });
    console.log(entity);
    return articleEntity2Json(entity);
}

async function getArticleWithTitleLike(titleLike) {
    const entities = await sequelize.models.article.findAll({
        where: {
            title: {
                [Op.like]: '%' + titleLike + '%'
            }
        },
        include: [
            { model: sequelize.models.owner },
            { model: sequelize.models.category },
            { model: sequelize.models.comment },
            { model: sequelize.models.tag }
        ]
    });
    return entities.map(entity => articleEntity2Json(entity));
}

async function getAllArticlesOfOwnerName(ownerName) {
    const entities = await sequelize.models.article.findAll({
        where: {
            owner: { name: ownerName }
        },
        include: [
            { model: sequelize.models.owner },
            { model: sequelize.models.category },
            { model: sequelize.models.comment },
            { model: sequelize.models.tag }
        ]
    });
    return entities.map(entity => articleEntity2Json(entity));
}

async function getAllArticles() {
    let entities = await sequelize.models.article.findAll({
        include: [
            { model: sequelize.models.owner },
            { model: sequelize.models.category },
            { model: sequelize.models.comment },
            { model: sequelize.models.tag }
        ]
    });

    return entities.map(entity => articleEntity2Json(entity));
}

function articleEntity2Json(entity) {
    if (entity.dataValues.owner)
        entity.dataValues.owner = entity2Json(entity.dataValues.owner);
    if (entity.dataValues.category)
        entity.dataValues.category = entity2Json(entity.dataValues.category);
    if (entity.dataValues.tags)
        entity.dataValues.tags = entity.dataValues.tags.map(tag => entity2Json(tag));
    return entity.dataValues;
}

function entity2Json(entity) {
    return {
        id: entity.dataValues.id,
        name: entity.dataValues.name
    };
}

function calculateNumber(datestr) {
    const date = new Date(datestr);

    let result = (date.getFullYear() + date.getMonth() + 1 + date.getDate()) % 9;
    if (result == 0)
        result = 9;

    return result;
}

module.exports = {
    initService
};