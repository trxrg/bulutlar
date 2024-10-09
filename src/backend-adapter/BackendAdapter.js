export async function ping() {
    return window.api.ping();
}

export async function checkDbConnection() {
    return window.api.checkDbConnection();
}

export const ownerApi = {
    create: async (owner) => await window.api.owner.create(owner),
    delete: async (ownerId) => window.api.owner.deleteOwner(ownerId),
    updateName: async (id, newName) => window.api.owner.updateName(id, newName),
    getById: async (id) => window.api.owner.getById(id),
    getWithName: async (ownerName) => window.api.getOwnerWithName(ownerName),
    getWithNameLike: async (nameLike) => window.api.getOwnerWithNameLike(nameLike),
    getAll: async () => window.api.getAllOwners(),
    deleteWithName: async (ownerName) => window.api.deleteOwnerWithName(ownerName)
};

export const categoryApi = {
    getAll: async () => window.api.category.getAll(),
    create: async (category) => window.api.category.create(category),
    updateName: async (categoryId, newName) => window.api.category.updateName(categoryId, newName),
    updateColor: async (categoryId, newColor) => window.api.category.updateColor(categoryId, newColor),
    getById: async (categoryId) => window.api.category.getById(categoryId),
    delete: async (categoryId) => window.api.category.deleteCategory(categoryId)
};

export const articleApi = {
    create: async (article) => window.api.article.create(article),
    deleteById: async (articleId) => window.api.article.deleteById(articleId),
    updateMainText: async (articleId, newMainText) => window.api.article.updateMainText(articleId, newMainText),
    updateExplanation: async (articleId, newExplanation) => window.api.article.updateExplanation(articleId, newExplanation),
    addImage: async (articleId, newExplanation) => window.api.article.addImage(articleId, newExplanation),
    getById: async (articleId) => window.api.article.getById(articleId),
    getAll: async () => window.api.article.getAll()
};

export const imageApi = {
    getImageDataById: async (imageId) => window.api.image.getImageDataById(imageId),
    getImageDataByPath: async (image) => window.api.image.getImageDataByPath(image),
    getInfoById: async (id) => window.api.image.getInfoById(id),
    delete: async (imageId) => window.api.image.deleteImage(imageId)
};

export const tagApi = {
    getAll: async () => window.api.getAllTags()
};

export const commentApi = {
    updateText: async (commentId, newText) => window.api.comment.updateText(commentId, newText),
    getById: async (commentId) => window.api.comment.getById(commentId),
};
