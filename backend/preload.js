const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('versions', {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron
  // we can also expose variables, not just functions
})

contextBridge.exposeInMainWorld('api', {
  addOwner: (ownerName) => ipcRenderer.invoke('addOwner', ownerName),
  updateOwnerName: (ownerName, newName) => ipcRenderer.invoke('updateOwnerName', ownerName, newName),
  getOwnerWithName: (ownerName) => ipcRenderer.invoke('getOwnerWithName', ownerName),
  getOwnerWithNameLike: (nameLike) => ipcRenderer.invoke('getOwnerWithNameLike', nameLike),
  getOwnerWithId: (id) => ipcRenderer.invoke('getOwnerWithId', id),
  getAllOwners: () => ipcRenderer.invoke('getAllOwners'),
  ping: () => ipcRenderer.invoke('ping'),  
  getFromDb: () => ipcRenderer.invoke('getFromDb'),
  checkDbConnection: () => ipcRenderer.invoke('checkDbConnection'),
  addOwnerAndArticle: () => ipcRenderer.invoke('addOwnerAndArticle'),
  getAllArticles: () => ipcRenderer.invoke('getAllArticles'),
  deleteOwnerWithName: (ownerName) => ipcRenderer.invoke('deleteOwnerWithName', ownerName),
  addArticle: (article) => ipcRenderer.invoke('addArticle', article),
  updateArticle: (articleId, article) => ipcRenderer.invoke('updateArticle', articleId, article),
  getArticleWithId: (articleId) => ipcRenderer.invoke('getArticleWithId', articleId),
  getArticleWithTitleLike: (titleLike) => ipcRenderer.invoke('getArticleWithTitleLike', titleLike),
  getAllArticlesOfOwnerName: (ownerName) => ipcRenderer.invoke('getAllArticlesOfOwnerName', ownerName),
})