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
    ipcMain.handle('audio/extractMetadata', (event, audioId) => extractAudioMetadataById(audioId)); // New function
    ipcMain.handle('audio/updateMetadata', (event, audioId, metadata) => updateAudioMetadata(audioId, metadata)); // New function
    ipcMain.handle('audio/updateMissingDurations', () => updateMissingDurations()); // New function
    
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

        // Return both the file path for streaming AND metadata
        const result = {
            path: getAudioAbsPath(audio.path),
            metadata: {
                duration: audio.duration,
                name: audio.name,
                size: audio.size,
                type: audio.type
            }
        };
        
        console.log('🎵 AudioService returning:', {
            audioId,
            duration: audio.duration,
            hasMetadata: !!result.metadata,
            metadataKeys: Object.keys(result.metadata)
        });
        
        return result;
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
    const absolutePath = path.join(audiosFolderPath, audioPath);
    console.log('🎵 getAudioAbsPath:');
    console.log('  - audiosFolderPath:', audiosFolderPath);
    console.log('  - audioPath:', audioPath);
    console.log('  - absolutePath:', absolutePath);
    return absolutePath;
}

// Extract audio metadata using browser-based method (no external dependencies)
async function extractAudioMetadataById(audioId) {
    try {
        const audio = await sequelize.models.audio.findByPk(audioId);
        if (!audio) {
            throw new Error('Audio not found');
        }
        
        const filePath = getAudioAbsPath(audio.path);
        
        // Return the file path - the frontend will handle the metadata extraction
        return { 
            audioId,
            filePath,
            currentMetadata: {
                duration: audio.duration
            }
        };
    } catch (error) {
        console.error('Error in extractAudioMetadataById:', error);
        throw error;
    }
}

// Update audios that are missing duration information
async function updateMissingDurations() {
    try {
        const audiosWithoutDuration = await sequelize.models.audio.findAll({
            where: {
                duration: null
            }
        });
        
        console.log(`Found ${audiosWithoutDuration.length} audios without duration`);
        return { 
            audiosToUpdate: audiosWithoutDuration.map(a => ({
                id: a.id,
                name: a.name,
                path: getAudioAbsPath(a.path)
            }))
        };
    } catch (error) {
        console.error('Error finding audios without duration:', error);
        throw error;
    }
}

// Update specific audio metadata (called from frontend after extraction)
async function updateAudioMetadata(audioId, metadata) {
    try {
        const audio = await sequelize.models.audio.findByPk(audioId);
        if (!audio) {
            throw new Error('Audio not found');
        }
        
        await audio.update({
            duration: metadata.duration || audio.duration
        });
        
        console.log(`Updated audio ${audioId} metadata:`, metadata);
        return { success: true };
    } catch (error) {
        console.error('Error updating audio metadata:', error);
        throw error;
    }
}

const AudioService = {
    initService,
    createAudio,
    deleteAudiosByArticleId,
    updateMissingDurations, // Export the new function
};

export default AudioService;
