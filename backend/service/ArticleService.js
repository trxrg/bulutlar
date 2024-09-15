const { ipcMain } = require('electron')
const { Op } = require("sequelize");
const { sequelize } = require("../sequelize");
const tagService = require('./TagService');
const ownerService = require('./OwnerService');
const categoryService = require('./CategoryService');
const commentService = require('./CommentService');
const imageService = require('./ImageService');

function initService() {
    ipcMain.handle('article/updateMainText', (event, articleId, newMainText) => updateArticleMainText(articleId, newMainText));
    ipcMain.handle('article/updateExplanation', (event, articleId, newExplanation) => updateArticleExplanation(articleId, newExplanation));
    ipcMain.handle('article/addImage', (event, articleId, image) => addImage(articleId, image));


    ipcMain.handle('addArticle', (event, article) => addArticle(article));
    ipcMain.handle('deleteArticle', (event, articleId) => deleteArticle(articleId));
    ipcMain.handle('updateArticle', (event, articleId, article) => updateArticle(articleId, article));
    ipcMain.handle('getArticleWithId', (event, articleId) => getArticleWithId(articleId));
    ipcMain.handle('getAllArticles', (event) => getAllArticles());
}

async function addArticle(article) {

    console.log('adding article with id: ' + article.id);

    article.number = calculateNumber(article.date);
    article.code = Math.random().toString(36).substring(2);
    const entity = await sequelize.models.article.create(article);

    if (article.owner)
        await entity.setOwner(await ownerService.getOwnerWithNameAddIfNotPresent(article.owner.name));

    if (article.category)
        await entity.setCategory(await categoryService.getCategoryWithNameAddIfNotPresent(article.category.name));

    if (article.tags)
        for (const tag of article.tags)
            await entity.addTag(await tagService.getTagWithNameAddIfNotPresent(tag.name));

    if (article.comments)
        for (const comment of article.comments)
            await entity.addComment(await commentService.addComment(comment.text));

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
            await entity.setOwner(await ownerService.getOwnerWithNameAddIfNotPresent(newArticle.owner.name));

        if (newArticle.category)
            await entity.setCategory(await categoryService.getCategoryWithNameAddIfNotPresent(newArticle.category.name));

        if (newArticle.tags)
            for (const tag of newArticle.tags)
                await entity.addTag(await tagService.getTagWithNameAddIfNotPresent(tag.name));

        if (newArticle.comments)
            for (const comment of newArticle.comments)
                await entity.addComment(await commentService.addComment(comment.text));

        return await getArticleWithId(entity.dataValues.id);
    } catch (error) {
        console.error('Error updating article:', error);
    }
}

async function updateArticleMainText(articleId, newMainText) {
    try {
        await sequelize.models.article.update(
            {
                text: newMainText.html,
                textJson: newMainText.json
            },
            { where: { id: articleId } }
        );

    } catch (error) {
        console.error('Error in updateArticleMainText', error);
    }
}

async function updateArticleExplanation(articleId, newExplanation) {
    try {
        await sequelize.models.article.update(
            {
                explanation: newExplanation.html,
                explanationJson: newExplanation.json
            },
            { where: { id: articleId } }
        );

    } catch (error) {
        console.error('Error in updateArticleMainText', error);
    }
}

async function addImage(articleId, image) {
    try {
        const article = await sequelize.models.article.findByPk(articleId);

        if (!article)
            throw ('no article found with id: ' + articleId);

        await article.addImage(await imageService.createImage(image));

        return await getArticleWithId(articleId);

    } catch (error) {
        console.error('Error in addImage', error);
    }
}

async function getArticleEntity(articleId) {
    const entity = await sequelize.models.article.findByPk(articleId);

    return entity;
}

async function getArticleWithId(articleId) {
    const entity = await sequelize.models.article.findByPk(articleId,
        {
            include: [
                { model: sequelize.models.owner },
                { model: sequelize.models.category },
                { model: sequelize.models.comment },
                { model: sequelize.models.tag },
                { model: sequelize.models.image },
                { model: sequelize.models.annotation },
                { model: sequelize.models.group },
            ]
        });
    return articleEntity2Json(entity);
}

async function getAllArticles() {
    let entities = await sequelize.models.article.findAll({
        include: [
            { model: sequelize.models.owner },
            { model: sequelize.models.category },
            { model: sequelize.models.comment },
            { model: sequelize.models.tag },
            { model: sequelize.models.image },
            { model: sequelize.models.annotation },
            { model: sequelize.models.group },
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
    if (entity.dataValues.images)
        entity.dataValues.images = entity.dataValues.images.map(image => imageEntity2Json(image));
    if (entity.dataValues.annotations)
        entity.dataValues.annotations = entity.dataValues.annotations.map(annotation => annotationEntity2Json(annotation));
    if (entity.dataValues.comments)
        entity.dataValues.comments = entity.dataValues.comments.map(comment => commentEntity2Json(comment));
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
        text: entity.dataValues.text,
        textJson: entity.dataValues.textJson
    };
}

function imageEntity2Json(entity) {
    return {
        id: entity.dataValues.id,
        name: entity.dataValues.name,
        type: entity.dataValues.type,
        path: entity.dataValues.path,
        size: entity.dataValues.size,
        description: entity.dataValues.description,
    };
}

function annotationEntity2Json(entity) {
    return {
        id: entity.dataValues.id,
        quote: entity.dataValues.quote,
        note: entity.dataValues.note,
        createdAt: entity.dataValues.createdAt,
        updatedAt: entity.dataValues.updatedAt
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
    initService,
    getArticleEntity
};