const { ipcMain } = require('electron');
const { sequelize } = require("../sequelize");

function initService() {
    ipcMain.handle('image/deleteImage', (event, imageId) => deleteImage(imageId));
}

async function createImage(image) {
    const result = await sequelize.models.image.create(image);
    return result;
}

module.exports = {
    initService,
    createImage,
};
