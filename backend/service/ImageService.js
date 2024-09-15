const { ipcMain } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const { sequelize } = require("../sequelize");

function initService() {
    ipcMain.handle('image/deleteImage', (event, imageId) => deleteImage(imageId));
    ipcMain.handle('image/getImageData', (event, image) => getImageData(image));
}

async function createImage(image) {
    try {
        const destinationPath = path.join(__dirname, '../../data/images', image.name)

        await fs.copyFile(image.path, destinationPath);

        const result = await sequelize.models.image.create({
            name: image.name,
            type: image.type,
            path: destinationPath,
            size: image.size,
            description: image.name
        });

        return result;

    } catch (err) {
        console.error('Error in createImage ', err);
    }
}

async function getImageData(imageId) {
    const image = await sequelize.models.image.findByPk(imageId);
    const fileData = await fs.readFile(image.path, 'base64');
    return `data:${image.type};base64,${fileData}`;
}

async function deleteImage(imageId) {

    try {
        const image = await sequelize.models.image.findByPk(imageId);

        if (!image)
            throw ('no image found with id: ' + imageId);

        fs.unlink(image.path);

        await image.destroy();

    } catch (err) {
        console.error('Error in deleteImage', err);
    }
}

module.exports = {
    initService,
    createImage,
};
