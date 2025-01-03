export const ping = async () => window.api.ping();
export const checkDbConnection = async () => window.api.checkDbConnection();

export const articleApi = {
    create:             async (article)             => window.api.article.create(article),
    updateMainText:     async (id, newMainText)     => window.api.article.updateMainText(id, newMainText),
    updateExplanation:  async (id, newExplanation)  => window.api.article.updateExplanation(id, newExplanation),
    updateComment:      async (id, newComment)      => window.api.article.updateComment(id, newComment),
    updateTitle:        async (id, newTitle)        => window.api.article.updateTitle(id, newTitle),
    updateOwner:        async (id, newOwnerName)    => window.api.article.updateOwner(id, newOwnerName),
    updateCategory:     async (id, newCategoryName) => window.api.article.updateCategory(id, newCategoryName),
    updateDate:         async (id, newDate)         => window.api.article.updateDate(id, newDate),
    addImage:           async (id, image)           => window.api.article.addImage(id, image),
    addAnnotation:      async (id, annotation)      => window.api.article.addAnnotation(id, annotation),
    getAll:             async (order)               => window.api.article.getAll(order),
    getById:            async (id)                  => window.api.article.getById(id),
    deleteById:         async (id)                  => window.api.article.deleteById(id),
    addRelatedArticle:  async (id, relatedArticleId) => window.api.article.addRelatedArticle(id, relatedArticleId),
    removeRelatedArticle: async (id, relatedArticleId) => window.api.article.removeRelatedArticle(id, relatedArticleId),
    addTag:             async (id, tagName)           => window.api.article.addTag(id, tagName),
    removeTag:          async (id, tagName)           => window.api.article.removeTag(id, tagName)
};

export const ownerApi = {
    create:             async (owner)               => window.api.owner.create(owner),
    updateName:         async (id, newName)         => window.api.owner.updateName(id, newName),
    getAll:             async ()                    => window.api.owner.getAll(),
    getById:            async (id)                  => window.api.owner.getById(id),    
    deleteById:         async (id)                  => window.api.owner.deleteById(id),
};

export const categoryApi = {
    create:             async (category)            => window.api.category.create(category),
    updateName:         async (id, newName)         => window.api.category.updateName(id, newName),
    updateColor:        async (id, newColor)        => window.api.category.updateColor(id, newColor),
    getAll:             async ()                    => window.api.category.getAll(),
    getById:            async (id)                  => window.api.category.getById(id),
    deleteById:         async (id)                  => window.api.category.deleteById(id)
};

export const commentApi = {
    updateText:         async (id, newText)         => window.api.comment.updateText(id, newText),
    getById:            async (id)                  => window.api.comment.getById(id),
};

export const imageApi = {
    getDataById:        async (id)                  => window.api.image.getDataById(id),
    getDataByPath:      async (image)               => window.api.image.getDataByPath(image),
    deleteById:         async (id)                  => window.api.image.deleteById(id),
};

export const tagApi = {
    create:             async (tag)                 => window.api.tag.create(tag),
    updateName:         async (id, newName)         => window.api.tag.updateName(id, newName),
    getAll:             async ()                    => window.api.tag.getAll(),
    getById:            async (id)                  => window.api.tag.getById(id),
    deleteById:         async (id)                  => window.api.tag.deleteById(id),
};

export const dbApi = {
    loadArticles: async () => window.api.db.loadArticles(),
    loadArticlesFromTxt: async () => window.api.db.loadArticlesFromTxt(),
    handleExport: async () => window.api.db.handleExport(),
};

export const lookupApi = {
    create: async (lookup) => window.api.lookup.create(lookup),
    getByLabel: async (label) => window.api.lookup.getByLabel(label),
    updateValue: async (label, newValue) => window.api.lookup.updateValue(label, newValue),
    setLastActiveDateToToday: async () => window.api.lookup.setLastActiveDateToToday(),
};

export const annotationApi = {
    updateNote:         async (id, newNote)         => window.api.annotation.updateNote(id, newNote),
    getAll:             async ()                    => window.api.annotation.getAll(),
    getById:            async (id)                  => window.api.annotation.getById(id),    
    deleteById:         async (id)                  => window.api.annotation.deleteById(id),
};
