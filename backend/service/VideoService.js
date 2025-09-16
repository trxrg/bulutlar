import { ipcMain, dialog } from 'electron';
import { sequelize } from '../sequelize/index.js';
import { ensureFolderExists } from '../fsOps.js';
import path from 'path';
import fs from 'fs/promises';
import { config } from '../config.js';
import { mainWindow } from '../main.js';

let videosFolderPath;
let publicFolderPath;

function initService() {
    ipcMain.handle('video/getDataById', (event, id) => getVideoDataById(id));
    ipcMain.handle('video/getDataByPath', (event, path) => getVideoDataByPath(path));
    ipcMain.handle('video/getDataByAnyPath', (event, path, type) => getVideoDataFromPublic(path, type));
    ipcMain.handle('video/deleteById', (event, id) => deleteVideoById(id));
    ipcMain.handle('video/download', (event, id) => downloadVideoById(id));
    ipcMain.handle('video/extractMetadata', (event, videoId) => extractVideoMetadataById(videoId)); // New function
    ipcMain.handle('video/updateMetadata', (event, videoId, metadata) => updateVideoMetadata(videoId, metadata)); // New function
    ipcMain.handle('video/updateMissingDurations', () => updateMissingDurations()); // New function
    
    publicFolderPath = config.publicFolderPath;
    videosFolderPath = config.videosFolderPath;
    ensureFolderExists(videosFolderPath);

    console.info('VideoService initialized');
    console.info('Resolved videosFolderPath:', videosFolderPath);
    console.info('Config object:', JSON.stringify(config, null, 2));
}

async function createVideo(video, transaction = null) {
    try {
        const relPath = path.join(video.name + '_' + Date.now());
        const absPath = path.join(videosFolderPath, relPath);

        console.info('Copying file from:', video.path);
        console.info('Copying file to:', absPath);
        await fs.copyFile(video.path, absPath);

        const result = await sequelize.models.video.create({
            name: video.name,
            type: video.type,
            path: relPath,
            size: video.size,
            description: video.name,
            duration: video.duration,
            width: video.width,
            height: video.height
        }, { transaction });

        return result;

    } catch (err) {
        console.error('Error in createVideo ', err);
    }
}

async function getVideoDataById(videoId) {
    try {
        const video = await sequelize.models.video.findByPk(videoId);

        if (!video)
            throw ('no video found with id: ' + videoId);

        // Return both the file path for streaming AND metadata
        const result = {
            path: getVideoAbsPath(video.path),
            metadata: {
                duration: video.duration,
                width: video.width,
                height: video.height,
                name: video.name,
                size: video.size,
                type: video.type
            }
        };
        
        console.log('🎬 VideoService returning:', {
            videoId,
            duration: video.duration,
            hasMetadata: !!result.metadata,
            metadataKeys: Object.keys(result.metadata)
        });
        
        return result;
    } catch (err) {
        console.error('Error in getVideoData', err);
    }
}

async function getVideoDataByPath(video) {
    try {
        // Return the absolute file path for streaming
        return getVideoAbsPath(video.path);
    } catch (err) {
        console.error('Error in getVideoDataByPath', err);
    }
}

async function getVideoDataFromPublic(relPath, videoType) {
    try {
        const absPath = path.join(publicFolderPath, relPath);
        const fileData = await fs.readFile(absPath, 'base64');
        
        return `data:${videoType};base64,${fileData}`;
    } catch (err) {
        console.error('Error in getVideoDataByAnyPath', err);
    }
}

async function deleteVideoById(videoId) {

    try {
        const video = await sequelize.models.video.findByPk(videoId);

        if (!video)
            throw ('no video found with id: ' + videoId);

        fs.unlink(getVideoAbsPath(video.path));

        await video.destroy();

    } catch (err) {
        console.error('Error in deleteVideo', err);
    }
}

async function deleteVideosByArticleId(articleId) {
    try {
        const videos = await sequelize.models.video.findAll({ where: { articleId } });

        for (const video of videos)
            await deleteVideoById(video.id);

    } catch (err) {
        console.error('Error in deleteVideosByArticleId', err);
    }
}

async function downloadVideoById(videoId) {
    try {
        const video = await sequelize.models.video.findByPk(videoId);

        if (!video)
            throw new Error('No video found with id: ' + videoId);

        // Show save dialog
        const result = await dialog.showSaveDialog(mainWindow, {
            title: 'Save Video',
            defaultPath: video.name || 'video',
            filters: [
                { name: 'Video Files', extensions: ['mp4', 'webm', 'ogg', 'avi', 'mov', 'wmv', 'flv', 'mkv'] },
                { name: 'All Files', extensions: ['*'] }
            ]
        });

        if (!result.canceled && result.filePath) {
            // Copy file to selected location
            const sourcePath = getVideoAbsPath(video.path);
            await fs.copyFile(sourcePath, result.filePath);
            return { success: true, filePath: result.filePath };
        }

        return { success: false, canceled: true };

    } catch (err) {
        console.error('Error in downloadVideoById', err);
        throw err;
    }
}

function getVideoAbsPath(videoPath) {
    const absolutePath = path.join(videosFolderPath, videoPath);
    // console.log('🎬 getVideoAbsPath:');
    // console.log('  - videosFolderPath:', videosFolderPath);
    // console.log('  - videoPath:', videoPath);
    // console.log('  - absolutePath:', absolutePath);
    return absolutePath;
}

// Extract video metadata using browser-based method (no external dependencies)
async function extractVideoMetadataById(videoId) {
    try {
        const video = await sequelize.models.video.findByPk(videoId);
        if (!video) {
            throw new Error('Video not found');
        }
        
        const filePath = getVideoAbsPath(video.path);
        
        // Return the file path - the frontend will handle the metadata extraction
        return { 
            videoId,
            filePath,
            currentMetadata: {
                duration: video.duration,
                width: video.width,
                height: video.height
            }
        };
    } catch (error) {
        console.error('Error in extractVideoMetadataById:', error);
        throw error;
    }
}

// Update videos that are missing duration information
async function updateMissingDurations() {
    try {
        const videosWithoutDuration = await sequelize.models.video.findAll({
            where: {
                duration: null
            }
        });
        
        console.log(`Found ${videosWithoutDuration.length} videos without duration`);
        return { 
            videosToUpdate: videosWithoutDuration.map(v => ({
                id: v.id,
                name: v.name,
                path: getVideoAbsPath(v.path)
            }))
        };
    } catch (error) {
        console.error('Error finding videos without duration:', error);
        throw error;
    }
}

// Update specific video metadata (called from frontend after extraction)
async function updateVideoMetadata(videoId, metadata) {
    try {
        const video = await sequelize.models.video.findByPk(videoId);
        if (!video) {
            throw new Error('Video not found');
        }
        
        await video.update({
            duration: metadata.duration || video.duration,
            width: metadata.width || video.width,
            height: metadata.height || video.height
        });
        
        console.log(`Updated video ${videoId} metadata:`, metadata);
        return { success: true };
    } catch (error) {
        console.error('Error updating video metadata:', error);
        throw error;
    }
}

const VideoService = {
    initService,
    createVideo,
    deleteVideosByArticleId,
    updateMissingDurations, // Export the new function
};

export default VideoService;
