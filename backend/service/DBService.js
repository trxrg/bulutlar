const fs = require('fs-extra');
const path = require('path');
const { ipcMain, dialog } = require('electron')

const { mainWindow } = require('../main');
const { initDB, stopSequelize, startSequelize } = require("../sequelize");
const { config, changeDbBackupFolderPath } = require('../config');

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

    console.info('Exporting database to ', result.filePaths[0]);

    if (result.canceled) {
        console.info('Export cancelled');
        return;
    }

    const dbDir = path.dirname(config.contentDbPath);
    const dateTime = new Date().toISOString().replace(/[:.]/g, '-');
    const dir = path.join(result.filePaths[0], `data-${dateTime}`);
    try {
        await fs.copy(dbDir, dir);
        console.info(`Database copied from ${dbDir} to ${dir}`);
        return dir;
    } catch (err) {
        console.error('Error in DBService handleExport ', err);
        throw err;
    }
}

async function handleImport() {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory'], // Open directory selection dialog
    });

    console.info('Importing database from ', result.filePaths[0]);

    if (result.canceled) {
        console.info('Import cancelled');
        return;
    }

    
    const dirOfNewData = result.filePaths[0];
    const dirOfActive = path.dirname(config.contentDbPath);
    try {
        // backup current db before importing new one
        await handleBackup();
        await stopSequelize(); // we can stop sequelize
        await fs.copy(dirOfNewData, dirOfActive); // we can copy the files
        console.info(`Imported database copied from ${dirOfNewData}`);
        startSequelize(); // TODO problem in restarting sequelize
        return dirOfNewData;
    } catch (err) {
        console.error('Error in DBService handleImport ', err);
        throw err;
    }
}

async function handleBackup() {
    const dateTime = new Date().toISOString().replace(/[:.]/g, '-');
    const targetDir = path.join(config.dbBackupFolderPath, `data-${dateTime}`);
    const dbDir = path.dirname(config.contentDbPath);
    try {
        await fs.copy(dbDir, targetDir);
        console.info(`Original database backed up to ${targetDir}`);
        return targetDir;
    } catch (err) {
        console.error('Error in DBService handleBackup ', err);
        throw err;
    }
}

async function handleChangeBackupDir() {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory'], // Open directory selection dialog
    });

    console.info('Changeing backup dir to ', result.filePaths[0]);

    if (result.canceled) {
        console.info('Change cancelled');
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
