const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('versions', {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron
  // we can also expose variables, not just functions
})

contextBridge.exposeInMainWorld('api', {
  article: {
    create:            (article)            => ipcRenderer.invoke('article/create', article),
    updateMainText:    (id, newMainText)    => ipcRenderer.invoke('article/updateMainText', id, newMainText),
    updateExplanation: (id, newExplanation) => ipcRenderer.invoke('article/updateExplanation', id, newExplanation),
    updateComment:     (id, newComment)     => ipcRenderer.invoke('article/updateComment', id, newComment),
    updateTitle:       (id, newtitle)       => ipcRenderer.invoke('article/updateTitle', id, newtitle),
    updateOwner:       (id, newOwnerName)   => ipcRenderer.invoke('article/updateOwner', id, newOwnerName),
    updateCategory:    (id, newCategoryName)=> ipcRenderer.invoke('article/updateCategory', id, newCategoryName),
    updateDate:        (id, newDate)        => ipcRenderer.invoke('article/updateDate', id, newDate),
    addImage:          (id, image)          => ipcRenderer.invoke('article/addImage', id, image),
    addAnnotation:     (id, annotation)     => ipcRenderer.invoke('article/addAnnotation', id, annotation),
    getAll:            (order)              => ipcRenderer.invoke('article/getAll', order),
    getById:           (id)                 => ipcRenderer.invoke('article/getById', id),
    deleteById:        (id)                 => ipcRenderer.invoke('article/deleteById', id),
    addRelatedArticle: (id, relatedArticleId) => ipcRenderer.invoke('article/addRelatedArticle', id, relatedArticleId),
    removeRelatedArticle: (id, relatedArticleId) => ipcRenderer.invoke('article/removeRelatedArticle', id, relatedArticleId),
    addTag:           (id, tagName)           => ipcRenderer.invoke('article/addTag', id, tagName),
    removeTag:        (id, tagName)           => ipcRenderer.invoke('article/removeTag', id, tagName)
  },
  owner: {
    create:      (owner)        => ipcRenderer.invoke('owner/create', owner),
    updateName:  (id, newName)  => ipcRenderer.invoke('owner/updateName', id, newName),
    getAll:      ()             => ipcRenderer.invoke('owner/getAll'),
    getById:     (id)           => ipcRenderer.invoke('owner/getById', id),
    deleteById:  (id)           => ipcRenderer.invoke('owner/deleteById', id),
  },
  category: {
    create:      (id)           => ipcRenderer.invoke('category/create', id),
    updateName:  (id, newName)  => ipcRenderer.invoke('category/updateName', id, newName),
    updateColor: (id, newColor) => ipcRenderer.invoke('category/updateColor', id, newColor),
    getAll:      ()             => ipcRenderer.invoke('category/getAll'),
    getById:     (id)           => ipcRenderer.invoke('category/getById', id),
    deleteById:  (id)           => ipcRenderer.invoke('category/deleteById', id),
  },
  comment: {
    updateText: (id, newText) => ipcRenderer.invoke('comment/updateText', id, newText),
    getById:    (id)          => ipcRenderer.invoke('comment/getById', id),
  },
  image: {
    getDataById:   (id)     => ipcRenderer.invoke('image/getDataById', id),
    getDataByPath: (image)  => ipcRenderer.invoke('image/getDataByPath', image),
    deleteById:    (id)     => ipcRenderer.invoke('image/deleteById', id),
  },
  tag: {
    getAll: () => ipcRenderer.invoke('tag/getAll'),
    getById: (id) => ipcRenderer.invoke('tag/getById', id),
  },
  annotation: {
    deleteById:       (annotationId)          => ipcRenderer.invoke('annotation/deleteById', annotationId),
    getAll:           ()                      => ipcRenderer.invoke('annotation/getAll'),
    getById:          (annotationId)          => ipcRenderer.invoke('annotation/getById', annotationId),
    updateNote:       (annotationId, newNote) => ipcRenderer.invoke('annotation/updateNote', annotationId, newNote),
  },
  db: {
    loadArticles: () => ipcRenderer.invoke('DB/loadArticles'),
    loadArticlesFromTxt: () => ipcRenderer.invoke('DB/loadArticlesFromTxt'),
    handleExport: () => ipcRenderer.invoke('DB/handleExport'),
  },
  lookup: {
    create: (lookup) => ipcRenderer.invoke('lookup/create', lookup),
    getByLabel: (label) => ipcRenderer.invoke('lookup/getByLabel', label),
    updateValue: (label, newValue) => ipcRenderer.invoke('lookup/updateValue', label, newValue),
    setLastActiveDateToToday: () => ipcRenderer.invoke('lookup/setLastActiveDateToToday'),
  },
  getOwnerWithName:          (ownerName)   => ipcRenderer.invoke('getOwnerWithName', ownerName),
  getOwnerWithNameLike:      (nameLike)    => ipcRenderer.invoke('getOwnerWithNameLike', nameLike),
  ping:                      ()            => ipcRenderer.invoke('ping'),
  getFromDb:                 ()            => ipcRenderer.invoke('getFromDb'),
  checkDbConnection:         ()            => ipcRenderer.invoke('checkDbConnection'),
  addOwnerAndArticle:        ()            => ipcRenderer.invoke('addOwnerAndArticle'),
  deleteOwnerWithName:       (ownerName)   => ipcRenderer.invoke('deleteOwnerWithName', ownerName),
  getArticleWithTitleLike:   (titleLike)   => ipcRenderer.invoke('getArticleWithTitleLike', titleLike),
  getAllArticlesOfOwnerName: (ownerName)   => ipcRenderer.invoke('getAllArticlesOfOwnerName', ownerName),
})
