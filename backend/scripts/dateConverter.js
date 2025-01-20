const { getAllArticles, updateArticleDate } = require('../service/ArticleService');

const convertDateForArticles = async () => {
    const articles = await getAllArticles();
    for (const article of articles) {
        await updateArticleDate(article.id, article.date);
    }
    return articles;
}

convertDateForArticles();
