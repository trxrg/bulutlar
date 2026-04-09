import { ipcMain } from 'electron';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import articleService from '../service/ArticleService.js';
import { generateSampleImage, generateSampleAudio, generateSampleVideo, cleanup as cleanupMedia } from './sampleMediaGenerator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

ipcMain.handle('DB/loadArticlesFromTxt', (event) => loadArticlesFromTxt());
ipcMain.handle('DB/loadSampleData', (event) => loadSampleData());

const readJsonFile = (filePath) => {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                reject('Error reading the file: ' + err);
                return;
            }

            try {
                resolve(JSON.parse(data));
            } catch (parseErr) {
                reject('Error parsing JSON data: ' + parseErr);
            }
        });
    });
};

const loadArticlesFromTxt = async () => {
    console.log('loadArticlesFromTxt called');
    const filePath = path.join(__dirname, 'articles.txt');
    try {
        const jsonData = await readJsonFile(filePath);
        console.log('Articles:', jsonData.articles);
        for (const article of jsonData.articles) {
            await articleService.createArticleProgrammatically(article);
        }
    } catch (err) {
        console.error(err);
    }
};

async function generateMediaForArticle(mediaDefs) {
    const result = { images: [], audios: [], videos: [] };
    if (!mediaDefs) return result;

    for (const img of mediaDefs.images || []) {
        const file = await generateSampleImage(img.name);
        if (file) {
            file.description = img.description || img.name;
            result.images.push(file);
        }
    }
    for (const aud of mediaDefs.audios || []) {
        const file = await generateSampleAudio(aud.name, aud.duration, aud.frequency);
        file.description = aud.description || aud.name;
        result.audios.push(file);
    }
    for (const vid of mediaDefs.videos || []) {
        const file = await generateSampleVideo(vid.name);
        if (file) {
            file.description = vid.description || vid.name;
            result.videos.push(file);
        }
    }
    return result;
}

const loadSampleData = async () => {
    console.log('loadSampleData called');
    const filePath = path.join(__dirname, 'sample-data.json');
    try {
        const jsonData = await readJsonFile(filePath);
        const articles = jsonData.articles || [];
        console.log(`Loading ${articles.length} sample articles...`);

        for (let i = 0; i < articles.length; i++) {
            const article = articles[i];
            console.log(`[${i + 1}/${articles.length}] Creating article: ${article.title}`);
            try {
                const media = await generateMediaForArticle(article.media);
                article.images = media.images;
                article.audios = media.audios;
                article.videos = media.videos;
                delete article.media;
                const result = await articleService.createArticleProgrammatically(article);
                if (result && result.error) {
                    console.error(`  Error creating article "${article.title}":`, result.error);
                }
            } catch (articleErr) {
                console.error(`  Exception creating article "${article.title}":`, articleErr);
            }
        }

        await cleanupMedia();
        console.log('Sample data loaded successfully');
        return { success: true, count: articles.length };
    } catch (err) {
        console.error('Error loading sample data:', err);
        return { error: err.toString() };
    }
};
