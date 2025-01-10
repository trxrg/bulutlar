const fs = require('fs-extra');
const path = require('path');
const { ipcMain, dialog } = require('electron')

const config = require('../config');
const { mainWindow } = require('../main');
const { log, error, warn } = require('../logger');

function initService() {
    ipcMain.handle('DB/handleExport', () => handleExport());
    ipcMain.handle('DB/handleImport', () => handleImport());
}

const dbDir = path.dirname(config.dbPath);
const dbBackupDir = config.dbBackupFolderPath;

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

async function handleImport() {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory'], // Open directory selection dialog
    });

    log('Importing database from ', result.filePaths[0]);

    if (result.canceled) {
        log('Import cancelled');
        return;
    }

    const dateTime = new Date().toISOString().replace(/[:.]/g, '-');
    const dirForOriginal = path.join(dbBackupDir, `data-${dateTime}`);
    const dirOfNewData = result.filePaths[0];
    const dirOfActive = dbDir;
    try {
        await fs.copy(dirOfActive, dirForOriginal);
        log(`Original database copied from ${dirOfActive} to ${dirForOriginal}`);
        await fs.copy(dirOfNewData, dirOfActive);
        log(`Imported database copied from ${dirOfNewData} to ${dirOfActive}`);
        return dirOfNewData;
    } catch (err) {
        error('Error in DBService handleImport ', err);
        throw err;
    }
}

module.exports = {
    initService,
};
