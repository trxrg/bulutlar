const fs = require('fs-extra');
const path = require('path');
const { ipcMain, dialog } = require('electron')

const config = require('../config');
const { mainWindow } = require('../main');
const { log, error, warn } = require('../logger');

function initService() {
    ipcMain.handle('DB/handleExport', () => handleExport());
}

const dbDir = path.dirname(config.dbPath);

async function handleExport() {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory'], // Open directory selection dialog
    });

    log('Exporting database to ', result.filePaths[0]);

    if (result.canceled) {
        log('Export cancelled');
        return;
    }

    const dateTime = new Date().toISOString().replace(/[:.]/g, '-');
    const dir = path.join(result.filePaths[0], `data-${dateTime}`);
    try {
        await fs.copy(dbDir, dir);
        log(`Database copied from ${dbDir} to ${dir}`);
        return dir;
    } catch (err) {
        error('Error in DBService handleExport ', err);
        throw err;
    }
}

module.exports = {
    initService,
};
