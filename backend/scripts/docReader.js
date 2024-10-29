const { ipcMain } = require('electron')
const fs = require('fs');
const mammoth = require('mammoth');
const cheerio = require('cheerio');
const articleService = require('../service/ArticleService')


ipcMain.handle('DB/loadArticles', (event) => loadArticles());

const getTextContent = (htmlString) => {
    const $ = cheerio.load(htmlString);
    return $.text().trim();
}

function isNumeric(str) {
    return /^\d+$/.test(str);
}

async function readArticlesFromDocx(filePath) {
    const buffer = fs.readFileSync(filePath);
    const result = await mammoth.convertToHtml({ buffer: buffer });
    const html = result.value;
    const lines = html.split('<p>').map(line => line.replace('</p>', '').trim()).filter(line => line.length > 0);
    const articles = [];

    let content = [];
    let article = {};

    lines.forEach(line => {
        if (getTextContent(line).length === 3 && isNumeric(getTextContent(line))) {
            return;
        }

        if (line.startsWith('»')) { // new article
            if (content.length > 0) { // save previous article
                let text = content.join(' ');

                if (text.charAt(0) === '“')
                    text = text.substring(1);
                if (text.charAt(text.length - 1) === '”')
                    text = text.substring(0, text.length - 1);

                text = '<p>' + text + '</p>';

                article.text = text;

                articles.push(article);
                content = []; // reset the content
                article = {}; // reset the article
            }
            let ownerName = getTextContent(line); // ownerName of the new article
            article.owner = { name: ownerName.substring(2) }
        } else if (!article.title) {
            // removing double quotes if present
            let title = getTextContent(line);
            if (title.charAt(0) === '“')
                title = title.substring(1);
            if (title.charAt(title.length - 1) === '”')
                title = title.substring(0, title.length - 1);

            article.title = title;
        } else {
            content.push(line);
        }
    });

    return articles;
}

const loadArticles = async () => {
    const filePath = 'C:/Users/trxrg/Desktop/doc/doc2.docx';
    try {
        const articles = await readArticlesFromDocx(filePath);
        for (const article of articles) {
            await articleService.createArticleProgrammatically(article);
        }
    } catch (err) {
        console.error(err);
    }
};