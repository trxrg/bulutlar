import { ipcMain, dialog } from 'electron';
import fs from 'fs/promises';
import path from 'path';
import hijriSafe from 'hijri-date/lib/safe.js';
import { sequelize } from '../sequelize/index.js';
import tagService from './TagService.js';
import ownerService from './OwnerService.js';
import categoryService from './CategoryService.js';
import commentService from './CommentService.js';
import imageService from './ImageService.js';
import annotationService from './AnnotationService.js';
import groupService from './GroupService.js';

function initService() {
    ipcMain.handle('article/create', async (event, article) => await createArticle(article));
    ipcMain.handle('article/updateMainText', async (event, id, newMainText) => await updateArticleMainText(id, newMainText));
    ipcMain.handle('article/updateExplanation', async (event, id, newExplanation) => await updateArticleExplanation(id, newExplanation));
    ipcMain.handle('article/updateComment', async (event, id, newComment) => await updateFirstCommentText(id, newComment));
    ipcMain.handle('article/updateOwner', async (event, id, newOwnerName) => await updateArticleOwner(id, newOwnerName));
    ipcMain.handle('article/updateCategory', async (event, id, newCategoryName) => await updateArticleCategory(id, newCategoryName));
    ipcMain.handle('article/updateTitle', async (event, id, newTitle) => await updateArticleTitle(id, newTitle));
    ipcMain.handle('article/updateDate', async (event, id, newDate) => await updateArticleDate(id, newDate));
    ipcMain.handle('article/updateDate2', async (event, id, newDate) => await updateArticleDate2(id, newDate));
    ipcMain.handle('article/addImage', async (event, id, image) => await addImageToArticle(id, image));
    ipcMain.handle('article/openDialogToAddImages', async (event, id) => await openDialogToAddImages(id));
    ipcMain.handle('article/addAnnotation', async (event, id, annotation) => await addAnnotationToArticle(id, annotation));
    ipcMain.handle('article/getAll', async (event, order) => await getAllArticles(order));
    ipcMain.handle('article/getById', async (event, id) => await getArticleById(id));
    ipcMain.handle('article/deleteById', async (event, id) => await deleteArticleById(id));
    ipcMain.handle('article/addRelatedArticle', async (event, id, relatedArticleId) => await addRelatedArticle(id, relatedArticleId));
    ipcMain.handle('article/removeRelatedArticle', async (event, id, relatedArticleId) => await removeRelatedArticle(id, relatedArticleId));
    ipcMain.handle('article/addTag', async (event, id, tagName) => await addTagToArticle(id, tagName));
    ipcMain.handle('article/removeTag', async (event, id, tagName) => await removeTagFromArticle(id, tagName));
    ipcMain.handle('article/addToGroup', async (event, id, groupName) => await addArticleToGroup(id, groupName));
    ipcMain.handle('article/removeFromGroup', async (event, id, groupId) => await removeArticleFromGroup(id, groupId));
    ipcMain.handle('article/setIsStarred', async (event, id, isStarred) => await setIsStarred(id, isStarred));
    ipcMain.handle('article/setIsDateUncertain', async (event, id, isDateUncertain) => await setIsDateUncertain(id, isDateUncertain));    
}

async function createArticle(article) { // Now transactional

    console.log('adding article with title: ' + article.title);

    const transaction = await sequelize.transaction();

    try {
        article.date2 = gregorianToHijri(article.date);
        article.number = calculateNumber(article.date);
        article.number2 = calculateNumber(article.date2);
        article.code = Math.random().toString(36).substring(2);

        const entity = await sequelize.models.article.create(article, { transaction });
        console.log('article added, id: ' + entity.id);

        if (article.owner && article.owner.name) {
            const owner = await ownerService.getOwnerWithNameAddIfNotPresent(article.owner.name, transaction);
            await entity.setOwner(owner, { transaction });
        }

        if (article.category) {
            const category = await categoryService.getCategoryWithNameAddIfNotPresent(article.category.name, transaction);
            await entity.setCategory(category, { transaction });
        }

        if (article.tags) {
            for (const tag of article.tags) {
                const tagEntity = await tagService.getTagWithNameAddIfNotPresent(tag.name, transaction);
                await entity.addTag(tagEntity, { transaction });
            }
        }

        if (article.comments) {
            for (const comment of article.comments) {
                const commentEntity = await commentService.createComment(comment, { transaction });
                await entity.addComment(commentEntity, { transaction });
            }
        }

        if (article.images) {
            for (const image of article.images) {
                const imageEntity = await imageService.createImage(image, transaction);
                await entity.addImage(imageEntity, { transaction });
            }
        }

        await transaction.commit();
        return await getArticleById(entity.dataValues.id);
    } catch (e) {
        await transaction.rollback();
        console.error('Error adding article:', e);
        throw e;
    }
}

async function createArticleProgrammatically(article) {
    console.log('adding article with title: ' + article.title);

    try {

        article.date = new Date();
        article.number = calculateNumber(article.date);
        article.code = Math.random().toString(36).substring(2);
        // article.category = {name: 'Art'};
        // article.comments = [{text: '<p><br></p>'}];

        const entity = await sequelize.models.article.create(article);

        console.log('article added, id: ' + entity.id);

        if (article.owner)
            await entity.setOwner(await ownerService.getOwnerWithNameAddIfNotPresent(article.owner.name));

        if (article.category)
            await entity.setCategory(await categoryService.getCategoryWithNameAddIfNotPresent(article.category.name));

        if (article.comments)
            for (const comment of article.comments)
                await entity.addComment(await commentService.createComment(comment));

    } catch (e) {
        console.error('Error adding article:', e);
        return { error: e };
    }
}

async function deleteArticleById(id) {
    try {
        const article = await sequelize.models.article.findByPk(id);

        if (!article)
            throw ('no article found with id: ' + id);

        await commentService.deleteCommentsByArticleId(id);
        await imageService.deleteImagesByArticleId(id);
        await annotationService.deleteAnnotationsByArticleId(id);

        // await sequelize.models.article_article_rel.destroy({
        //     where: {
        //         [Op.or]: [
        //             { articleid: id },
        //             { relatedarticleid: id }
        //         ]
        //     }
        // });

        await article.destroy();
    } catch (error) {
        console.error('Error deleting article:', error);
        throw error;
    }
}

async function updateArticleMainText(id, newMainText) {
    try {
        await sequelize.models.article.update(
            {
                text: newMainText.html,
                textJson: newMainText.json
            },
            { where: { id: id } }
        );

    } catch (error) {
        console.error('Error in updateArticleMainText', error);
        throw error;
    }
}

async function updateArticleExplanation(id, newExplanation) {
    try {
        await sequelize.models.article.update(
            {
                explanation: newExplanation.html,
                explanationJson: newExplanation.json
            },
            { where: { id: id } }
        );

    } catch (error) {
        console.error('Error in updateArticleMainText', error);
        throw error;
    }
}

async function updateFirstCommentText(id, newComment) {
    try {
        const article = await sequelize.models.article.findByPk(id);

        if (!article)
            throw ('no article found with id: ' + id);

        let comment = (await article.getComments({ limit: 1 }))[0];
        if (!comment) {
            comment = await commentService.createComment(newComment);
            await article.addComment(comment);
            return;
        }
        await comment.update({ text: newComment.html, textJson: newComment.json });

    } catch (error) {
        console.error('Error in updateFirstCommentText', error);
        throw error;
    }
}

async function updateArticleTitle(id, newTitle) {
    try {
        await sequelize.models.article.update(
            {
                title: newTitle
            },
            { where: { id: id } }
        );

    } catch (error) {
        console.error('Error in updateArticleTitle', error);
        throw error;
    }
}

async function updateArticleDate(id, newDate) {
    try {
        console.log('updating article date:', newDate);
        const article = await sequelize.models.article.findByPk(id);

        if (!article)
            throw ('no article found with id: ' + id);

        const newHDate = gregorianToHijri(newDate);
        await article.update({ date: newDate });
        await article.update({ number: calculateNumber(newDate) });
        await article.update({ date2: newHDate });
        await article.update({ number2: calculateNumber(newHDate) });
    } catch (error) {
        console.error('Error in updateArticleDate', error);
        throw error;
    }
}

async function updateArticleDate2(id, newDate) {
    try {
        console.log('updating article date2:', newDate);
        const article = await sequelize.models.article.findByPk(id);

        if (!article)
            throw ('no article found with id: ' + id);

        await article.update({ date2: newDate });
        await article.update({ number2: calculateNumber(newDate) });
    } catch (error) {
        console.error('Error in updateArticleDate', error);
        throw error;
    }
}

async function updateArticleOwner(id, newOwnerName) {
    try {
        const article = await sequelize.models.article.findByPk(id);
        if (!article)
            throw ('no article found with id: ' + id);
        if (!newOwnerName) {
            article.setOwner(null);
            return;
        }

        const owner = await ownerService.getOwnerWithNameAddIfNotPresent(newOwnerName);
        if (!owner)
            throw ('no owner found with name: ' + newOwnerName);

        article.setOwner(owner);

    } catch (error) {
        console.error('Error in updateArticleOwner', error);
        throw error;
    }
}

async function updateArticleCategory(id, newCategoryName) {
    try {
        const article = await sequelize.models.article.findByPk(id);
        const cat = await categoryService.getCategoryWithNameAddIfNotPresent(newCategoryName);
        article.setCategory(cat);

    } catch (error) {
        console.error('Error in updateArticleCategory', error);
        throw error;
    }
}

async function addImageToArticle(id, image) {
    try {
        const article = await sequelize.models.article.findByPk(id);

        if (!article)
            throw ('no article found with id: ' + id);

        const imageEntity = await imageService.createImage(image);

        await article.addImage(imageEntity);

        return imageEntity.dataValues;

    } catch (error) {
        console.error('Error in addImage', error);
        throw error;
    }
}

async function addAnnotationToArticle(id, annotation) {
    try {
        const article = await sequelize.models.article.findByPk(id);

        if (!article)
            throw ('no article found with id: ' + id);

        const annotationEntity = await annotationService.createAnnotation(annotation)
        await article.addAnnotation(annotationEntity);

        return annotationEntity.dataValues;

    } catch (error) {
        console.error('Error in addAnnotationToArticle', error);
        throw error;
    }
}

async function addRelatedArticle(id, relatedArticleId) {
    try {
        const article = await sequelize.models.article.findByPk(id);
        const relatedArticle = await sequelize.models.article.findByPk(relatedArticleId);

        if (!article || !relatedArticle)
            throw ('no article found with id: ' + id + ' or ' + relatedArticleId);

        if (!(await article.hasRelatedArticle(relatedArticle)))
            await article.addRelatedArticle(relatedArticle);

        return await getArticleById(id);

    } catch (error) {
        console.error('Error in addRelatedArticle', error);
        throw error;
    }
}

async function removeRelatedArticle(id, relatedArticleId) {
    try {
        const article = await sequelize.models.article.findByPk(id);
        const relatedArticle = await sequelize.models.article.findByPk(relatedArticleId);

        if (!article || !relatedArticle)
            throw ('no article found with id: ' + id + ' or ' + relatedArticleId);

        await article.removeRelatedArticle(relatedArticle);

        return await getArticleById(id);

    } catch (error) {
        console.error('Error in removeRelatedArticle', error);
        throw error;
    }
}

async function addTagToArticle(id, tagName) {
    try {
        const article = await sequelize.models.article.findByPk(id);

        if (!article)
            throw ('no article found with id: ' + id);

        const tag = await tagService.getTagWithNameAddIfNotPresent(tagName);

        if (! await article.hasTag(tagName))
            await article.addTag(tag);

        return await getArticleById(id);

    } catch (error) {
        console.error('Error in addTagToArticle', error);
        throw error;
    }
}

async function removeTagFromArticle(id, tagName) {
    try {
        const article = await sequelize.models.article.findByPk(id);

        if (!article)
            throw ('no article found with id: ' + id);

        const tag = await tagService.getTagWithName(tagName);
        if (!tag)
            throw ('no tag found with name: ' + tagName);

        await article.removeTag(tag);

        return await getArticleById(id);

    } catch (error) {
        console.error('Error in removeTagFromArticle', error);
        throw error;
    }
}

async function addArticleToGroup(articleId, groupName) {
    try {
        const article = await sequelize.models.article.findByPk(articleId);
        const group = await groupService.getGroupWithNameAddIfNotPresent(groupName);

        if (!article || !group)
            throw ('no article found with id: ' + articleId + ' or ' + groupName);

        await article.addGroup(group);

        return await getArticleById(articleId);

    } catch (error) {
        console.error('Error in addArticleToGroup', error);
        throw error;
    }
}

async function removeArticleFromGroup(articleId, groupId) {
    try {
        const article = await sequelize.models.article.findByPk(articleId);
        const group = await sequelize.models.group.findByPk(groupId);

        if (!article || !group)
            throw ('no article found with id: ' + articleId + ' or ' + groupId);

        await article.removeGroup(group);

        return await getArticleById(articleId);

    } catch (error) {
        console.error('Error in removeArticleFromGroup', error);
        throw error;
    }
}

async function getArticleEntity(id) {
    const entity = await sequelize.models.article.findByPk(id);

    return entity;
}

async function getArticleById(id) {
    const entity = await sequelize.models.article.findByPk(id,
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

async function getAllArticles(order = { field: 'date', direction: 'ASC' }) {
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
        ],
        order: [[order.field, order.direction]]
    });

    return entities.map(entity => articleEntity2Json(entity));
}

async function setIsStarred(id, isStarred) {
    try {
        const article = await sequelize.models.article.findByPk(id);

        if (!article)
            throw ('no article found with id: ' + id);

        await article.update({ isStarred });
    } catch (error) {
        console.error('Error in setIsStarred', error);
        throw error;
    }
}

async function setIsDateUncertain(id, isDateUncertain) {
    try {
        const article = await sequelize.models.article.findByPk(id);

        if (!article)
            throw ('no article found with id: ' + id);

        await article.update({ isDateUncertain: isDateUncertain });
    } catch (error) {
        console.error('Error in setIsDateUncertain', error);
        throw error;
    }
}

async function openDialogToAddImages(articleId) {

    try {
        const result = await dialog.showOpenDialog({
            properties: ['openFile', 'multiSelections'],
            filters: [{ name: 'Images', extensions: ['jpg', 'png', 'gif', 'jpeg'] }]
        })

        if (!result.canceled) {
            const images = [];
            for (const filePath of result.filePaths) {
                const image = {
                    name: path.basename(filePath),
                    type: path.extname(filePath).slice(1),
                    path: filePath,
                    size: (await fs.stat(filePath)).size,
                };
                console.log(`Adding image to article ${articleId}:`, image);
                images.push(await addImageToArticle(articleId, image));
            }
            return images;
        }

    } catch (e) {
        console.error('Error in openDialogToAddImagesToArticle', e);
    }
}

function articleEntity2Json(entity) {
    if (entity.dataValues.tags)
        entity.dataValues.tags = entity.dataValues.tags.map(tag => ({ id: tag.id }));
    if (entity.dataValues.groups)
        entity.dataValues.groups = entity.dataValues.groups.map(group => ({ id: group.id }));
    if (entity.dataValues.groups)
        entity.dataValues.groups = entity.dataValues.groups.map(group => ({ id: group.id }));
    if (entity.dataValues.images)
        entity.dataValues.images = entity.dataValues.images.map(image => imageEntity2Json(image));
    if (entity.dataValues.annotations)
        entity.dataValues.annotations = entity.dataValues.annotations.map(annotation => ({ id: annotation.id }));
    if (entity.dataValues.comments)
        entity.dataValues.comments = entity.dataValues.comments.map(comment => commentEntity2Json(comment));
    if (entity.dataValues.relatedArticles)
        entity.dataValues.relatedArticles = entity.dataValues.relatedArticles.map(
            relatedArticle => ({ id: relatedArticle.id, title: relatedArticle.title }));
    return entity.dataValues;
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

function calculateNumber(datestr) {
    const date = new Date(datestr);

    let result = (date.getFullYear() + date.getMonth() + 1 + date.getDate()) % 9;
    if (result == 0)
        result = 9;

    return result;
}

function gregorianToHijri(gDate) {
    let hijri = hijriSafe.toHijri(new Date(gDate));
    hijri = hijri.subtractDay(); // the library returns one day after the actual date, idk why
    const hDate = new Date(Date.UTC(hijri.year, hijri.month - 1, hijri.date));
    return hDate;
}

const ArticleService = {
    initService,
    getArticleEntity,
    createArticleProgrammatically,
    getAllArticles, //  TODO: remove
    updateArticleDate, // TODO: remove
};

export default ArticleService;