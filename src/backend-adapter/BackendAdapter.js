export async function ping() {
    return window.api.ping();
}

export async function checkDbConnection() {
    return window.api.checkDbConnection();
}

export async function createOwner(owner) {
    return await window.api.owner.create(owner);
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
    return window.api.category.getAll();
}

export async function createCategory(category) {
    return window.api.category.create(category);
}

export async function updateCategoryName(categoryId, newName) {
    return window.api.category.updateName(categoryId, newName);
}

export async function updateCategoryColor(categoryId, newColor) {
    return window.api.category.updateColor(categoryId, newColor);
}

export async function getCategoryById(categoryId) {
    return window.api.category.getById(categoryId);
}

export async function deleteCategory(categoryId) {
    return window.api.category.deleteCategory(categoryId);
}

export async function deleteOwnerWithName(ownerName) {
    return window.api.deleteOwnerWithName(ownerName);
}

export async function addArticle(article) {
    return window.api.addArticle(article);
}

export async function deleteArticle(articleId) {
    return window.api.deleteArticle(articleId);
}

export async function updateArticle(articleId, article) {
    return window.api.updateArticle(articleId, article);
}

export async function updateArticleMainText(articleId, newMainText) {
    return window.api.article.updateArticleMainText(articleId, newMainText);
}

export async function updateArticleExplanation(articleId, newExplanation) {
    return window.api.article.updateArticleExplanation(articleId, newExplanation);
}

export async function addImageToArticle(articleId, newExplanation) {
    return window.api.article.addImageToArticle(articleId, newExplanation);
}

export async function getImageDataById(imageId) {
    return window.api.image.getImageDataById(imageId);
}

export async function getImageDataByPath(image) {
    return window.api.image.getImageDataByPath(image);
}

export async function deleteImage(imageId) {
    return window.api.image.deleteImage(imageId);
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

export async function updateCommentText(commentId, newText) {
    return window.api.comment.updateText(commentId, newText)
}
