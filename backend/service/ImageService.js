const { ipcMain } = require('electron');
const { sequelize } = require("../sequelize");
const { ensureFolderExists } = require('../fsOps');
const path = require('path');
const fs = require('fs').promises;
const { config } = require('../config.js');
const { log, error, warn } = require('../logger');

const imagesFolderPath = config.imagesFolderPath;
ensureFolderExists(imagesFolderPath);

log('Resolved imagesFolderPath:', imagesFolderPath);

function initService() {
    ipcMain.handle('image/getDataById', (event, id) => getImageDataById(id));
    ipcMain.handle('image/getDataByPath', (event, path) => getImageDataByPath(path));
    ipcMain.handle('image/deleteById', (event, id) => deleteImageById(id));
}

async function createImage(image, transaction = null) {
    try {
        const relPath = path.join(image.name + '_' + Date.now());
        const absPath = path.join(imagesFolderPath, relPath);

        log('Copying file from:', image.path);
        log('Copying file to:', absPath);
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
        error('Error in createImage ', err);
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
        error('Error in getImageData', err);
    }
}

async function getImageDataByPath(image) {
    try {
        const fileData = await fs.readFile(getImageAbsPath(image.path), 'base64');

        return `data:${image.type};base64,${fileData}`;
    } catch (err) {
        error('Error in getImageDataByPath', err);
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
        error('Error in deleteImage', err);
    }
}

async function deleteImagesByArticleId(articleId) {
    try {
        const images = await sequelize.models.image.findAll({ where: { articleId } });

        for (const image of images)
            await deleteImageById(image.id);

    } catch (err) {
        error('Error in deleteImagesByArticleId', err);
    }
}

function getImageAbsPath(imagePath) {
    return path.join(imagesFolderPath, imagePath);
}

module.exports = {
    initService,
    createImage,
    deleteImagesByArticleId,
};
