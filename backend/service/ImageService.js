import { ipcMain } from 'electron';
import { sequelize } from '../sequelize/index.js';
import { ensureFolderExists } from '../fsOps.js';
import path from 'path';
import fs from 'fs/promises';
import { config } from '../config.js';

let imagesFolderPath;
let publicFolderPath;

function initService() {
    ipcMain.handle('image/getDataById', (event, id) => getImageDataById(id));
    ipcMain.handle('image/getDataByPath', (event, path) => getImageDataByPath(path));
    ipcMain.handle('image/getDataByAnyPath', (event, path, type) => getImageDataFromPublic(path, type));
    ipcMain.handle('image/deleteById', (event, id) => deleteImageById(id));
    
    publicFolderPath = config.publicFolderPath;
    imagesFolderPath = config.imagesFolderPath;
    ensureFolderExists(imagesFolderPath);

    console.info('ImageService initialized');
    console.info('Resolved imagesFolderPath:', imagesFolderPath);
}

async function createImage(image, transaction = null) {
    try {
        const relPath = path.join(image.name + '_' + Date.now());
        const absPath = path.join(imagesFolderPath, relPath);

        console.info('Copying file from:', image.path);
        console.info('Copying file to:', absPath);
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

async function getImageDataFromPublic(relPath, imageType) {
    try {
        const absPath = path.join(publicFolderPath, relPath);
        const fileData = await fs.readFile(absPath, 'base64');
        
        return `data:${imageType};base64,${fileData}`;
    } catch (err) {
        console.error('Error in getImageDataByAnyPath', err);
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
    return path.join(imagesFolderPath, imagePath);
}

const ImageService = {
    initService,
    createImage,
    deleteImagesByArticleId,
};

export default ImageService;
