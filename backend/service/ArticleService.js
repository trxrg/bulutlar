import { ipcMain, dialog } from 'electron';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import hijriSafe from 'hijri-date/lib/safe.js';
import { sequelize } from '../sequelize/index.js';
import tagService from './TagService.js';
import ownerService from './OwnerService.js';
import categoryService from './CategoryService.js';
import commentService from './CommentService.js';
import imageService from './ImageService.js';
import audioService from './AudioService.js';
import videoService from './VideoService.js';
import annotationService from './AnnotationService.js';
import groupService from './GroupService.js';
import { config } from '../config.js';
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let imagesFolderPath;

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
    ipcMain.handle('article/addAudio', async (event, id, audio) => await addAudioToArticle(id, audio));
    ipcMain.handle('article/openDialogToAddAudios', async (event, id) => await openDialogToAddAudios(id));
    ipcMain.handle('article/addVideo', async (event, id, video) => await addVideoToArticle(id, video));
    ipcMain.handle('article/openDialogToAddVideos', async (event, id) => await openDialogToAddVideos(id));
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
    ipcMain.handle('article/setOrdering', async (event, id, ordering) => await setOrdering(id, ordering));
    ipcMain.handle('article/updateRelatedArticleOrdering', async (event, articleId, relatedArticleId, ordering) => await updateRelatedArticleOrdering(articleId, relatedArticleId, ordering));
    ipcMain.handle('article/updateRelatedArticleOrderings', async (event, articleId, orderings) => await updateRelatedArticleOrderings(articleId, orderings));    
    
    // Initialize folder paths
    imagesFolderPath = config.imagesFolderPath;
    
    console.info('ArticleService initialized');
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

        if (article.audios) {
            for (const audio of article.audios) {
                const audioEntity = await audioService.createAudio(audio, transaction);
                await entity.addAudio(audioEntity, { transaction });
            }
        }

        if (article.videos) {
            for (const video of article.videos) {
                const videoEntity = await videoService.createVideo(video, transaction);
                await entity.addVideo(videoEntity, { transaction });
            }
        }

        await transaction.commit();
        
        // Calculate and store read time for the new article
        await calculateAndUpdateReadTime(entity.dataValues.id);
        
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

        // Calculate and store read time for the new article
        await calculateAndUpdateReadTime(entity.id);

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
        await audioService.deleteAudiosByArticleId(id);
        await videoService.deleteVideosByArticleId(id);
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

        // Calculate and update read time after content change
        await calculateAndUpdateReadTime(id);

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

        // Calculate and update read time after content change
        // await calculateAndUpdateReadTime(id);

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
        } else {
            await comment.update({ text: newComment.html, textJson: newComment.json });
        }

        // Calculate and update read time after content change
        // await calculateAndUpdateReadTime(id);

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

async function addAudioToArticle(id, audio) {
    try {
        const article = await sequelize.models.article.findByPk(id);

        if (!article)
            throw ('no article found with id: ' + id);

        const audioEntity = await audioService.createAudio(audio);

        await article.addAudio(audioEntity);

        return audioEntity.dataValues;

    } catch (error) {
        console.error('Error in addAudio', error);
        throw error;
    }
}

async function addVideoToArticle(id, video) {
    try {
        const article = await sequelize.models.article.findByPk(id);

        if (!article)
            throw ('no article found with id: ' + id);

        const videoEntity = await videoService.createVideo(video);

        await article.addVideo(videoEntity);

        return videoEntity.dataValues;

    } catch (error) {
        console.error('Error in addVideo', error);
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
    
    // Ensure read time is calculated for this article
    const updatedEntity = await ensureReadTimeCalculated(entity);
    return articleEntity2Json(updatedEntity || entity);
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

    // Ensure read time is calculated for each article
    // remove in further releases - too expensive
    const updatedEntities = await Promise.all(
        entities.map(async entity => {
            return articleEntity2Json(await ensureReadTimeCalculated(entity));
        })
    );
    return updatedEntities;
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

async function setOrdering(id, ordering) {
    try {
        const article = await sequelize.models.article.findByPk(id);

        if (!article)
            throw ('no article found with id: ' + id);

        await article.update({ ordering: ordering });
    } catch (error) {
        console.error('Error in setIsDateUncertain', error);
        throw error;
    }
}

async function updateRelatedArticleOrdering(articleId, relatedArticleId, ordering) {
    try {
        const ArticleArticleRel = sequelize.models.article_article_rel;
        
        await ArticleArticleRel.update(
            { relatedArticleOrdering: ordering },
            { 
                where: { 
                    articleId: articleId, 
                    relatedArticleId: relatedArticleId 
                } 
            }
        );
    } catch (error) {
        console.error('Error updating related article ordering', error);
        throw error;
    }
}

async function updateRelatedArticleOrderings(articleId, orderings) {
    try {
        const ArticleArticleRel = sequelize.models.article_article_rel;
        
        // Update multiple related article orderings in a transaction
        const transaction = await sequelize.transaction();
        
        try {
            for (const { relatedArticleId, ordering } of orderings) {
                await ArticleArticleRel.update(
                    { relatedArticleOrdering: ordering },
                    { 
                        where: { 
                            articleId: articleId, 
                            relatedArticleId: relatedArticleId 
                        },
                        transaction
                    }
                );
            }
            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    } catch (error) {
        console.error('Error updating related article orderings', error);
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

async function openDialogToAddAudios(articleId) {

    try {
        const result = await dialog.showOpenDialog({
            properties: ['openFile', 'multiSelections'],
            filters: [{ name: 'Audio', extensions: ['mp3', 'wav', 'ogg', 'aac', 'm4a', 'flac'] }]
        })

        if (!result.canceled) {
            const audios = [];
            for (const filePath of result.filePaths) {
                const audio = {
                    name: path.basename(filePath),
                    type: path.extname(filePath).slice(1),
                    path: filePath,
                    size: (await fs.stat(filePath)).size,
                };
                console.log(`Adding audio to article ${articleId}:`, audio);
                audios.push(await addAudioToArticle(articleId, audio));
            }
            return audios;
        }

    } catch (e) {
        console.error('Error in openDialogToAddAudiosToArticle', e);
    }
}

async function openDialogToAddVideos(articleId) {

    try {
        const result = await dialog.showOpenDialog({
            properties: ['openFile', 'multiSelections'],
            filters: [{ name: 'Video', extensions: ['mp4', 'webm', 'ogg', 'avi', 'mov', 'wmv', 'flv', 'mkv'] }]
        })

        if (!result.canceled) {
            const videos = [];
            for (const filePath of result.filePaths) {
                const video = {
                    name: path.basename(filePath),
                    type: path.extname(filePath).slice(1),
                    path: filePath,
                    size: (await fs.stat(filePath)).size,
                };
                console.log(`Adding video to article ${articleId}:`, video);
                videos.push(await addVideoToArticle(articleId, video));
            }
            return videos;
        }

    } catch (e) {
        console.error('Error in openDialogToAddVideosToArticle', e);
    }
}

function articleEntity2Json(entity) {
    if (entity.dataValues.tags)
        entity.dataValues.tags = entity.dataValues.tags.map(tag => ({ id: tag.id }));
    if (entity.dataValues.groups) {
        // Sort groups by ordering field, then by name as fallback
        entity.dataValues.groups.sort((a, b) => {
            if (a.ordering !== null && b.ordering !== null) {
                return a.ordering - b.ordering;
            }
            if (a.ordering !== null) return -1;
            if (b.ordering !== null) return 1;
            return a.name.localeCompare(b.name);
        });
        entity.dataValues.groups = entity.dataValues.groups.map(group => ({ id: group.id }));
    }
    if (entity.dataValues.images)
        entity.dataValues.images = entity.dataValues.images.map(image => imageEntity2Json(image));
    if (entity.dataValues.audios)
        entity.dataValues.audios = entity.dataValues.audios.map(audio => audioEntity2Json(audio));
    if (entity.dataValues.videos)
        entity.dataValues.videos = entity.dataValues.videos.map(video => videoEntity2Json(video));
    if (entity.dataValues.annotations) {
        // Sort annotations by ordering field, then by updatedAt as fallback
        entity.dataValues.annotations.sort((a, b) => {
            if (a.ordering !== null && b.ordering !== null) {
                return a.ordering - b.ordering;
            }
            if (a.ordering !== null) return -1;
            if (b.ordering !== null) return 1;
            return new Date(b.updatedAt) - new Date(a.updatedAt);
        });
        entity.dataValues.annotations = entity.dataValues.annotations.map(annotation => ({ id: annotation.id }));
    }
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

// Function to calculate read time from article content and store in field1
async function calculateAndUpdateReadTime(articleId) {
    try {
        const article = await sequelize.models.article.findByPk(articleId, {
            include: [
                {
                    model: sequelize.models.comment,
                    limit: 1
                }
            ]
        });

        if (!article) {
            console.warn(`Article with id ${articleId} not found for read time calculation`);
            return;
        }

        // Average reading speed for comprehension of substantive content
        const wordsPerMinute = 150;
        
        // Combine all text content from the article
        let totalText = '';
        
        // Add explanation text
        if (article.explanation) {
            totalText += htmlToPlainText(article.explanation) + ' ';
        }
        
        // Add main text
        if (article.text) {
            totalText += htmlToPlainText(article.text) + ' ';
        }
        
        // Add comment text
        if (article.comments && article.comments[0] && article.comments[0].text) {
            totalText += htmlToPlainText(article.comments[0].text) + ' ';
        }
        
        // Early return for empty content
        if (!totalText.trim()) {
            await article.update({ field1: '1' }); // Minimum 1 minute for empty articles
            return 1;
        }
        
        // Count words (split by whitespace and filter empty strings)
        const wordCount = totalText.trim().split(/\s+/).filter(word => word.length > 0).length;
        
        // Calculate read time in minutes
        const readTimeMinutes = Math.ceil(wordCount / wordsPerMinute);
        
        // Store read time (minimum of 1 minute for very short content)
        const finalReadTime = Math.max(1, readTimeMinutes);
        await article.update({ field1: finalReadTime.toString() });
        
        console.log(`Updated read time for article ${articleId}: ${finalReadTime} minutes (${wordCount} words)`);
        return finalReadTime;
        
    } catch (error) {
        console.error('Error calculating read time for article', articleId, error);
        return 1; // Return default if calculation fails
    }
}

// Function to ensure read time is calculated for an article
async function ensureReadTimeCalculated(article) {
    // If field1 is empty or null, calculate and store read time
    if (!article.field1 || article.field1.trim() === '') {
        console.log(`Calculating read time for article ${article.id} (first time load)`);
        const calculatedReadTime = await calculateAndUpdateReadTime(article.id);
        
        // Update the current article object instead of reloading from database
        article.field1 = calculatedReadTime.toString();
        
        return article;
    }
    return article;
}

// Simple HTML to plain text converter
function htmlToPlainText(html) {
    if (!html) return '';
    
    // Remove HTML tags and decode HTML entities
    return html
        .replace(/<[^>]*>/g, ' ') // Remove HTML tags
        .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
        .replace(/&amp;/g, '&') // Decode ampersands
        .replace(/&lt;/g, '<') // Decode less than
        .replace(/&gt;/g, '>') // Decode greater than
        .replace(/&quot;/g, '"') // Decode quotes
        .replace(/&#39;/g, "'") // Decode single quotes
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
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

function audioEntity2Json(entity) {
    return {
        id: entity.dataValues.id,
        name: entity.dataValues.name,
        type: entity.dataValues.type,
        path: entity.dataValues.path,
        size: entity.dataValues.size,
        description: entity.dataValues.description,
        duration: entity.dataValues.duration,
    };
}

function videoEntity2Json(entity) {
    return {
        id: entity.dataValues.id,
        name: entity.dataValues.name,
        type: entity.dataValues.type,
        path: entity.dataValues.path,
        size: entity.dataValues.size,
        description: entity.dataValues.description,
        duration: entity.dataValues.duration,
        width: entity.dataValues.width,
        height: entity.dataValues.height,
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

async function resolveArticleNotes(article) {
    if (!article.annotations) return [];
    
    const annotations = await Promise.all(
        article.annotations.map(async ann => {
            if (typeof ann === 'object' && ann.note !== undefined) {
                return ann;
            }
            return await annotationService.getAnnotationById(ann.id || ann);
        })
    );
    // Filter out empty notes
    const filtered = annotations.filter(annotation => 
        annotation && 
        annotation.note && 
        annotation.note.trim() !== ''
    );
    // Sort by ordering field (ascending), fallback to 0 if undefined
    filtered.sort((a, b) => {
        const orderA = typeof a.ordering === 'number' ? a.ordering : 0;
        const orderB = typeof b.ordering === 'number' ? b.ordering : 0;
        return orderA - orderB;
    });
    return filtered;
}

async function resolveArticleTags(article) {
    if (!article.tags) return [];
    
    const tags = await Promise.all(
            article.tags.map(async tag => {
                if (typeof tag === 'object' && tag.name !== undefined) {
                    return tag;
                }
                return await tagService.getTagWithId(tag.id || tag);
            })
    );
    return tags.filter(Boolean);
}
        
async function resolveArticleCollections(article) {
    if (!article.groups) return [];
    
    const collections = await Promise.all(
            article.groups.map(async group => {
                if (typeof group === 'object' && group.name !== undefined) {
                    return group;
                }
                return await groupService.getGroupById(group.id || group);
            })
    );
    
    // Sort by ordering field, then by name as fallback
    const sorted = collections.filter(Boolean).sort((a, b) => {
        if (a.ordering !== null && b.ordering !== null) {
            return a.ordering - b.ordering;
        }
        if (a.ordering !== null) return -1;
        if (b.ordering !== null) return 1;
        return a.name.localeCompare(b.name);
    });
    
    return sorted;
}
        
async function resolveArticleRelatedArticles(article) {
    if (!article.relatedArticles) return [];
    
    const relatedArticles = await Promise.all(
            article.relatedArticles.map(async rel => {
                const relId = typeof rel === 'object' ? rel.id : rel;
                const relatedArticle = await getArticleById(relId);
                // Include the ordering from the junction table
                if (relatedArticle && typeof rel === 'object' && rel.ArticleArticleRel) {
                    relatedArticle.relatedArticleOrdering = rel.ArticleArticleRel.relatedArticleOrdering;
                }
                return relatedArticle;
            })
    );
    
    // Sort by relatedArticleOrdering, then by title as fallback
    return relatedArticles.filter(Boolean).sort((a, b) => {
        if (a.relatedArticleOrdering !== null && b.relatedArticleOrdering !== null) {
            return a.relatedArticleOrdering - b.relatedArticleOrdering;
        }
        if (a.relatedArticleOrdering !== null) return -1;
        if (b.relatedArticleOrdering !== null) return 1;
        return a.title.localeCompare(b.title);
    });
}

async function resolveArticleCategory(article) {
    if (!article.categoryId) return null;
    return await categoryService.getCategoryById(article.categoryId);
}

async function resolveArticleOwner(article) {
    if (!article.ownerId) return null;
    return await ownerService.getOwnerById(article.ownerId);
}

async function resolveArticleEntities(article, options = {}) {
    const {
        includeAnnotations = true,
        includeTags = true,
        includeCollections = true,
        includeRelatedArticles = true,
        includeCategory = true,
        includeOwner = true
    } = options;

    // Only resolve the entities that are requested
    const promises = [];
    const entityKeys = [];

    if (includeAnnotations) {
        promises.push(resolveArticleNotes(article));
        entityKeys.push('annotations');
    }

    if (includeTags) {
        promises.push(resolveArticleTags(article));
        entityKeys.push('tags');
    }

    if (includeCollections) {
        promises.push(resolveArticleCollections(article));
        entityKeys.push('collections');
    }

    if (includeRelatedArticles) {
        promises.push(resolveArticleRelatedArticles(article));
        entityKeys.push('relatedArticles');
    }

    if (includeCategory) {
        promises.push(resolveArticleCategory(article));
        entityKeys.push('category');
    }

    if (includeOwner) {
        promises.push(resolveArticleOwner(article));
        entityKeys.push('owner');
    }

    // Execute all requested promises in parallel
    const results = await Promise.all(promises);

    // Build the result object with only the requested entities
    const resolvedEntities = {};
    entityKeys.forEach((key, index) => {
        resolvedEntities[key] = results[index];
    });

    // Always include default values for entities that weren't requested
    return {
        annotations: resolvedEntities.annotations || [],
        tags: resolvedEntities.tags || [],
        collections: resolvedEntities.collections || [],
        relatedArticles: resolvedEntities.relatedArticles || [],
        category: resolvedEntities.category || null,
        owner: resolvedEntities.owner || null
    };
}

const ArticleService = {
    initService,
    getArticleEntity,
    getArticleById,
    resolveArticleEntities,
    resolveArticleAnnotations: resolveArticleNotes,
    resolveArticleTags,
    resolveArticleCollections,
    resolveArticleRelatedArticles,
    resolveArticleCategory,
    resolveArticleOwner,
    createArticleProgrammatically,
    updateRelatedArticleOrdering,
    updateRelatedArticleOrderings,
    getAllArticles, //  TODO: remove
    updateArticleDate, // TODO: remove
};

export default ArticleService;