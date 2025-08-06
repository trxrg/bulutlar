import { ipcMain } from 'electron';
import { sequelize } from '../sequelize/index.js';
import { ensureFolderExists } from '../fsOps.js';
import path from 'path';
import fs from 'fs/promises';
import { config } from '../config.js';

let videosFolderPath;
let publicFolderPath;

function initService() {
    ipcMain.handle('video/getDataById', (event, id) => getVideoDataById(id));
    ipcMain.handle('video/getDataByPath', (event, path) => getVideoDataByPath(path));
    ipcMain.handle('video/getDataByAnyPath', (event, path, type) => getVideoDataFromPublic(path, type));
    ipcMain.handle('video/deleteById', (event, id) => deleteVideoById(id));
    
    publicFolderPath = config.publicFolderPath;
    videosFolderPath = config.videosFolderPath;
    ensureFolderExists(videosFolderPath);

    console.info('VideoService initialized');
    console.info('Resolved videosFolderPath:', videosFolderPath);
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

        const fileData = await fs.readFile(getVideoAbsPath(video.path), 'base64');

        return `data:video/${video.type};base64,${fileData}`;
    } catch (err) {
        console.error('Error in getVideoData', err);
    }
}

async function getVideoDataByPath(video) {
    try {
        const fileData = await fs.readFile(getVideoAbsPath(video.path), 'base64');

        return `data:video/${video.type};base64,${fileData}`;
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

function getVideoAbsPath(videoPath) {
    return path.join(videosFolderPath, videoPath);
}

const VideoService = {
    initService,
    createVideo,
    deleteVideosByArticleId,
};

export default VideoService;
