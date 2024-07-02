const { ipcMain } = require('electron')
const { Op } = require("sequelize");
const { sequelize } = require("../sequelize");
const tagService = require('./TagService');
const ownerService = require('./OwnerService');
const categoryService = require('./CategoryService');
const commentService = require('./CommentService');

function initService() {
    ipcMain.handle('addArticle', (event, article) => addArticle(article));
    ipcMain.handle('deleteArticle', (event, articleId) => deleteArticle(articleId));
    ipcMain.handle('updateArticle', (event, articleId, article) => updateArticle(articleId, article));
    ipcMain.handle('getArticleWithId', (event, articleId) => getArticleWithId(articleId));
    ipcMain.handle('getArticleWithTitleLike', (event, titleLike) => getArticleWithTitleLike(titleLike));
    ipcMain.handle('getAllArticlesOfOwnerName', (event, ownerName) => getAllArticlesOfOwnerName(ownerName));
    ipcMain.handle('getAllArticles', (event) => getAllArticles());
}

async function addArticle(article) {

    article.number = calculateNumber(article.date);
    article.code = Math.random().toString(36).substring(2);
    const entity = await sequelize.models.article.create(article);    

    if (article.owner)
        await entity.setOwner(await ownerService.getOwnerWithNameAddIfNotPresent(article.owner));

    if (article.category)
        await entity.setCategory(await categoryService.getCategoryWithNameAddIfNotPresent(article.category));

    if (article.tags)
        for (const tag of article.tags)
            await entity.addTag(await tagService.getTagWithNameAddIfNotPresent(tag.name));

    if (article.comments)
        for (const comment of article.comments)
            await entity.addComment(await commentService.addComment(comment));

    return await getArticleWithId(entity.dataValues.id);
}

async function deleteArticle(articleId) {
    try {
        const article = await sequelize.models.article.findByPk(articleId);

        if (!article)
            throw ('no article found with id: ' + articleId);

        await article.destroy();
    } catch (error) {
        console.error('Error deleting article:', error);
    }
}

async function updateArticle(articleId, newArticle) {
    try {
        const article = await sequelize.models.article.findByPk(articleId);
        let entity;

        if (!article)
            throw ('no article found with id: ' + articleId);

        entity = await article.update(newArticle);

        if (!entity)
            throw ('entity is null');

        await entity.setComments([]);
        await entity.setTags([]);

        if (newArticle.owner)
            await entity.setOwner(await ownerService.getOwnerWithNameAddIfNotPresent(newArticle.owner));

        if (newArticle.category)
            await entity.setCategory(await categoryService.getCategoryWithNameAddIfNotPresent(newArticle.category));

        if (newArticle.tags)
            for (const tag of newArticle.tags)
                await entity.addTag(await tagService.getTagWithNameAddIfNotPresent(tag.name));

        if (newArticle.comments)
            for (const comment of newArticle.comments)
                await entity.addComment(await commentService.addComment(comment));

        return await getArticleWithId(entity.dataValues.id);
    } catch (error) {
        console.error('Error updating article:', error);
    }
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
    if (entity.dataValues.comments)
        entity.dataValues.comments = entity.dataValues.comments.map(comment => commentEntity2Json(comment));
    console.log("ENTITY:");
    console.log(entity.dataValues);
    return entity.dataValues;
}

function entity2Json(entity) {
    return {
        id: entity.dataValues.id,
        name: entity.dataValues.name
    };
}

function commentEntity2Json(entity) {
    return {
        id: entity.dataValues.id,
        text: entity.dataValues.text
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