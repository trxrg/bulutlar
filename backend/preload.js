const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('versions', {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron
  // we can also expose variables, not just functions
})

contextBridge.exposeInMainWorld('api', {
  article: {
    updateMainText: (articleId, newMainText) => ipcRenderer.invoke('article/updateMainText', articleId, newMainText),
    updateExplanation: (articleId, newExplanation) => ipcRenderer.invoke('article/updateExplanation', articleId, newExplanation),
    addImage: (articleId, image) => ipcRenderer.invoke('article/addImage', articleId, image),
    addAnnotation: (articleId, annotation) => ipcRenderer.invoke('article/addAnnotation', articleId, annotation),
    create: (article) => ipcRenderer.invoke('article/create', article),
    getAll: () => ipcRenderer.invoke('article/getAll'),
    getById: (articleId) => ipcRenderer.invoke('article/getById', articleId),
    deleteById: (articleId) => ipcRenderer.invoke('article/deleteById', articleId),
  },
  owner: {
    create: (owner) => ipcRenderer.invoke('owner/create', owner),
    getById: (id) => ipcRenderer.invoke('owner/getById', id),
    deleteOwner: (id) => ipcRenderer.invoke('owner/deleteOwner', id),
    updateName: (id, newName) => ipcRenderer.invoke('owner/updateName', id, newName),
  },
  comment: {
    updateText: (commentId, newText) => ipcRenderer.invoke('comment/updateText', commentId, newText),
    getById: (commentId) => ipcRenderer.invoke('comment/getById', commentId),
  },
  image: {
    getImageDataById: (imageId) => ipcRenderer.invoke('image/getImageDataById', imageId),
    getImageDataByPath: (image) => ipcRenderer.invoke('image/getImageDataByPath', image),
    deleteImage: (imageId) => ipcRenderer.invoke('image/deleteImage', imageId),
  },
  annotation: {
    deleteAnnotation: (annotationId) => ipcRenderer.invoke('annotation/deleteAnnotation', annotationId),
    updateNote: (annotationId, newNote) => ipcRenderer.invoke('annotation/updateNote', annotationId, newNote),
  },
  category: {
    create: (category) => ipcRenderer.invoke('category/create', category),
    getAll: () => ipcRenderer.invoke('category/getAll'),
    updateName: (categoryId, newName) => ipcRenderer.invoke('category/updateName', categoryId, newName),
    updateColor: (categoryId, newColor) => ipcRenderer.invoke('category/updateColor', categoryId, newColor),
    getById: (categoryId) => ipcRenderer.invoke('category/getById', categoryId),
    deleteCategory: (categoryId) => ipcRenderer.invoke('category/deleteCategory', categoryId),
  },
  
  getOwnerWithName: (ownerName) => ipcRenderer.invoke('getOwnerWithName', ownerName),
  getOwnerWithNameLike: (nameLike) => ipcRenderer.invoke('getOwnerWithNameLike', nameLike),
  getAllOwners: () => ipcRenderer.invoke('getAllOwners'),
  
  ping: () => ipcRenderer.invoke('ping'),
  getFromDb: () => ipcRenderer.invoke('getFromDb'),
  checkDbConnection: () => ipcRenderer.invoke('checkDbConnection'),
  addOwnerAndArticle: () => ipcRenderer.invoke('addOwnerAndArticle'),
  
  deleteOwnerWithName: (ownerName) => ipcRenderer.invoke('deleteOwnerWithName', ownerName),
    
  getArticleWithTitleLike: (titleLike) => ipcRenderer.invoke('getArticleWithTitleLike', titleLike),
  getAllArticlesOfOwnerName: (ownerName) => ipcRenderer.invoke('getAllArticlesOfOwnerName', ownerName),
  getAllTags: () => ipcRenderer.invoke('getAllTags'),
})
