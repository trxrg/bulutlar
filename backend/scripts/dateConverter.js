import { getAllArticles, updateArticleDate } from '../service/ArticleService.js';

const convertDateForArticles = async () => {
    const articles = await getAllArticles();
    for (const article of articles) {
        await updateArticleDate(article.id, article.date);
    }
    return articles;
}

convertDateForArticles();
