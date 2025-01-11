const fs = require('fs-extra');
const path = require('path');
const { ipcMain, dialog } = require('electron')

const { config, changeDbBackupFolderPath } = require('../config');
const { mainWindow } = require('../main');
const { log, error, warn } = require('../logger');

function initService() {
    ipcMain.handle('DB/handleExport', () => handleExport());
    ipcMain.handle('DB/handleImport', () => handleImport());
    ipcMain.handle('DB/handleBackup', () => handleBackup());
    ipcMain.handle('DB/changeBackupDir', () => handleChangeBackupDir());
    ipcMain.handle('DB/getBackupDir', () => getBackupDir());
}

async function handleExport() {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory'], // Open directory selection dialog
    });

    log('Exporting database to ', result.filePaths[0]);

    if (result.canceled) {
        log('Export cancelled');
        return;
    }

    const dbDir = path.dirname(config.contentDbPath);
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
    const dirForOriginal = path.join(config.dbBackupFolderPath, `data-${dateTime}`);
    const dirOfNewData = result.filePaths[0];
    const dirOfActive = path.dirname(config.contentDbPath);
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

async function handleBackup() {
    const dateTime = new Date().toISOString().replace(/[:.]/g, '-');
    const targetDir = path.join(config.dbBackupFolderPath, `data-${dateTime}`);
    const dbDir = path.dirname(config.contentDbPath);
    try {
        await fs.copy(dbDir, targetDir);
        log(`Database copied from ${dbDir} to ${targetDir}`);
        return targetDir;
    } catch (err) {
        error('Error in DBService handleBackup ', err);
        throw err;
    }
}

async function handleChangeBackupDir() {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory'], // Open directory selection dialog
    });

    log('Changeing backup dir to ', result.filePaths[0]);

    if (result.canceled) {
        log('Change cancelled');
        return;
    }

    changeDbBackupFolderPath(result.filePaths[0]);
    return config.dbBackupFolderPath;
}

function getBackupDir() {
    return config.dbBackupFolderPath;
}

module.exports = {
    initService,
};
