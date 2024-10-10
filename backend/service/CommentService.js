const { ipcMain } = require('electron');
const { Op } = require("sequelize");
const { sequelize } = require("../sequelize");

function initService() {
    ipcMain.handle('comment/updateText', (event, id, newText) => updateText(id, newText));
    ipcMain.handle('comment/getById', (event, id) => getById(id));

    ipcMain.handle('addComment', (event, commentText) => addComment(commentText));
    ipcMain.handle('getCommentById', (event, commentId) => getById(commentId));
    ipcMain.handle('getCommentsWithTextLike', (event, textLike) => getCommentsWithTextLike(textLike));
    ipcMain.handle('getAllComments', getAllComments);
    ipcMain.handle('deleteCommentById', (event, commentId) => deleteCommentById(commentId));
}

async function updateText(commentId, newText) {
    try {
        await sequelize.models.comment.update(
            {
                text: newText.html,
                textJson: newText.json
            },
            { where: { id: commentId } }
        );

    } catch (error) {
        console.error('Error in commentService updateText()', error);
    }
}



async function addComment(commentText) {
    const result = await sequelize.models.comment.create({ text: commentText });
    return result;   
}

async function getById(commentId) {
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
