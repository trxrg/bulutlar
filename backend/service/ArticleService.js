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
import PDFDocument from 'pdfkit';
import { Document, Packer, Paragraph, TextRun, ImageRun, HeadingLevel } from 'docx';
import { convert } from 'html-to-text';
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure html-to-text to preserve Turkish characters and fix newlines
const htmlToTextOptions = {
    wordwrap: null,
    preserveNewlines: false,
    uppercaseHeadings: false,
    ignoreHref: true,
    ignoreImage: true,
    tables: true,
    decodeEntities: true,
    selectors: [
        { selector: 'p', options: { leadingLineBreaks: 0, trailingLineBreaks: 1 } },
        { selector: 'br', options: { leadingLineBreaks: 0, trailingLineBreaks: 1 } },
        { selector: 'div', options: { leadingLineBreaks: 0, trailingLineBreaks: 1 } }
    ]
};

// Helper function to clean up excessive newlines for PDF
const cleanTextForPDF = (text) => {
    if (!text) return '';
    // Replace multiple consecutive newlines with single newlines
    return text.replace(/\n\s*\n+/g, '\n').trim();
};

// Helper function to convert HTML to paragraphs for Word documents
const htmlToParagraphs = (htmlContent) => {
    if (!htmlContent) return [];
    
    // Convert HTML to text but preserve paragraph structure
    const textWithParagraphs = convert(htmlContent, {
        wordwrap: null,
        preserveNewlines: true,
        uppercaseHeadings: false,
        ignoreHref: true,
        ignoreImage: true,
        tables: true,
        decodeEntities: true,
        selectors: [
            { selector: 'p', options: { leadingLineBreaks: 0, trailingLineBreaks: 2 } },
            { selector: 'br', options: { leadingLineBreaks: 1, trailingLineBreaks: 0 } },
            { selector: 'div', options: { leadingLineBreaks: 0, trailingLineBreaks: 2 } }
        ]
    });
    
    // Split by double newlines to get paragraphs, filter empty ones
    return textWithParagraphs
        .split(/\n\s*\n/)
        .map(p => p.trim())
        .filter(p => p.length > 0);
};

// Helper function to parse HTML and create formatted TextRuns for Word documents
const htmlToFormattedRuns = (htmlContent) => {
    if (!htmlContent) return [];
    
    // Simple regex-based approach to preserve bold formatting
    // This handles basic <strong>, <b>, and <em>, <i> tags
    let text = htmlContent
        .replace(/<\/p>/gi, '\n\n')  // Paragraph breaks
        .replace(/<br\s*\/?>/gi, '\n')  // Line breaks
        .replace(/<div[^>]*>/gi, '\n')  // Div starts
        .replace(/<\/div>/gi, '\n')  // Div ends
        .replace(/<[^>]*>/g, (match) => {
            // Preserve formatting tags, remove others
            if (match.match(/<\/?(?:strong|b|em|i)>/i)) {
                return match;
            }
            return '';
        });
    
    // Split into paragraphs
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim());
    
    return paragraphs.map(paragraph => {
        const runs = [];
        let currentText = '';
        let isBold = false;
        let isItalic = false;
        
        // Simple state machine to parse formatting
        const tokens = paragraph.split(/(<\/?(?:strong|b|em|i)>)/gi);
        
        for (const token of tokens) {
            if (token.match(/<(?:strong|b)>/i)) {
                if (currentText) {  // Don't trim - preserve spaces
                    runs.push(new TextRun({ 
                        text: currentText, 
                        bold: isBold, 
                        italics: isItalic, 
                        font: 'Arial' 
                    }));
                    currentText = '';
                }
                isBold = true;
            } else if (token.match(/<\/(?:strong|b)>/i)) {
                if (currentText) {  // Don't trim - preserve spaces
                    runs.push(new TextRun({ 
                        text: currentText, 
                        bold: isBold, 
                        italics: isItalic, 
                        font: 'Arial' 
                    }));
                    currentText = '';
                }
                isBold = false;
            } else if (token.match(/<(?:em|i)>/i)) {
                if (currentText) {  // Don't trim - preserve spaces
                    runs.push(new TextRun({ 
                        text: currentText, 
                        bold: isBold, 
                        italics: isItalic, 
                        font: 'Arial' 
                    }));
                    currentText = '';
                }
                isItalic = true;
            } else if (token.match(/<\/(?:em|i)>/i)) {
                if (currentText) {  // Don't trim - preserve spaces
                    runs.push(new TextRun({ 
                        text: currentText, 
                        bold: isBold, 
                        italics: isItalic, 
                        font: 'Arial' 
                    }));
                    currentText = '';
                }
                isItalic = false;
            } else if (token) {  // Don't check trim() - preserve all tokens including spaces
                currentText += token;
            }
        }
        
        // Add remaining text
        if (currentText) {
            runs.push(new TextRun({ 
                text: currentText, 
                bold: isBold, 
                italics: isItalic, 
                font: 'Arial' 
            }));
        }
        
        // If no runs were created, create a simple one with the whole paragraph
        if (runs.length === 0 && paragraph.trim()) {
            return [new TextRun({ text: paragraph, font: 'Arial' })];
        }
        
        return runs;
    });
};

// Helper function to parse HTML and create formatted text segments for PDF
const htmlToFormattedSegmentsPDF = (htmlContent) => {
    if (!htmlContent) return [];
    
    // Simple regex-based approach to preserve formatting
    let text = htmlContent
        .replace(/<\/p>/gi, '\n\n')  // Paragraph breaks
        .replace(/<br\s*\/?>/gi, '\n')  // Line breaks
        .replace(/<div[^>]*>/gi, '\n')  // Div starts
        .replace(/<\/div>/gi, '\n')  // Div ends
        .replace(/<[^>]*>/g, (match) => {
            // Preserve formatting tags, remove others
            if (match.match(/<\/?(?:strong|b|em|i)>/i)) {
                return match;
            }
            return '';
        });
    
    // Split into paragraphs
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim());
    
    return paragraphs.map(paragraph => {
        const segments = [];
        let currentText = '';
        let isBold = false;
        let isItalic = false;
        
        // Simple state machine to parse formatting
        const tokens = paragraph.split(/(<\/?(?:strong|b|em|i)>)/gi);
        
        for (const token of tokens) {
            if (token.match(/<(?:strong|b)>/i)) {
                if (currentText) {  // Don't trim - preserve spaces
                    segments.push({ 
                        text: currentText, 
                        bold: isBold, 
                        italic: isItalic 
                    });
                    currentText = '';
                }
                isBold = true;
            } else if (token.match(/<\/(?:strong|b)>/i)) {
                if (currentText) {  // Don't trim - preserve spaces
                    segments.push({ 
                        text: currentText, 
                        bold: isBold, 
                        italic: isItalic 
                    });
                    currentText = '';
                }
                isBold = false;
            } else if (token.match(/<(?:em|i)>/i)) {
                if (currentText) {  // Don't trim - preserve spaces
                    segments.push({ 
                        text: currentText, 
                        bold: isBold, 
                        italic: isItalic 
                    });
                    currentText = '';
                }
                isItalic = true;
            } else if (token.match(/<\/(?:em|i)>/i)) {
                if (currentText) {  // Don't trim - preserve spaces
                    segments.push({ 
                        text: currentText, 
                        bold: isBold, 
                        italic: isItalic 
                    });
                    currentText = '';
                }
                isItalic = false;
            } else if (token) {  // Don't check trim() - preserve all tokens including spaces
                currentText += token;
            }
        }
        
        // Add remaining text
        if (currentText) {  // Don't trim - preserve spaces
            segments.push({ 
                text: currentText, 
                bold: isBold, 
                italic: isItalic 
            });
        }
        
        return segments;
    }).filter(segments => segments.length > 0);
};

// Helper function to render formatted text segments in PDF (MUCH simpler approach)
const renderFormattedTextPDF = (doc, segments, options = {}) => {
    const defaultOptions = {
        lineGap: 6,
        width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
        align: 'justify'
    };
    const renderOptions = { ...defaultOptions, ...options };
    
    segments.forEach((paragraphSegments, paragraphIndex) => {
        if (paragraphIndex > 0) {
            doc.moveDown(0.3); // Space between paragraphs
        }
        
        // SIMPLE APPROACH: Just concatenate all text with ** markers for bold
        let fullText = '';
        paragraphSegments.forEach((segment) => {
            if (segment.bold) {
                fullText += '**' + segment.text + '**';
            } else {
                fullText += segment.text;
            }
        });
        
        // Set default font and render the full text
        try {
            doc.font('NotoSans');
        } catch (error) {
            doc.font('Helvetica');
        }
        
        // For now, just render as plain text to test spacing
        doc.text(ensureUTF8(fullText), {
            lineGap: renderOptions.lineGap,
            width: renderOptions.width,
            align: renderOptions.align
        });
    });
};

// Helper function to ensure proper UTF-8 encoding
const ensureUTF8 = (text) => {
    if (!text) return '';
    // Ensure the text is properly encoded as UTF-8
    try {
        // Convert to Buffer and back to ensure proper encoding
        return Buffer.from(text, 'utf8').toString('utf8');
    } catch (error) {
        console.warn('Error encoding text to UTF-8:', error);
        return text;
    }
};

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
    ipcMain.handle('article/exportArticle', async (event, exportData) => await exportArticle(exportData));
    ipcMain.handle('article/exportMultipleArticles', async (event, exportData) => await exportMultipleArticles(exportData));
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
    if (entity.dataValues.groups)
        entity.dataValues.groups = entity.dataValues.groups.map(group => ({ id: group.id }));
    if (entity.dataValues.groups)
        entity.dataValues.groups = entity.dataValues.groups.map(group => ({ id: group.id }));
    if (entity.dataValues.images)
        entity.dataValues.images = entity.dataValues.images.map(image => imageEntity2Json(image));
    if (entity.dataValues.audios)
        entity.dataValues.audios = entity.dataValues.audios.map(audio => audioEntity2Json(audio));
    if (entity.dataValues.videos)
        entity.dataValues.videos = entity.dataValues.videos.map(video => videoEntity2Json(video));
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

async function exportArticle(exportData) {
    try {
        const { article, options, translations } = exportData;
        
        // Resolve IDs to full objects in backend (where it belongs!)
        const annotations = article.annotations ? await Promise.all(
            article.annotations.map(async ann => {
                if (typeof ann === 'object' && ann.note !== undefined) {
                    return ann;
                }
                return await annotationService.getAnnotationById(ann.id || ann);
            })
        ).then(results => results.filter(Boolean)) : [];
        
        const tags = article.tags ? await Promise.all(
            article.tags.map(async tag => {
                if (typeof tag === 'object' && tag.name !== undefined) {
                    return tag;
                }
                return await tagService.getTagWithId(tag.id || tag);
            })
        ).then(results => results.filter(Boolean)) : [];
        
        const collections = article.groups ? await Promise.all(
            article.groups.map(async group => {
                if (typeof group === 'object' && group.name !== undefined) {
                    return group;
                }
                return await groupService.getGroupById(group.id || group);
            })
        ).then(results => results.filter(Boolean)) : [];
        
        const relatedArticles = article.relatedArticles ? await Promise.all(
            article.relatedArticles.map(async rel => {
                const relId = typeof rel === 'object' ? rel.id : rel;
                return await getArticleById(relId);
            })
        ).then(results => results.filter(Boolean)) : [];
        
        const category = article.categoryId ? await categoryService.getCategoryById(article.categoryId) : null;
        const owner = article.ownerId ? await ownerService.getOwnerById(article.ownerId) : null;
        
        // Show save dialog
        const result = await dialog.showSaveDialog({
            title: 'Export Article',
            defaultPath: `${article.title || 'article'}.${options.format}`,
            filters: [
                options.format === 'pdf' 
                    ? { name: 'PDF Files', extensions: ['pdf'] }
                    : { name: 'Word Documents', extensions: ['docx'] }
            ]
        });

        if (result.canceled || !result.filePath) {
            return { success: false, canceled: true };
        }

        // Create updated export data with resolved entities
        const updatedExportData = {
            ...exportData,
            annotations,
            tags,
            collections,
            relatedArticles,
            category,
            owner
        };

        if (options.format === 'pdf') {
            await generatePDF(updatedExportData, result.filePath);
        } else if (options.format === 'docx') {
            await generateWordDocument(updatedExportData, result.filePath);
        }

        return { success: true, filePath: result.filePath };

    } catch (error) {
        console.error('Error exporting article:', error);
        throw error;
    }
}

async function generatePDF(exportData, filePath) {
    const { article, options, annotations, tags, relatedArticles, collections, category, owner, translations } = exportData;
    
    const doc = new PDFDocument({ 
        margin: 50,
        bufferPages: true,
        info: {
            Title: article.title || 'Article Export',
            Producer: 'Bulutlar App',
            Creator: 'Bulutlar App'
        }
    });
    
    // Create write stream with UTF-8 encoding
    const writeStream = fsSync.createWriteStream(filePath);
    doc.pipe(writeStream);
    
    // Set default line spacing to 1.5
    const defaultLineSpacing = 1.5;
    
    // Register and use Noto Sans fonts which have excellent Unicode support
    try {
        const fontPathRegular = path.join(__dirname, '../fonts/NotoSans-Regular.ttf');
        const fontPathBold = path.join(__dirname, '../fonts/NotoSans-Bold.ttf');
        doc.registerFont('NotoSans', fontPathRegular);
        doc.registerFont('NotoSans-Bold', fontPathBold);
        doc.font('NotoSans');
        console.log('Successfully loaded NotoSans fonts for Turkish character support');
    } catch (error) {
        console.error('Failed to load NotoSans fonts, falling back to Helvetica:', error);
        doc.font('Helvetica');
    }

    // Title
    doc.fontSize(20).text(ensureUTF8(article.title || 'Untitled Article'), { align: 'center' });
    doc.moveDown();

    // Article info (like ArticleInfo component)
    const articleInfoParts = [];
    if (owner) {
        articleInfoParts.push(owner.name);
    }
    if (category) {
        articleInfoParts.push(category.name);
    }
    if (!article.isDateUncertain && article.date) {
        articleInfoParts.push(new Date(article.date).toLocaleDateString('tr'));
        articleInfoParts.push(`(${article.number})`);
        
        // Day of week (translated)
        const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayKey = weekdays[new Date(article.date).getDay()];
        const dayOfWeek = translations?.[dayKey] || dayKey;
        articleInfoParts.push(dayOfWeek);
        
        if (article.date2) {
            articleInfoParts.push(new Date(article.date2).toLocaleDateString('tr'));
            articleInfoParts.push(`(${article.number2})`);
        }
    }
    
    // Read time if available
    if (article.field1 && article.field1.trim() !== '') {
        const readTime = parseInt(article.field1, 10);
        if (!isNaN(readTime) && readTime > 0) {
            articleInfoParts.push(`${readTime} ${readTime === 1 ? (translations?.minRead || 'min read') : (translations?.minsRead || 'mins read')}`);
        }
    }
    
    if (articleInfoParts.length > 0) {
        doc.fontSize(12).text(ensureUTF8(articleInfoParts.join(' | ')), { align: 'left', lineGap: 6 });
        doc.moveDown();
    }

    // Content sections
    if (options.explanation && article.explanation) {
        const explanationSegments = htmlToFormattedSegmentsPDF(article.explanation);
        if (explanationSegments.length > 0) {
            // Add explanation text with italic styling and preserved bold formatting
            doc.fontSize(12);
            
            renderFormattedTextPDF(doc, explanationSegments, {
                lineGap: 6,
                width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
                align: 'justify'
            });
            
            doc.moveDown();
        }
    }

    if (options.mainText && article.text) {
        const mainTextSegments = htmlToFormattedSegmentsPDF(article.text);
        if (mainTextSegments.length > 0) {
            doc.fontSize(12);
            
            renderFormattedTextPDF(doc, mainTextSegments, {
                lineGap: 6,
                width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
                align: 'justify'
            });
            
            doc.moveDown();
        }
    }

    if (options.comment && article.comments && article.comments.length > 0 && article.comments[0].text) {
        const commentSegments = htmlToFormattedSegmentsPDF(article.comments[0].text);
        if (commentSegments.length > 0) {
            doc.fontSize(16).text(translations?.comment || 'Comment', { underline: true });
            doc.moveDown(0.5);
            doc.fontSize(12);
            
            renderFormattedTextPDF(doc, commentSegments, {
                lineGap: 6,
                width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
                align: 'justify'
            });
            
            doc.moveDown();
        }
    }

    // Images
    if (options.images && article.images && article.images.length > 0) {
        for (const image of article.images) {
            try {
                const imagePath = path.join(imagesFolderPath, image.path);
                const imageBuffer = await fs.readFile(imagePath);
                doc.image(imageBuffer, { fit: [400, 300], align: 'center' });
                doc.moveDown();
            } catch (error) {
                console.error('Error adding image to PDF:', error);
                doc.fontSize(10).text(`[Image: ${image.name}]`, { align: 'center' });
                doc.moveDown();
            }
        }
    }

    // Notes/Annotations
    if (options.notes && annotations && annotations.length > 0) {
        doc.fontSize(16).text(translations?.notes || 'Notes', { underline: true });
        doc.moveDown(0.5);
        annotations.forEach((annotation, index) => {
            doc.fontSize(12).text(ensureUTF8(`${index + 1}. ${annotation.note || annotation.quote || ''}`), { 
                lineGap: 6,
                width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
                align: 'justify'
            });
            doc.moveDown(0.3);
        });
        doc.moveDown();
    }

    // Tags
    if (options.tags && tags && tags.length > 0) {
        doc.fontSize(16).text(translations?.tags || 'Tags', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(12).text(ensureUTF8(tags.map(tag => tag.name).join(', ')), { 
            lineGap: 6,
            width: doc.page.width - doc.page.margins.left - doc.page.margins.right
        });
        doc.moveDown();
    }

    // Related Articles
    if (options.relatedArticles && relatedArticles && relatedArticles.length > 0) {
        doc.fontSize(16).text(translations?.relatedArticles || 'Related Articles', { underline: true });
        doc.moveDown(0.5);
        relatedArticles.forEach((relatedArticle, index) => {
            doc.fontSize(12).text(ensureUTF8(`${index + 1}. ${relatedArticle.title}`), { 
                lineGap: 6,
                width: doc.page.width - doc.page.margins.left - doc.page.margins.right
            });
            doc.moveDown(0.3);
        });
        doc.moveDown();
    }

    // Collections
    if (options.collections && collections && collections.length > 0) {
        doc.fontSize(16).text(translations?.collections || 'Collections', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(12).text(ensureUTF8(collections.map(collection => collection.name).join(', ')), { 
            lineGap: 6,
            width: doc.page.width - doc.page.margins.left - doc.page.margins.right
        });
        doc.moveDown();
    }

    doc.end();
}

async function generateWordDocument(exportData, filePath) {
    const { article, options, annotations, tags, relatedArticles, collections, category, owner, translations } = exportData;
    
    const children = [];

    // Title
    children.push(new Paragraph({
        children: [new TextRun({ text: article.title || 'Untitled Article', bold: true, size: 32, font: 'Arial' })],
        heading: HeadingLevel.TITLE,
        alignment: 'center',
        spacing: { after: 400 }  // Add space after title
    }));

    // Article info (like ArticleInfo component)
    const articleInfoParts = [];
    if (owner) {
        articleInfoParts.push(owner.name);
    }
    if (category) {
        articleInfoParts.push(category.name);
    }
    if (!article.isDateUncertain && article.date) {
        articleInfoParts.push(new Date(article.date).toLocaleDateString('tr'));
        articleInfoParts.push(`(${article.number})`);
        
        // Day of week (translated)
        const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayKey = weekdays[new Date(article.date).getDay()];
        const dayOfWeek = translations?.[dayKey] || dayKey;
        articleInfoParts.push(dayOfWeek);
        
        if (article.date2) {
            articleInfoParts.push(new Date(article.date2).toLocaleDateString('tr'));
            articleInfoParts.push(`(${article.number2})`);
        }
    }
    
    // Read time if available
    if (article.field1 && article.field1.trim() !== '') {
        const readTime = parseInt(article.field1, 10);
        if (!isNaN(readTime) && readTime > 0) {
            articleInfoParts.push(`${readTime} ${readTime === 1 ? (translations?.minRead || 'min read') : (translations?.minsRead || 'mins read')}`);
        }
    }
    
    if (articleInfoParts.length > 0) {
        children.push(new Paragraph({
            children: [new TextRun({ text: articleInfoParts.join(' | '), italics: true, font: 'Arial' })],
        }));
        children.push(new Paragraph({ text: '' })); // Empty line
    }

    // Content sections
    if (options.explanation && article.explanation) {
        const formattedRuns = htmlToFormattedRuns(article.explanation);
        if (formattedRuns.length > 0) {
            formattedRuns.forEach((runs, index) => {
                // Make all runs italic for explanation
                const italicRuns = runs.map(run => new TextRun({ 
                    ...run, 
                    italics: true, 
                    size: 22 
                }));
                children.push(new Paragraph({
                    children: italicRuns,
                    spacing: { 
                        before: index === 0 ? 120 : 0, 
                        after: index === formattedRuns.length - 1 ? 120 : 60, 
                        line: 360, 
                        lineRule: 'auto' 
                    }
                }));
            });
            children.push(new Paragraph({ text: '' })); // Empty line
        }
    }

    if (options.mainText && article.text) {
        const formattedRuns = htmlToFormattedRuns(article.text);
        if (formattedRuns.length > 0) {
            formattedRuns.forEach((runs, index) => {
                children.push(new Paragraph({
                    children: runs,
                    spacing: { 
                        after: index === formattedRuns.length - 1 ? 120 : 60, 
                        line: 360, 
                        lineRule: 'auto' 
                    }
                }));
            });
            children.push(new Paragraph({ text: '' })); // Empty line
        }
    }

    if (options.comment && article.comments && article.comments.length > 0 && article.comments[0].text) {
        const formattedRuns = htmlToFormattedRuns(article.comments[0].text);
        if (formattedRuns.length > 0) {
            children.push(new Paragraph({
                children: [new TextRun({ text: translations?.comment || 'Comment', bold: true, size: 24, font: 'Arial' })],
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 300, after: 200 }
            }));
            formattedRuns.forEach((runs, index) => {
                children.push(new Paragraph({
                    children: runs,
                    spacing: { 
                        after: index === formattedRuns.length - 1 ? 120 : 60, 
                        line: 360, 
                        lineRule: 'auto' 
                    }
                }));
            });
            children.push(new Paragraph({ text: '' })); // Empty line
        }
    }

    // Images
    if (options.images && article.images && article.images.length > 0) {
        for (const image of article.images) {
            try {
                const imagePath = path.join(imagesFolderPath, image.path);
                const imageBuffer = await fs.readFile(imagePath);
                children.push(new Paragraph({
                    children: [new ImageRun({
                        data: imageBuffer,
                        transformation: { width: 400, height: 300 }
                    })]
                }));
            } catch (error) {
                console.error('Error adding image to Word document:', error);
                children.push(new Paragraph({
                    children: [new TextRun({ text: `[Image: ${image.name}]`, italics: true, font: 'Arial' })]
                }));
            }
        }
        children.push(new Paragraph({ text: '' })); // Empty line
    }

    // Notes/Annotations
    if (options.notes && annotations && annotations.length > 0) {
        children.push(new Paragraph({
            children: [new TextRun({ text: translations?.notes || 'Notes', bold: true, size: 24, font: 'Arial' })],
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 200 }
        }));
        annotations.forEach((annotation, index) => {
            children.push(new Paragraph({
                children: [new TextRun({ text: `${index + 1}. ${annotation.note || annotation.quote || ''}`, font: 'Arial' })],
                spacing: { line: 360, lineRule: 'auto' }
            }));
        });
        children.push(new Paragraph({ text: '' })); // Empty line
    }

    // Tags
    if (options.tags && tags && tags.length > 0) {
        children.push(new Paragraph({
            children: [new TextRun({ text: translations?.tags || 'Tags', bold: true, size: 24, font: 'Arial' })],
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 200 }
        }));
        children.push(new Paragraph({
            children: [new TextRun({ text: tags.map(tag => tag.name).join(', '), font: 'Arial' })],
            spacing: { line: 360, lineRule: 'auto' }
        }));
        children.push(new Paragraph({ text: '' })); // Empty line
    }

    // Related Articles
    if (options.relatedArticles && relatedArticles && relatedArticles.length > 0) {
        children.push(new Paragraph({
            children: [new TextRun({ text: translations?.relatedArticles || 'Related Articles', bold: true, size: 24, font: 'Arial' })],
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 200 }
        }));
        relatedArticles.forEach((relatedArticle, index) => {
            children.push(new Paragraph({
                children: [new TextRun({ text: `${index + 1}. ${relatedArticle.title}`, font: 'Arial' })],
                spacing: { line: 360, lineRule: 'auto' }
            }));
        });
        children.push(new Paragraph({ text: '' })); // Empty line
    }

    // Collections
    if (options.collections && collections && collections.length > 0) {
        children.push(new Paragraph({
            children: [new TextRun({ text: translations?.collections || 'Collections', bold: true, size: 24, font: 'Arial' })],
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 200 }
        }));
        children.push(new Paragraph({
            children: [new TextRun({ text: collections.map(collection => collection.name).join(', '), font: 'Arial' })],
            spacing: { line: 360, lineRule: 'auto' }
        }));
    }

    const doc = new Document({
        sections: [{
            properties: {},
            children: children
        }]
    });

    const buffer = await Packer.toBuffer(doc);
    await fs.writeFile(filePath, buffer);
}

const ArticleService = {
    initService,
    getArticleEntity,
    createArticleProgrammatically,
    getAllArticles, //  TODO: remove
    updateArticleDate, // TODO: remove
};

// Helper function to check if HTML string is empty
function isHtmlStringEmpty(htmlString) {
    if (!htmlString) return true;
    // Remove HTML tags and check if there's any text content
    const textContent = htmlString.replace(/<[^>]*>/g, '').trim();
    return !textContent;
}

// Helper function to generate content for a single article in merged PDF (reusing single article logic)
async function generateSingleArticleContentForMergedPDF(doc, exportData) {
    const { article, options, translations, annotations, tags, relatedArticles, collections, category, owner } = exportData;
    
    // Explanation
    if (options.explanation && article.explanation && !isHtmlStringEmpty(article.explanation)) {
        const explanationSegments = htmlToFormattedSegmentsPDF(article.explanation);
        if (explanationSegments.length > 0) {
            doc.fontSize(12);
            renderFormattedTextPDF(doc, explanationSegments, {
                lineGap: 6,
                width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
                align: 'justify'
            });
            doc.moveDown();
        }
    }

    // Main Text
    if (options.mainText && article.text && !isHtmlStringEmpty(article.text)) {
        const mainTextSegments = htmlToFormattedSegmentsPDF(article.text);
        if (mainTextSegments.length > 0) {
            doc.fontSize(12);
            renderFormattedTextPDF(doc, mainTextSegments, {
                lineGap: 6,
                width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
                align: 'justify'
            });
            doc.moveDown();
        }
    }

    // Comment
    if (options.comment && article.comments && article.comments.length > 0 && !isHtmlStringEmpty(article.comments[0]?.text)) {
        const commentSegments = htmlToFormattedSegmentsPDF(article.comments[0].text);
        if (commentSegments.length > 0) {
            doc.fontSize(14).text(ensureUTF8(translations?.comment || 'Comment'), { underline: true });
            doc.moveDown(0.5);
            doc.fontSize(12);
            renderFormattedTextPDF(doc, commentSegments, {
                lineGap: 6,
                width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
                align: 'justify'
            });
            doc.moveDown();
        }
    }

    // Images
    if (options.images && article.images && article.images.length > 0) {
        for (const image of article.images) {
            try {
                const imagePath = path.join(imagesFolderPath, image.path);
                const imageBuffer = await fs.readFile(imagePath);
                doc.image(imageBuffer, { fit: [400, 300], align: 'center' });
                doc.moveDown();
            } catch (error) {
                console.error('Error adding image to PDF:', error);
            }
        }
    }

    // Notes/Annotations
    if (options.notes && annotations && annotations.length > 0) {
        doc.fontSize(16).text(translations?.notes || 'Notes', { underline: true });
        doc.moveDown(0.5);
        annotations.forEach((annotation, index) => {
            doc.fontSize(12).text(ensureUTF8(`${index + 1}. ${annotation.note || annotation.quote || ''}`), { 
                lineGap: 6,
                width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
                align: 'justify'
            });
            doc.moveDown(0.3);
        });
        doc.moveDown();
    }

    // Tags
    if (options.tags && tags && tags.length > 0) {
        doc.fontSize(16).text(translations?.tags || 'Tags', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(12).text(ensureUTF8(tags.map(tag => tag.name).join(', ')), { 
            lineGap: 6,
            width: doc.page.width - doc.page.margins.left - doc.page.margins.right
        });
        doc.moveDown();
    }

    // Related Articles
    if (options.relatedArticles && relatedArticles && relatedArticles.length > 0) {
        doc.fontSize(16).text(translations?.relatedArticles || 'Related Articles', { underline: true });
        doc.moveDown(0.5);
        relatedArticles.forEach((relatedArticle, index) => {
            doc.fontSize(12).text(ensureUTF8(`${index + 1}. ${relatedArticle.title}`), { 
                lineGap: 6,
                width: doc.page.width - doc.page.margins.left - doc.page.margins.right
            });
            doc.moveDown(0.3);
        });
        doc.moveDown();
    }

    // Collections
    if (options.collections && collections && collections.length > 0) {
        doc.fontSize(16).text(translations?.collections || 'Collections', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(12).text(ensureUTF8(collections.map(collection => collection.name).join(', ')), { 
            lineGap: 6,
            width: doc.page.width - doc.page.margins.left - doc.page.margins.right
        });
        doc.moveDown();
    }

    doc.moveDown(0.5);
}

// Helper function to generate content for a single article in merged Word (reusing single article logic)
async function generateSingleArticleContentForMergedWord(exportData) {
    const { article, options, translations, annotations, tags, relatedArticles, collections, category, owner } = exportData;
    const children = [];
    
    // Explanation
    if (options.explanation && article.explanation && !isHtmlStringEmpty(article.explanation)) {
        const formattedRuns = htmlToFormattedRuns(article.explanation);
        if (formattedRuns.length > 0) {
            formattedRuns.forEach((runs, index) => {
                const italicRuns = runs.map(run => new TextRun({ 
                    ...run, 
                    italics: true, 
                    size: 22,
                    font: 'Arial'
                }));
                children.push(new Paragraph({
                    children: italicRuns,
                    spacing: { 
                        before: index === 0 ? 120 : 0, 
                        after: index === formattedRuns.length - 1 ? 120 : 60, 
                        line: 360, 
                        lineRule: 'auto' 
                    }
                }));
            });
        }
    }

    // Main Text
    if (options.mainText && article.text && !isHtmlStringEmpty(article.text)) {
        const formattedRuns = htmlToFormattedRuns(article.text);
        if (formattedRuns.length > 0) {
            formattedRuns.forEach((runs, index) => {
                children.push(new Paragraph({
                    children: runs,
                    spacing: { 
                        after: index === formattedRuns.length - 1 ? 120 : 60, 
                        line: 360, 
                        lineRule: 'auto' 
                    }
                }));
            });
        }
    }

    // Comment
    if (options.comment && article.comments && article.comments.length > 0 && !isHtmlStringEmpty(article.comments[0]?.text)) {
        const formattedRuns = htmlToFormattedRuns(article.comments[0].text);
        if (formattedRuns.length > 0) {
            children.push(new Paragraph({
                children: [new TextRun({ text: translations?.comment || 'Comment', bold: true, size: 20, font: 'Arial' })],
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 300, after: 200 }
            }));
            formattedRuns.forEach((runs, index) => {
                children.push(new Paragraph({
                    children: runs,
                    spacing: { 
                        after: index === formattedRuns.length - 1 ? 120 : 60, 
                        line: 360, 
                        lineRule: 'auto' 
                    }
                }));
            });
        }
    }

    // Images
    if (options.images && article.images && article.images.length > 0) {
        for (const image of article.images) {
            try {
                const imagePath = path.join(imagesFolderPath, image.path);
                const imageBuffer = await fs.readFile(imagePath);
                children.push(new Paragraph({
                    children: [new ImageRun({
                        data: imageBuffer,
                        transformation: {
                            width: 500,
                            height: 400,
                        },
                    })],
                    alignment: 'center',
                    spacing: { before: 200, after: 200 }
                }));
            } catch (error) {
                console.error('Error adding image to Word:', error);
            }
        }
    }

    // Notes/Annotations
    if (options.notes && annotations && annotations.length > 0) {
        children.push(new Paragraph({
            children: [new TextRun({ text: translations?.notes || 'Notes', bold: true, size: 24, font: 'Arial' })],
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 200 }
        }));
        annotations.forEach((annotation, index) => {
            children.push(new Paragraph({
                children: [new TextRun({ text: `${index + 1}. ${annotation.note || annotation.quote || ''}`, font: 'Arial' })],
                spacing: { line: 360, lineRule: 'auto' }
            }));
        });
        children.push(new Paragraph({ text: '' })); // Empty line
    }

    // Tags
    if (options.tags && tags && tags.length > 0) {
        children.push(new Paragraph({
            children: [new TextRun({ text: translations?.tags || 'Tags', bold: true, size: 24, font: 'Arial' })],
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 200 }
        }));
        children.push(new Paragraph({
            children: [new TextRun({ text: tags.map(tag => tag.name).join(', '), font: 'Arial' })],
            spacing: { line: 360, lineRule: 'auto' }
        }));
        children.push(new Paragraph({ text: '' })); // Empty line
    }

    // Related Articles
    if (options.relatedArticles && relatedArticles && relatedArticles.length > 0) {
        children.push(new Paragraph({
            children: [new TextRun({ text: translations?.relatedArticles || 'Related Articles', bold: true, size: 24, font: 'Arial' })],
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 200 }
        }));
        relatedArticles.forEach((relatedArticle, index) => {
            children.push(new Paragraph({
                children: [new TextRun({ text: `${index + 1}. ${relatedArticle.title}`, font: 'Arial' })],
                spacing: { line: 360, lineRule: 'auto' }
            }));
        });
        children.push(new Paragraph({ text: '' })); // Empty line
    }

    // Collections
    if (options.collections && collections && collections.length > 0) {
        children.push(new Paragraph({
            children: [new TextRun({ text: translations?.collections || 'Collections', bold: true, size: 24, font: 'Arial' })],
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 200 }
        }));
        children.push(new Paragraph({
            children: [new TextRun({ text: collections.map(collection => collection.name).join(', '), font: 'Arial' })],
            spacing: { line: 360, lineRule: 'auto' }
        }));
    }

    // Add spacing at the end
    children.push(new Paragraph({ text: '' }));
    
    return children;
}

// Generate merged PDF document from multiple articles
async function generateMergedPDF(exportData, filePath) {
    const { articles, options, documentTitle, translations } = exportData;
    
    const doc = new PDFDocument({ margin: 50, bufferPages: true });
    const writeStream = fsSync.createWriteStream(filePath);
    doc.pipe(writeStream);
    
    // Set document info
    doc.info.Title = documentTitle || 'Merged Articles';
    doc.info.Author = 'Article Export';
    doc.info.Subject = 'Merged Articles Export';
    doc.info.Creator = 'Article Export Tool';

    // Register and use Noto Sans fonts which have excellent Unicode support
    try {
        const fontPathRegular = path.join(__dirname, '../fonts/NotoSans-Regular.ttf');
        const fontPathBold = path.join(__dirname, '../fonts/NotoSans-Bold.ttf');
        doc.registerFont('NotoSans', fontPathRegular);
        doc.registerFont('NotoSans-Bold', fontPathBold);
        doc.font('NotoSans');
        console.log('Successfully loaded NotoSans fonts for Turkish character support');
    } catch (error) {
        console.error('Failed to load NotoSans fonts, falling back to Helvetica:', error);
        doc.font('Helvetica');
    }

    // Document Title
    doc.fontSize(24).text(ensureUTF8(documentTitle || 'Merged Articles'), { align: 'center' });
    doc.moveDown(2);

    // Process each article
    for (let i = 0; i < articles.length; i++) {
        const article = articles[i];
        
        // Add separator between articles (except for the first one)
        if (i > 0) {
            doc.moveDown(2);
            // Add a horizontal line separator
            doc.strokeColor('#cccccc')
               .lineWidth(1)
               .moveTo(doc.page.margins.left, doc.y)
               .lineTo(doc.page.width - doc.page.margins.right, doc.y)
               .stroke();
            doc.moveDown(1);
        }

        // Article title
        doc.fontSize(18).text(ensureUTF8(article.title || 'Untitled Article'), { align: 'left' });
        doc.moveDown(0.5);
        
        // Resolve IDs to full objects for this article (same as single export)
        const annotations = article.annotations ? await Promise.all(
            article.annotations.map(async ann => {
                if (typeof ann === 'object' && ann.note !== undefined) {
                    return ann;
                }
                return await annotationService.getAnnotationById(ann.id || ann);
            })
        ).then(results => results.filter(Boolean)) : [];
        
        const tags = article.tags ? await Promise.all(
            article.tags.map(async tag => {
                if (typeof tag === 'object' && tag.name !== undefined) {
                    return tag;
                }
                return await tagService.getTagWithId(tag.id || tag);
            })
        ).then(results => results.filter(Boolean)) : [];
        
        const collections = article.groups ? await Promise.all(
            article.groups.map(async group => {
                if (typeof group === 'object' && group.name !== undefined) {
                    return group;
                }
                return await groupService.getGroupById(group.id || group);
            })
        ).then(results => results.filter(Boolean)) : [];
        
        const relatedArticles = article.relatedArticles ? await Promise.all(
            article.relatedArticles.map(async rel => {
                const relId = typeof rel === 'object' ? rel.id : rel;
                return await getArticleById(relId);
            })
        ).then(results => results.filter(Boolean)) : [];
        
        const category = article.categoryId ? await categoryService.getCategoryById(article.categoryId) : null;
        const owner = article.ownerId ? await ownerService.getOwnerById(article.ownerId) : null;

        // COPY EXACT LOGIC FROM SINGLE ARTICLE EXPORT
        
        // Explanation
        if (options.explanation && article.explanation && !isHtmlStringEmpty(article.explanation)) {
            const explanationSegments = htmlToFormattedSegmentsPDF(article.explanation);
            if (explanationSegments.length > 0) {
                doc.fontSize(12);
                renderFormattedTextPDF(doc, explanationSegments, {
                    lineGap: 6,
                    width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
                    align: 'justify'
                });
                doc.moveDown();
            }
        }

        // Main Text
        if (options.mainText && article.text && !isHtmlStringEmpty(article.text)) {
            const mainTextSegments = htmlToFormattedSegmentsPDF(article.text);
            if (mainTextSegments.length > 0) {
                doc.fontSize(12);
                renderFormattedTextPDF(doc, mainTextSegments, {
                    lineGap: 6,
                    width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
                    align: 'justify'
                });
                doc.moveDown();
            }
        }

        // Comment
        if (options.comment && article.comments && article.comments.length > 0 && !isHtmlStringEmpty(article.comments[0]?.text)) {
            const commentSegments = htmlToFormattedSegmentsPDF(article.comments[0].text);
            if (commentSegments.length > 0) {
                doc.fontSize(16).text(translations?.comment || 'Comment', { underline: true });
                doc.moveDown(0.5);
                doc.fontSize(12);
                renderFormattedTextPDF(doc, commentSegments, {
                    lineGap: 6,
                    width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
                    align: 'justify'
                });
                doc.moveDown();
            }
        }

        // Images
        if (options.images && article.images && article.images.length > 0) {
            for (const image of article.images) {
                try {
                    const imagePath = path.join(imagesFolderPath, image.path);
                    const imageBuffer = await fs.readFile(imagePath);
                    doc.image(imageBuffer, { fit: [400, 300], align: 'center' });
                    doc.moveDown();
                } catch (error) {
                    console.error('Error adding image to PDF:', error);
                }
            }
        }

        // Notes/Annotations
        if (options.notes && annotations && annotations.length > 0) {
            doc.fontSize(16).text(translations?.notes || 'Notes', { underline: true });
            doc.moveDown(0.5);
            annotations.forEach((annotation, index) => {
                doc.fontSize(12).text(ensureUTF8(`${index + 1}. ${annotation.note || annotation.quote || ''}`), { 
                    lineGap: 6,
                    width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
                    align: 'justify'
                });
                doc.moveDown(0.3);
            });
            doc.moveDown();
        }

        // Tags
        if (options.tags && tags && tags.length > 0) {
            doc.fontSize(16).text(translations?.tags || 'Tags', { underline: true });
            doc.moveDown(0.5);
            doc.fontSize(12).text(ensureUTF8(tags.map(tag => tag.name).join(', ')), { 
                lineGap: 6,
                width: doc.page.width - doc.page.margins.left - doc.page.margins.right
            });
            doc.moveDown();
        }

        // Related Articles
        if (options.relatedArticles && relatedArticles && relatedArticles.length > 0) {
            doc.fontSize(16).text(translations?.relatedArticles || 'Related Articles', { underline: true });
            doc.moveDown(0.5);
            relatedArticles.forEach((relatedArticle, index) => {
                doc.fontSize(12).text(ensureUTF8(`${index + 1}. ${relatedArticle.title}`), { 
                    lineGap: 6,
                    width: doc.page.width - doc.page.margins.left - doc.page.margins.right
                });
                doc.moveDown(0.3);
            });
            doc.moveDown();
        }

        // Collections
        if (options.collections && collections && collections.length > 0) {
            doc.fontSize(16).text(translations?.collections || 'Collections', { underline: true });
            doc.moveDown(0.5);
            doc.fontSize(12).text(ensureUTF8(collections.map(collection => collection.name).join(', ')), { 
                lineGap: 6,
                width: doc.page.width - doc.page.margins.left - doc.page.margins.right
            });
            doc.moveDown();
        }

        doc.moveDown(0.5);
    }

    doc.end();
    
    return new Promise((resolve, reject) => {
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
    });
}

// Generate merged Word document from multiple articles
async function generateMergedWordDocument(exportData, filePath) {
    const { articles, options, documentTitle, translations } = exportData;
    
    const children = [];

    // Document Title
    children.push(new Paragraph({
        children: [new TextRun({ text: documentTitle || 'Merged Articles', bold: true, size: 36, font: 'Arial' })],
        heading: HeadingLevel.TITLE,
        alignment: 'center',
        spacing: { after: 600 }
    }));

    // Process each article
    for (let i = 0; i < articles.length; i++) {
        const article = articles[i];
        
        // Add separator between articles (except for the first one)
        if (i > 0) {
            children.push(new Paragraph({ text: '' })); // Empty line
            children.push(new Paragraph({ text: '' })); // Empty line
            // Add horizontal line separator
            children.push(new Paragraph({
                children: [new TextRun({ text: '─'.repeat(50), color: 'CCCCCC' })],
                alignment: 'center',
                spacing: { before: 200, after: 200 }
            }));
        }

        // Article title
        children.push(new Paragraph({
            children: [new TextRun({ text: article.title || 'Untitled Article', bold: true, size: 28, font: 'Arial' })],
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 200, after: 300 }
        }));
        
        // Resolve IDs to full objects for this article (same as single export)
        const annotations = article.annotations ? await Promise.all(
            article.annotations.map(async ann => {
                if (typeof ann === 'object' && ann.note !== undefined) {
                    return ann;
                }
                return await annotationService.getAnnotationById(ann.id || ann);
            })
        ).then(results => results.filter(Boolean)) : [];
        
        const tags = article.tags ? await Promise.all(
            article.tags.map(async tag => {
                if (typeof tag === 'object' && tag.name !== undefined) {
                    return tag;
                }
                return await tagService.getTagWithId(tag.id || tag);
            })
        ).then(results => results.filter(Boolean)) : [];
        
        const collections = article.groups ? await Promise.all(
            article.groups.map(async group => {
                if (typeof group === 'object' && group.name !== undefined) {
                    return group;
                }
                return await groupService.getGroupById(group.id || group);
            })
        ).then(results => results.filter(Boolean)) : [];
        
        const relatedArticles = article.relatedArticles ? await Promise.all(
            article.relatedArticles.map(async rel => {
                const relId = typeof rel === 'object' ? rel.id : rel;
                return await getArticleById(relId);
            })
        ).then(results => results.filter(Boolean)) : [];
        
        const category = article.categoryId ? await categoryService.getCategoryById(article.categoryId) : null;
        const owner = article.ownerId ? await ownerService.getOwnerById(article.ownerId) : null;

        // COPY EXACT LOGIC FROM SINGLE ARTICLE EXPORT

        // Explanation
        if (options.explanation && article.explanation && !isHtmlStringEmpty(article.explanation)) {
            const formattedRuns = htmlToFormattedRuns(article.explanation);
            if (formattedRuns.length > 0) {
                formattedRuns.forEach((runs, index) => {
                    const italicRuns = runs.map(run => new TextRun({ 
                        ...run, 
                        italics: true, 
                        size: 22,
                        font: 'Arial'
                    }));
                    children.push(new Paragraph({
                        children: italicRuns,
                        spacing: { 
                            before: index === 0 ? 120 : 0, 
                            after: index === formattedRuns.length - 1 ? 120 : 60, 
                            line: 360, 
                            lineRule: 'auto' 
                        }
                    }));
                });
            }
        }

        // Main Text
        if (options.mainText && article.text && !isHtmlStringEmpty(article.text)) {
            const formattedRuns = htmlToFormattedRuns(article.text);
            if (formattedRuns.length > 0) {
                formattedRuns.forEach((runs, index) => {
                    children.push(new Paragraph({
                        children: runs,
                        spacing: { 
                            after: index === formattedRuns.length - 1 ? 120 : 60, 
                            line: 360, 
                            lineRule: 'auto' 
                        }
                    }));
                });
            }
        }

        // Comment
        if (options.comment && article.comments && article.comments.length > 0 && !isHtmlStringEmpty(article.comments[0]?.text)) {
            const formattedRuns = htmlToFormattedRuns(article.comments[0].text);
            if (formattedRuns.length > 0) {
                children.push(new Paragraph({
                    children: [new TextRun({ text: translations?.comment || 'Comment', bold: true, size: 24, font: 'Arial' })],
                    heading: HeadingLevel.HEADING_1,
                    spacing: { before: 300, after: 200 }
                }));
                formattedRuns.forEach((runs, index) => {
                    children.push(new Paragraph({
                        children: runs,
                        spacing: { 
                            after: index === formattedRuns.length - 1 ? 120 : 60, 
                            line: 360, 
                            lineRule: 'auto' 
                        }
                    }));
                });
            }
        }

        // Images
        if (options.images && article.images && article.images.length > 0) {
            for (const image of article.images) {
                try {
                    const imagePath = path.join(imagesFolderPath, image.path);
                    const imageBuffer = await fs.readFile(imagePath);
                    children.push(new Paragraph({
                        children: [new ImageRun({
                            data: imageBuffer,
                            transformation: {
                                width: 500,
                                height: 400,
                            },
                        })],
                        alignment: 'center',
                        spacing: { before: 200, after: 200 }
                    }));
                } catch (error) {
                    console.error('Error adding image to Word:', error);
                }
            }
        }

        // Notes/Annotations
        if (options.notes && annotations && annotations.length > 0) {
            children.push(new Paragraph({
                children: [new TextRun({ text: translations?.notes || 'Notes', bold: true, size: 24, font: 'Arial' })],
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 300, after: 200 }
            }));
            annotations.forEach((annotation, index) => {
                children.push(new Paragraph({
                    children: [new TextRun({ text: `${index + 1}. ${annotation.note || annotation.quote || ''}`, font: 'Arial' })],
                    spacing: { line: 360, lineRule: 'auto' }
                }));
            });
            children.push(new Paragraph({ text: '' })); // Empty line
        }

        // Tags
        if (options.tags && tags && tags.length > 0) {
            children.push(new Paragraph({
                children: [new TextRun({ text: translations?.tags || 'Tags', bold: true, size: 24, font: 'Arial' })],
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 300, after: 200 }
            }));
            children.push(new Paragraph({
                children: [new TextRun({ text: tags.map(tag => tag.name).join(', '), font: 'Arial' })],
                spacing: { line: 360, lineRule: 'auto' }
            }));
            children.push(new Paragraph({ text: '' })); // Empty line
        }

        // Related Articles
        if (options.relatedArticles && relatedArticles && relatedArticles.length > 0) {
            children.push(new Paragraph({
                children: [new TextRun({ text: translations?.relatedArticles || 'Related Articles', bold: true, size: 24, font: 'Arial' })],
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 300, after: 200 }
            }));
            relatedArticles.forEach((relatedArticle, index) => {
                children.push(new Paragraph({
                    children: [new TextRun({ text: `${index + 1}. ${relatedArticle.title}`, font: 'Arial' })],
                    spacing: { line: 360, lineRule: 'auto' }
                }));
            });
            children.push(new Paragraph({ text: '' })); // Empty line
        }

        // Collections
        if (options.collections && collections && collections.length > 0) {
            children.push(new Paragraph({
                children: [new TextRun({ text: translations?.collections || 'Collections', bold: true, size: 24, font: 'Arial' })],
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 300, after: 200 }
            }));
            children.push(new Paragraph({
                children: [new TextRun({ text: collections.map(collection => collection.name).join(', '), font: 'Arial' })],
                spacing: { line: 360, lineRule: 'auto' }
            }));
        }

        // Add spacing at the end
        children.push(new Paragraph({ text: '' }));
    }

    // Create and save document
    const doc = new Document({ sections: [{ children }] });
    const buffer = await Packer.toBuffer(doc);
    await fs.writeFile(filePath, buffer);
}

// Export multiple articles as a merged document
async function exportMultipleArticles(exportData) {
    const { articles, options, documentTitle, translations } = exportData;
    
    if (!articles || articles.length === 0) {
        return { success: false, error: 'No articles provided' };
    }

    try {
        // Get full articles with resolved data, just like single article export
        const fullArticles = [];
        for (const article of articles) {
            let fullArticle;
            if (typeof article === 'string' || typeof article === 'number') {
                fullArticle = await getArticleById(article);
            } else {
                fullArticle = article;
            }
            if (fullArticle) {
                fullArticles.push(fullArticle);
            }
        }

        // Show save dialog
        const result = await dialog.showSaveDialog({
            title: 'Save Merged Articles',
            defaultPath: `${documentTitle || 'Merged Articles'}.${options.format}`,
            filters: [
                options.format === 'pdf' 
                    ? { name: 'PDF Files', extensions: ['pdf'] }
                    : { name: 'Word Documents', extensions: ['docx'] }
            ]
        });

        if (result.canceled) {
            return { success: false, canceled: true };
        }

        // Update export data with full articles
        const updatedExportData = {
            ...exportData,
            articles: fullArticles
        };

        // Generate the merged document
        if (options.format === 'pdf') {
            await generateMergedPDF(updatedExportData, result.filePath);
        } else {
            await generateMergedWordDocument(updatedExportData, result.filePath);
        }

        return { success: true, filePath: result.filePath };
    } catch (error) {
        console.error('Export multiple articles failed:', error);
        return { success: false, error: error.message };
    }
}

export default ArticleService;