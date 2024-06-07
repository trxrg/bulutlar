const { ipcMain } = require('electron')
const { Op } = require("sequelize");
const { sequelize } = require("../sequelize");
const tagService = require('./TagService');
const ownerService = require('./OwnerService');

function initService() {
    ipcMain.handle('addArticle', (event, article) => addArticle(article));
    ipcMain.handle('updateArticle', (event, articleId, article) => updateArticle(articleId, article));
    ipcMain.handle('getArticleWithId', (event, articleId) => getArticleWithId(articleId));
    ipcMain.handle('getArticleWithTitleLike', (event, titleLike) => getArticleWithTitleLike(titleLike));
    ipcMain.handle('getAllArticlesOfOwnerName', (event, ownerName) => getAllArticlesOfOwnerName(ownerName));
    ipcMain.handle('getAllArticles', (event) => getAllArticles());
}

async function addArticle(article) {
    
    const entity = await sequelize.models.article.create(article);

    if (article.owner)
        await entity.setOwner(await ownerService.getOwnerWithNameAddIfNotPresent(article.owner));

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
            {model: sequelize.models.owner},
            {model: sequelize.models.tag}
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
            {model: sequelize.models.owner},
            {model: sequelize.models.tag}
        ]
    });
    return entities.map(entity => articleEntity2Json(entity));
}

async function getAllArticlesOfOwnerName(ownerName) {
    const entities = await sequelize.models.article.findAll({
        where: {
            owner: {name: ownerName}
        },
        include: [
            {model: sequelize.models.owner},
            {model: sequelize.models.tag}
        ]
    });
    return entities.map(entity => articleEntity2Json(entity));
}

async function getAllArticles() {
    let entities = await sequelize.models.article.findAll({include: [
          {model: sequelize.models.owner},
          {model: sequelize.models.tag}
      ]});
            
    return entities.map(entity => articleEntity2Json(entity));
}

function articleEntity2Json(entity) {
    if (entity.dataValues.owner)
        entity.dataValues.owner = ownerEntity2Json(entity.dataValues.owner);
    if (entity.dataValues.tags)
        entity.dataValues.tags = entity.dataValues.tags.map(tag => tagEntity2Json(tag));
    return entity.dataValues;
}

function ownerEntity2Json(entity) {
    return entity.dataValues;
}

function tagEntity2Json(entity) {
    return {
        id: entity.dataValues.id,
        name: entity.dataValues.name
    };
}

module.exports = {
    initService
};