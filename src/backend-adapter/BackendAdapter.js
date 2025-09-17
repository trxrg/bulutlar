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
    updateDate2:        async (id, newDate)         => window.api.article.updateDate2(id, newDate),
    addImage:           async (id, image)           => window.api.article.addImage(id, image),
    openDialogToAddImages: async (id)               => window.api.article.openDialogToAddImages(id),
    addAudio:           async (id, audio)           => window.api.article.addAudio(id, audio),
    openDialogToAddAudios: async (id)               => window.api.article.openDialogToAddAudios(id),
    addVideo:           async (id, video)           => window.api.article.addVideo(id, video),
    openDialogToAddVideos: async (id)               => window.api.article.openDialogToAddVideos(id),
    exportArticle: async (exportData)               => window.api.article.exportArticle(exportData),
    exportMultipleArticles: async (exportData)      => window.api.article.exportMultipleArticles(exportData),
    addAnnotation:      async (id, annotation)      => window.api.article.addAnnotation(id, annotation),
    getAll:             async (order)               => window.api.article.getAll(order),
    getById:            async (id)                  => window.api.article.getById(id),
    deleteById:         async (id)                  => window.api.article.deleteById(id),
    addRelatedArticle:  async (id, relatedArticleId) => window.api.article.addRelatedArticle(id, relatedArticleId),
    removeRelatedArticle: async (id, relatedArticleId) => window.api.article.removeRelatedArticle(id, relatedArticleId),
    addTag:             async (id, tagName)           => window.api.article.addTag(id, tagName),
    removeTag:          async (id, tagName)           => window.api.article.removeTag(id, tagName),
    addToGroup:         async (id, groupName)           => window.api.article.addToGroup(id, groupName),
    removeFromGroup:    async (id, groupId)           => window.api.article.removeFromGroup(id, groupId),
    setIsStarred:       async (id, isStarred)         => window.api.article.setIsStarred(id, isStarred),
    setIsDateUncertain:       async (id, isDateUncertain)         => window.api.article.setIsDateUncertain(id, isDateUncertain),
    setOrdering:       async (id, ordering)         => window.api.article.setOrdering(id, ordering),
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

export const groupApi = {
    create:             async (group)               => window.api.group.create(group),
    updateName:         async (id, newName)         => window.api.group.updateName(id, newName),
    getAll:             async ()                    => window.api.group.getAll(),
    getById:            async (id)                  => window.api.group.getById(id),
    addArticles:        async (groupName, articleIds) => window.api.group.addArticles(groupName, articleIds),
    deleteById:         async (id)                  => window.api.group.deleteById(id)
};

export const commentApi = {
    updateText:         async (id, newText)         => window.api.comment.updateText(id, newText),
    getById:            async (id)                  => window.api.comment.getById(id),
};

export const imageApi = {
    getDataById:        async (id)                  => window.api.image.getDataById(id),
    getDataByPath:      async (image)               => window.api.image.getDataByPath(image),
    getDataByAnyPath:   async (path, type)          => window.api.image.getDataByAnyPath(path, type),
    deleteById:         async (id)                  => window.api.image.deleteById(id),
    download:           async (id)                  => window.api.image.download(id),
};

export const audioApi = {
    getDataById:        async (id)                  => window.api.audio.getDataById(id),
    getDataByPath:      async (audio)               => window.api.audio.getDataByPath(audio),
    getDataByAnyPath:   async (path, type)          => window.api.audio.getDataByAnyPath(path, type),
    deleteById:         async (id)                  => window.api.audio.deleteById(id),
    download:           async (id)                  => window.api.audio.download(id),
    extractMetadata:    async (id)                  => window.api.audio.extractMetadata(id),
    updateMetadata:     async (id, metadata)        => window.api.audio.updateMetadata(id, metadata),
    updateMissingDurations: async ()                => window.api.audio.updateMissingDurations(),
};

export const videoApi = {
    getDataById:        async (id)                  => window.api.video.getDataById(id),
    getDataByPath:      async (video)               => window.api.video.getDataByPath(video),
    getDataByAnyPath:   async (path, type)          => window.api.video.getDataByAnyPath(path, type),
    deleteById:         async (id)                  => window.api.video.deleteById(id),
    download:           async (id)                  => window.api.video.download(id),
    extractMetadata:    async (id)                  => window.api.video.extractMetadata(id),
    updateMetadata:     async (id, metadata)        => window.api.video.updateMetadata(id, metadata),
    updateMissingDurations: async ()                => window.api.video.updateMissingDurations(),
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
    handleImport: async () => window.api.db.handleImport(),
    handleBackup: async () => window.api.db.handleBackup(),
    changeBackupDir: async () => window.api.db.changeBackupDir(),
    getBackupDir: () => window.api.db.getBackupDir(),
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

export const storeApi = {
    set: async (key, value) => window.api.store.set(key, value),
    get: async (key) => window.api.store.get(key),
};
