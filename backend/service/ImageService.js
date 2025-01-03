const { app, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const { sequelize } = require("../sequelize");

function initService() {
    ipcMain.handle('image/getDataById', (event, id) => getImageDataById(id));
    ipcMain.handle('image/getDataByPath', (event, path) => getImageDataByPath(path));
    ipcMain.handle('image/deleteById', (event, id) => deleteImageById(id));
}

async function createImage(image, transaction = null) {
    try {
        const imagesFolderPath = getImagesFolderAbsPath();
        await fs.mkdir(imagesFolderPath, { recursive: true });
        
        const relPath = path.join(image.name + '_' + Date.now());
        const absPath = path.join(imagesFolderPath, relPath);

        await fs.copyFile(image.path, absPath);

        const result = await sequelize.models.image.create({
            name: image.name,
            type: image.type,
            path: relPath,
            size: image.size,
            description: image.name
        }, { transaction });

        return result;

    } catch (err) {
        console.error('Error in createImage ', err);
    }
}

async function getImageDataById(imageId) {
    try {
        const image = await sequelize.models.image.findByPk(imageId);

        if (!image)
            throw ('no image found with id: ' + imageId);

        const fileData = await fs.readFile(getImageAbsPath(image.path), 'base64');

        return `data:${image.type};base64,${fileData}`;
    } catch (err) {
        console.error('Error in getImageData', err);
    }    
}

async function getImageDataByPath(image) {
    try {
        const fileData = await fs.readFile(getImageAbsPath(image.path), 'base64');

        return `data:${image.type};base64,${fileData}`;
    } catch (err) {
        console.error('Error in getImageDataByPath', err);
    }    
}

async function deleteImageById(imageId) {

    try {
        const image = await sequelize.models.image.findByPk(imageId);

        if (!image)
            throw ('no image found with id: ' + imageId);

        fs.unlink(getImageAbsPath(image.path));

        await image.destroy();

    } catch (err) {
        console.error('Error in deleteImage', err);
    }
}

async function deleteImagesByArticleId(articleId) {
    try {
        const images = await sequelize.models.image.findAll({ where: { articleId } });

        for (const image of images)
            await deleteImageById(image.id);

    } catch (err) {
        console.error('Error in deleteImagesByArticleId', err);
    }
}

function getImageAbsPath(imagePath) {
    return path.join(getImagesFolderAbsPath(), imagePath);
}

function getImagesFolderAbsPath() {
    const isDev = app.isPackaged ? false : require('electron-is-dev');
    if (isDev)
        return path.join(__dirname, '/../../data');    
    else 
        return path.join('./data');
}

module.exports = {
    initService,
    createImage,
    deleteImagesByArticleId,
};
