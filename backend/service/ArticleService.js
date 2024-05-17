const { ipcMain } = require('electron')
const { Op } = require("sequelize");
const { sequelize } = require("../sequelize");

function initService() {
    ipcMain.handle('addArticle', (event, article) => addArticle(article));
    ipcMain.handle('updateArticle', (event, articleId, article) => updateArticle(articleId, article));
    ipcMain.handle('getArticleWithId', (event, articleId) => getArticleWithId(articleId));
    ipcMain.handle('getArticleWithTitleLike', (event, titleLike) => getArticleWithTitleLike(titleLike));
    ipcMain.handle('getAllArticlesOfOwnerName', (event, ownerName) => getAllArticlesOfOwnerName(ownerName));
    ipcMain.handle('getAllArticles', (event) => getAllArticles());
}

async function addArticle(article) {
    const result = await sequelize.models.article.create(article);
    return result.dataValues;
}

async function updateArticle(articleId, newArticle) {
    const article = await sequelize.models.article.findByPk(articleId);
    const result = await article.update(newArticle);
    return result.dataValues;
}

async function getArticleWithId(articleId) {
    const result = await sequelize.models.article.findByPk(articleId);
    return result.dataValues; 
}

async function getArticleWithTitleLike(titleLike) {
    const result = await sequelize.models.article.findAll({
        where: {
            title: {
                [Op.like]: '%' + titleLike + '%'
            }
        }
    });
    return result.map(item => item.dataValues);
}

async function getAllArticlesOfOwnerName(ownerName) {
    const result = await sequelize.models.article.findAll({
        where: {
            owner: {name: ownerName}
        }
    });
    return result.map(item => item.dataValues);
}


async function getAllArticles() {
    const result = await sequelize.models.article.findAll();
    return result.map(item => item.dataValues);
}

async function deleteTagWithName(tagName) {
    await sequelize.models.tag.destroy({ where: { name: tagName } });
    return getAllTags();
}

module.exports = initService;