const { ipcMain } = require('electron');
const { Op } = require("sequelize");
const { sequelize } = require("../sequelize");

function initService() {
    ipcMain.handle('addComment', (event, commentText) => addComment(commentText));
    ipcMain.handle('updateCommentText', (event, commentId, newText) => updateCommentText(commentId, newText));
    ipcMain.handle('getCommentById', (event, commentId) => getCommentById(commentId));
    ipcMain.handle('getCommentsWithTextLike', (event, textLike) => getCommentsWithTextLike(textLike));
    ipcMain.handle('getAllComments', getAllComments);
    ipcMain.handle('deleteCommentById', (event, commentId) => deleteCommentById(commentId));
}

async function addComment(commentText) {
    const result = await sequelize.models.comment.create({ text: commentText });
    return result;   
}

async function updateCommentText(commentId, newText) {
    const comment = await sequelize.models.comment.findByPk(commentId);
    if (!comment) {
        throw new Error(`Comment with ID ${commentId} not found`);
    }
    const result = await comment.update({ text: newText });
    return result.dataValues;
}

async function getCommentById(commentId) {
    const result = await sequelize.models.comment.findByPk(commentId);
    return result ? result.dataValues : null;
}

async function getCommentsWithTextLike(textLike) {
    const result = await sequelize.models.comment.findAll({
        where: {
            text: {
                [Op.like]: `%${textLike}%`
            }
        }
    });
    return result.map(item => item.dataValues);
}

async function getAllComments() {
    const result = await sequelize.models.comment.findAll();
    return result.map(item => item.dataValues);
}

async function deleteCommentById(commentId) {
    const comment = await sequelize.models.comment.findByPk(commentId);
    if (!comment) {
        throw new Error(`Comment with ID ${commentId} not found`);
    }
    await comment.destroy();
    return getAllComments();
}

module.exports = {
    addComment,
    initService
};
