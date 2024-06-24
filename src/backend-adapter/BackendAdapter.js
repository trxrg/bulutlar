export async function ping() {
    return window.api.ping();
}

export async function checkDbConnection() {
    return window.api.checkDbConnection();
}

export async function getFromDb() {
    return window.api.getFromDb();
}

export async function addOwnerAndArticle() {
    return window.api.addOwnerAndArticle();
}

export async function addOwner(ownerName) {
    try {
        return await window.api.addOwner(ownerName);
    } catch(err) {
        console.error(err);
        throw new Error("Kişi eklenemedi!");
    }    
}

export async function updateOwnerName(ownerName, newName) {
    return window.api.updateOwnerName(ownerName, newName);
}

export async function getOwnerWithName(ownerName) {
    return window.api.getOwnerWithName(ownerName);
}

export async function getOwnerWithNameLike(nameLike) {
    return window.api.getOwnerWithNameLike(nameLike);
}

export async function getOwnerWithId(id) {
    return window.api.getOwnerWithId(id);
}

export async function getAllOwners() {
    return window.api.getAllOwners();
}

export async function getAllCategories() {
    return window.api.getAllCategories();
}

export async function deleteOwnerWithName(ownerName) {
    return window.api.deleteOwnerWithName(ownerName);
}

export async function addArticle(article) {
    return window.api.addArticle(article);
}

export async function updateArticle(articleId, article) {
    return window.api.updateArticle(articleId, article);
}

export async function getArticleWithId(articleId) {
    return window.api.getArticleWithId(articleId);
}

export async function getArticleWithTitleLike(titleLike) {
    return window.api.getArticleWithTitleLike(titleLike);
}

export async function getAllArticlesOfOwnerName(ownerName) {
    return window.api.getAllArticlesOfOwnerName(ownerName);
}

export async function getAllArticles() {
    return window.api.getAllArticles();
}

export async function getAllTags() {
    return window.api.getAllTags();
}
