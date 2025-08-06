import { ipcMain, dialog } from 'electron';
import { sequelize } from '../sequelize/index.js';
import { ensureFolderExists } from '../fsOps.js';
import path from 'path';
import fs from 'fs/promises';
import { config } from '../config.js';
import { mainWindow } from '../main.js';

let audiosFolderPath;
let publicFolderPath;

function initService() {
    ipcMain.handle('audio/getDataById', (event, id) => getAudioDataById(id));
    ipcMain.handle('audio/getDataByPath', (event, path) => getAudioDataByPath(path));
    ipcMain.handle('audio/getDataByAnyPath', (event, path, type) => getAudioDataFromPublic(path, type));
    ipcMain.handle('audio/deleteById', (event, id) => deleteAudioById(id));
    ipcMain.handle('audio/download', (event, id) => downloadAudioById(id));
    
    publicFolderPath = config.publicFolderPath;
    audiosFolderPath = config.audiosFolderPath;
    ensureFolderExists(audiosFolderPath);

    console.info('AudioService initialized');
    console.info('Resolved audiosFolderPath:', audiosFolderPath);
}

async function createAudio(audio, transaction = null) {
    try {
        const relPath = path.join(audio.name + '_' + Date.now());
        const absPath = path.join(audiosFolderPath, relPath);

        console.info('Copying file from:', audio.path);
        console.info('Copying file to:', absPath);
        await fs.copyFile(audio.path, absPath);

        const result = await sequelize.models.audio.create({
            name: audio.name,
            type: audio.type,
            path: relPath,
            size: audio.size,
            description: audio.name,
            duration: audio.duration
        }, { transaction });

        return result;

    } catch (err) {
        console.error('Error in createAudio ', err);
    }
}

async function getAudioDataById(audioId) {
    try {
        const audio = await sequelize.models.audio.findByPk(audioId);

        if (!audio)
            throw ('no audio found with id: ' + audioId);

        // Return the absolute file path for streaming instead of base64
        return getAudioAbsPath(audio.path);
    } catch (err) {
        console.error('Error in getAudioData', err);
    }
}

async function getAudioDataByPath(audio) {
    try {
        // Return the absolute file path for streaming
        return getAudioAbsPath(audio.path);
    } catch (err) {
        console.error('Error in getAudioDataByPath', err);
    }
}

async function getAudioDataFromPublic(relPath, audioType) {
    try {
        const absPath = path.join(publicFolderPath, relPath);
        const fileData = await fs.readFile(absPath, 'base64');
        
        return `data:${audioType};base64,${fileData}`;
    } catch (err) {
        console.error('Error in getAudioDataByAnyPath', err);
    }
}

async function deleteAudioById(audioId) {

    try {
        const audio = await sequelize.models.audio.findByPk(audioId);

        if (!audio)
            throw ('no audio found with id: ' + audioId);

        fs.unlink(getAudioAbsPath(audio.path));

        await audio.destroy();

    } catch (err) {
        console.error('Error in deleteAudio', err);
    }
}

async function deleteAudiosByArticleId(articleId) {
    try {
        const audios = await sequelize.models.audio.findAll({ where: { articleId } });

        for (const audio of audios)
            await deleteAudioById(audio.id);

    } catch (err) {
        console.error('Error in deleteAudiosByArticleId', err);
    }
}

async function downloadAudioById(audioId) {
    try {
        const audio = await sequelize.models.audio.findByPk(audioId);

        if (!audio)
            throw new Error('No audio found with id: ' + audioId);

        // Show save dialog
        const result = await dialog.showSaveDialog(mainWindow, {
            title: 'Save Audio',
            defaultPath: audio.name || 'audio',
            filters: [
                { name: 'Audio Files', extensions: ['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a', 'wma'] },
                { name: 'All Files', extensions: ['*'] }
            ]
        });

        if (!result.canceled && result.filePath) {
            // Copy file to selected location
            const sourcePath = getAudioAbsPath(audio.path);
            await fs.copyFile(sourcePath, result.filePath);
            return { success: true, filePath: result.filePath };
        }

        return { success: false, canceled: true };

    } catch (err) {
        console.error('Error in downloadAudioById', err);
        throw err;
    }
}

function getAudioAbsPath(audioPath) {
    return path.join(audiosFolderPath, audioPath);
}

const AudioService = {
    initService,
    createAudio,
    deleteAudiosByArticleId,
};

export default AudioService;
