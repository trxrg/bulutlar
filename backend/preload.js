const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('versions', {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron
  // we can also expose variables, not just functions
})

contextBridge.exposeInMainWorld('api', {
  article: {
    updateArticleMainText: (articleId, newMainText) => ipcRenderer.invoke('article/updateMainText', articleId, newMainText),
    updateArticleExplanation: (articleId, newExplanation) => ipcRenderer.invoke('article/updateExplanation', articleId, newExplanation),
    addImageToArticle: (articleId, image) => ipcRenderer.invoke('article/addImage', articleId, image),
    addAnnotationToArticle: (articleId, annotation) => ipcRenderer.invoke('article/addAnnotation', articleId, annotation),
  },
  comment: {
    updateText: (commentId, newText) => ipcRenderer.invoke('comment/updateText', commentId, newText),
  },
  image: {
    getImageData: (imageId) => ipcRenderer.invoke('image/getImageData', imageId),
    deleteImage: (imageId) => ipcRenderer.invoke('image/deleteImage', imageId),
  },
  annotation: {
    deleteAnnotation: (annotationId) => ipcRenderer.invoke('annotation/deleteAnnotation', annotationId),
    updateNote: (annotationId, newNote) => ipcRenderer.invoke('annotation/updateNote', annotationId, newNote),
  },
  addOwner: (ownerName) => ipcRenderer.invoke('addOwner', ownerName),
  updateOwnerName: (ownerName, newName) => ipcRenderer.invoke('updateOwnerName', ownerName, newName),
  getOwnerWithName: (ownerName) => ipcRenderer.invoke('getOwnerWithName', ownerName),
  getOwnerWithNameLike: (nameLike) => ipcRenderer.invoke('getOwnerWithNameLike', nameLike),
  getOwnerWithId: (id) => ipcRenderer.invoke('getOwnerWithId', id),
  getAllOwners: () => ipcRenderer.invoke('getAllOwners'),
  getAllCategories: () => ipcRenderer.invoke('getAllCategories'),
  ping: () => ipcRenderer.invoke('ping'),
  getFromDb: () => ipcRenderer.invoke('getFromDb'),
  checkDbConnection: () => ipcRenderer.invoke('checkDbConnection'),
  addOwnerAndArticle: () => ipcRenderer.invoke('addOwnerAndArticle'),
  getAllArticles: () => ipcRenderer.invoke('getAllArticles'),
  deleteOwnerWithName: (ownerName) => ipcRenderer.invoke('deleteOwnerWithName', ownerName),
  addArticle: (article) => ipcRenderer.invoke('addArticle', article),
  deleteArticle: (articleId) => ipcRenderer.invoke('deleteArticle', articleId),
  updateArticle: (articleId, article) => ipcRenderer.invoke('updateArticle', articleId, article),
  getArticleWithId: (articleId) => ipcRenderer.invoke('getArticleWithId', articleId),
  getArticleWithTitleLike: (titleLike) => ipcRenderer.invoke('getArticleWithTitleLike', titleLike),
  getAllArticlesOfOwnerName: (ownerName) => ipcRenderer.invoke('getAllArticlesOfOwnerName', ownerName),
  getAllTags: () => ipcRenderer.invoke('getAllTags'),
})
