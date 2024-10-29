const { ipcMain } = require('electron')
const fs = require('fs');
const path = require('path');
const articleService = require('../service/ArticleService')


ipcMain.handle('DB/loadArticlesFromTxt', (event) => loadArticlesFromTxt());

const readArticlesFromTxt = (filePath) => {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                reject('Error reading the file:', err);
                return;
            }

            try {
                const jsonData = JSON.parse(data);
                const articles = jsonData.articles;
                resolve(articles);
            } catch (parseErr) {
                reject('Error parsing JSON data:', parseErr);
            }
        });
    });
};

const loadArticlesFromTxt = async () => {
    console.log('loadArticlesFromTxt called');
    const filePath = path.join(__dirname, 'articles.txt');
    try {
        const articles = await readArticlesFromTxt(filePath);
        console.log('Articles:', articles);
        for (const article of articles) {
            await articleService.createArticleProgrammatically(article);
        }
    } catch (err) {
        console.error(err);
    }
};
