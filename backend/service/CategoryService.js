const { ipcMain } = require('electron');
const { Op } = require("sequelize");
const { sequelize } = require("../sequelize");

function initService() {
    ipcMain.handle('addCategory', (event, categoryName) => addCategory(categoryName));
    ipcMain.handle('updateCategoryName', (event, categoryName, newName) => updateCategoryName(categoryName, newName));
    ipcMain.handle('getCategoryWithName', (event, categoryName) => getCategoryWithName(categoryName));
    ipcMain.handle('getCategoryWithNameAddIfNotPresent', (event, categoryName) => getCategoryWithNameAddIfNotPresent(categoryName));
    ipcMain.handle('getCategoryWithNameLike', (event, nameLike) => getCategoryWithNameLike(nameLike));
    ipcMain.handle('getCategoryWithId', (event, id) => getCategoryWithId(id));
    ipcMain.handle('getAllCategories', getAllCategories);
    ipcMain.handle('deleteCategoryWithName', (event, categoryName) => deleteCategoryWithName(categoryName));
}

async function addCategory(categoryName) {
    const result = await sequelize.models.category.create({ name: categoryName });
    return result.dataValues;    
}

async function updateCategoryName(categoryName, newName) {
    const category = await sequelize.models.category.findOne({ where: { name: categoryName } });
    const result = await category.update({ name: newName });
    return result.dataValues;
}

async function getCategoryWithName(categoryName) {
    return await sequelize.models.category.findOne({ where: { name: categoryName } }); 
}

async function getCategoryWithNameAddIfNotPresent(categoryName) {

    let result = await getCategoryWithName(categoryName); 
    if (!result)
        result = await sequelize.models.category.create({ name: categoryName });

    return result;
}

async function getCategoryWithNameLike(nameLike) {
    const result = await sequelize.models.category.findAll({
        where: {
            name: {
                [Op.like]: '%' + nameLike + '%'
            }
        }
    });
    return result.map(item => item.dataValues);
}

async function getCategoryWithId(id) {
    const result = await sequelize.models.category.findByPk(id);
    return result.dataValues;
}

async function getAllCategories() {
    const result = await sequelize.models.category.findAll();
    return result.map(item => item.dataValues);
}

async function deleteCategoryWithName(categoryName) {
    await sequelize.models.category.destroy({ where: { name: categoryName } });
    return getAllCategories();
}

module.exports = {
    addCategory,
    getCategoryWithNameAddIfNotPresent,
    initService
};
