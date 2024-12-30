const { ipcMain, dialog } = require('electron')
const fs = require('fs-extra');
const path = require('path');
const { mainWindow } = require('../main');

function initService() {
    ipcMain.handle('DB/handleExport', () => handleExport());
}

const dbDir = path.join(__dirname, '/../../data');

async function handleExport() {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory'], // Open directory selection dialog
    });

    console.log('Exporting database to ', result.filePaths[0]);
    
    if (result.canceled) {
        console.log('Export cancelled');
        return;
    }

    const dateTime = new Date().toISOString().replace(/[:.]/g, '-');
    const dir = path.join(result.filePaths[0], `data-${dateTime}`);
    try {
        await fs.copy(dbDir, dir);
        console.log(`Database copied from ${dbDir} to ${dir}`);
        return dir;
    } catch (err) {
        console.error('Error in DBService handleExport ', err);
        throw err;
    }
}

module.exports = {
    initService,
};
