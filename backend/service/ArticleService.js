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
    ipcMain.handle('article/addImage', (event, articleId, image) => addImageToArticle(articleId, image));
    ipcMain.handle('article/addAnnotation', (event, articleId, annotation) => addAnnotationToArticle(articleId, annotation));
    ipcMain.handle('article/create', (event, article) => createArticle(article));
    ipcMain.handle('article/getAll', getAllArticles);
    ipcMain.handle('article/getById', (event, articleId) => getArticleById(articleId));
    ipcMain.handle('article/deleteById', (event, articleId) => deleteArticleById(articleId));
}

async function createArticle(article) { // TODO must be transactional

    console.log('adding article with title: ' + article.title);

    try {

        article.number = calculateNumber(article.date);
        article.code = Math.random().toString(36).substring(2);
        const entity = await sequelize.models.article.create(article);

        console.log('article added, id: ' + entity.id);

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

        if (article.images)
            for (const image of article.images)
                await entity.addImage(await imageService.createImage(image));

        return await getArticleById(entity.dataValues.id);
    } catch (e) {
        console.error('Error adding article:', e);
        return { error: e };
    }
}

async function deleteArticleById(articleId) {
    try {
        const article = await sequelize.models.article.findByPk(articleId);

        if (!article)
            throw ('no article found with id: ' + articleId);

        await article.destroy();
    } catch (error) {
        console.error('Error deleting article:', error);
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

async function addImageToArticle(articleId, image) {
    try {
        const article = await sequelize.models.article.findByPk(articleId);

        if (!article)
            throw ('no article found with id: ' + articleId);

        await article.addImage(await imageService.createImage(image));

        return await getArticleById(articleId);

    } catch (error) {
        console.error('Error in addImage', error);
    }
}

async function addAnnotationToArticle(articleId, annotation) {
    try {
        const article = await sequelize.models.article.findByPk(articleId);

        if (!article)
            throw ('no article found with id: ' + articleId);

        await article.addAnnotation(await annotationService.createAnnotation(annotation));

        return await getArticleById(articleId);

    } catch (error) {
        console.error('Error in addAnnotationToArticle', error);
    }
}

async function getArticleEntity(articleId) {
    const entity = await sequelize.models.article.findByPk(articleId);

    return entity;
}

async function getArticleById(articleId) {
    const entity = await sequelize.models.article.findByPk(articleId,
        {
            include: [
                { model: sequelize.models.comment },
                { model: sequelize.models.tag },
                { model: sequelize.models.image },
                { model: sequelize.models.annotation },
                { model: sequelize.models.group },
                {
                    model: sequelize.models.article,
                    as: 'relatedArticles',
                    attributes: ['id', 'title']
                },
            ]
        });
    if (!entity)
        return { error: 'Article not found' };
    return articleEntity2Json(entity);
}

async function getAllArticles() {
    let entities = await sequelize.models.article.findAll({
        include: [
            { model: sequelize.models.comment },
            { model: sequelize.models.tag },
            { model: sequelize.models.image },
            { model: sequelize.models.annotation },
            { model: sequelize.models.group },
            {
                model: sequelize.models.article,
                as: 'relatedArticles',
                attributes: ['id', 'title']
            },
        ]
    });

    return entities.map(entity => articleEntity2Json(entity));
}

function articleEntity2Json(entity) {
    if (entity.dataValues.tags)
        entity.dataValues.tags = entity.dataValues.tags.map(tag => ({ id: tag.id }));
    if (entity.dataValues.images)
        entity.dataValues.images = entity.dataValues.images.map(image => ({ id: image.id }));
    if (entity.dataValues.annotations)
        entity.dataValues.annotations = entity.dataValues.annotations.map(annotation => ({ id: annotation.id }));
    if (entity.dataValues.comments)
        entity.dataValues.comments = entity.dataValues.comments.map(comment => ({ id: comment.id }));
    if (entity.dataValues.relatedArticles)
        entity.dataValues.relatedArticles = entity.dataValues.relatedArticles.map(
            relatedArticle => ({ id: relatedArticle.id, title: relatedArticle.title }));
    return entity.dataValues;
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