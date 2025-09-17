import { ipcMain } from 'electron';
import { sequelize } from "../sequelize/index.js";

function initService() {
    ipcMain.handle('category/create', (event, category) => createCategory(category));
    ipcMain.handle('category/updateName', (event, id, newName) => updateCategoryName(id, newName));
    ipcMain.handle('category/updateColor', (event, id, newColor) => updateCategoryColor(id, newColor));
    ipcMain.handle('category/getAll', getAllCategories);
    ipcMain.handle('category/getById', (event, id) => getCategoryById(id));
    ipcMain.handle('category/deleteById', (event, id) => deleteCategoryById(id));
}

async function createCategory(category) {
    try {
        const result = await sequelize.models.category.create({ name: category.name.trim(), color: category.color });
        return result.dataValues;
    } catch (e) {
        return {error: e};
    }
}

async function updateCategoryName(categoryId, newName) {
    try {
        const category = await sequelize.models.category.findByPk(categoryId);
        const result = await category.update({ name: newName });
        return result.dataValues;
    } catch (e) {
        console.error('Error updating category name:', e);
        return {error: e};
    }
}

async function updateCategoryColor(categoryId, newColor) {
    try {
        const category = await sequelize.models.category.findByPk(categoryId);
        const result = await category.update({ color: newColor });
        return result.dataValues;
    } catch (e) {
        console.error('Error updating category color:', e);
        return {error: e};
    }
}

async function getCategoryById(id) {
    const result = await sequelize.models.category.findByPk(id, {
        attributes: {
            include: [
                [sequelize.fn('COUNT', sequelize.col('articles.id')), 'articleCount'],
            ]
        },
        include: [
            {
                model: sequelize.models.article,
                as: 'articles',
                attributes: [], // We don't need any attributes from Article
            },
        ],
        group: ['Category.id'], // Group by Category ID
    });
    if (!result)
        return {error: 'Category not found'};
    return result.dataValues;
}

async function deleteCategoryById(id) {

    try {
        const category = await sequelize.models.category.findByPk(id);
        const articleCount = await category.countArticles();
        
        if (articleCount > 0)
            throw ('Cannot delete category with articles');
        
        if (!category)
            throw ('no category found with id: ' + id);

        await category.destroy();

    } catch (err) {
        console.error('Error in deleteCategory', err);
    }
}

async function getCategoryWithName(categoryName, transaction) {
    return await sequelize.models.category.findOne({ where: { name: categoryName }, transaction });
}

async function getCategoryWithNameAddIfNotPresent(categoryName, transaction = null) {

    let result = await getCategoryWithName(categoryName, transaction);
    if (!result)
        result = await sequelize.models.category.create({ name: categoryName }, { transaction });

    return result;
}

async function getAllCategories() {
    const result = await sequelize.models.category.findAll({
        attributes: {
            include: [
                [sequelize.fn('COUNT', sequelize.col('articles.id')), 'articleCount'],
            ]
        },
        include: [
            {
                model: sequelize.models.article,
                as: 'articles',
                attributes: [], // We don't need any attributes from Article
            },
        ],
        group: ['Category.id'], // Group by Category ID
    });
    return result.map(item => item.dataValues);
}

const CategoryService = {
    addCategory: createCategory,
    getCategoryWithNameAddIfNotPresent,
    getCategoryById,
    initService
};

export default CategoryService;