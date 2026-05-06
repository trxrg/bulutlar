import { ipcMain, dialog } from 'electron';
import { sequelize } from '../sequelize/index.js';
import { ensureFolderExists } from '../fsOps.js';
import path from 'path';
import fs from 'fs/promises';
import { config } from '../config.js';
import { mainWindow } from '../main.js';
import { safeUnlink } from '../sync/outbox.js';

let imagesFolderPath;
let publicFolderPath;

function initService() {
    ipcMain.handle('image/getDataById', (event, id) => getImageDataById(id));
    ipcMain.handle('image/getDataByPath', (event, path) => getImageDataByPath(path));
    ipcMain.handle('image/getDataByAnyPath', (event, path, type) => getImageDataFromPublic(path, type));
    ipcMain.handle('image/deleteById', (event, id) => deleteImageById(id));
    ipcMain.handle('image/download', (event, id) => downloadImageById(id));
    
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
            description: image.description || image.name
        }, { transaction });

        return result;

    } catch (err) {
        console.error('Error in createImage ', err);
    }
}

async function createImageFromBuffer(image, transaction = null) {
    try {
        const relPath = path.join(image.name + '_' + Date.now());
        const absPath = path.join(imagesFolderPath, relPath);

        const buffer = Buffer.isBuffer(image.buffer)
            ? image.buffer
            : Buffer.from(image.buffer);

        console.info('Writing buffer to:', absPath, 'size:', buffer.length);
        await fs.writeFile(absPath, buffer);

        const result = await sequelize.models.image.create({
            name: image.name,
            type: image.type,
            path: relPath,
            size: image.size != null ? image.size : buffer.length,
            description: image.description || image.name
        }, { transaction });

        return result;

    } catch (err) {
        console.error('Error in createImageFromBuffer ', err);
        throw err;
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

// Internal: unlink the file BEFORE the DB destroy and thread the caller's
// transaction so the destroy fires the afterDestroy hook (and its outbox
// append) inside the same tx. A non-ENOENT unlink failure throws, aborting
// the caller's transaction and leaving the row in place.
async function deleteImageEntity(image, { transaction } = {}) {
    await safeUnlink(getImageAbsPath(image.path));
    await image.destroy({ transaction });
}

async function deleteImageById(imageId) {
    const image = await sequelize.models.image.findByPk(imageId);
    if (!image)
        throw new Error('no image found with id: ' + imageId);

    const tx = await sequelize.transaction();
    try {
        await deleteImageEntity(image, { transaction: tx });
        await tx.commit();
    } catch (err) {
        await tx.rollback();
        throw err;
    }
}

async function deleteImagesByArticleId(articleId, { transaction } = {}) {
    const images = await sequelize.models.image.findAll({
        where: { articleId },
        transaction,
    });
    for (const image of images)
        await deleteImageEntity(image, { transaction });
}

async function downloadImageById(imageId) {
    try {
        const image = await sequelize.models.image.findByPk(imageId);

        if (!image)
            throw new Error('No image found with id: ' + imageId);

        // Show save dialog
        const result = await dialog.showSaveDialog(mainWindow, {
            title: 'Save Image',
            defaultPath: image.name || 'image',
            filters: [
                { name: 'Image Files', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'] },
                { name: 'All Files', extensions: ['*'] }
            ]
        });

        if (!result.canceled && result.filePath) {
            // Copy file to selected location
            const sourcePath = getImageAbsPath(image.path);
            await fs.copyFile(sourcePath, result.filePath);
            return { success: true, filePath: result.filePath };
        }

        return { success: false, canceled: true };

    } catch (err) {
        console.error('Error in downloadImageById', err);
        throw err;
    }
}

function getImageAbsPath(imagePath) {
    return path.join(imagesFolderPath, imagePath);
}

const ImageService = {
    initService,
    createImage,
    createImageFromBuffer,
    deleteImagesByArticleId,
};

export default ImageService;
