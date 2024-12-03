export const articleIdToUrl = (articleId) => {
    return `article:${articleId}`;
}

export const urlToArticleId = (link) => {
    try {
        return parseInt(link.substring(8));
    } catch (error) {
        console.error('Error parsing article link:', link, error);
        return null;
    }
}

export const isArticleUrl = (link) => {
    return link.startsWith('article:');
}