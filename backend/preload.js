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
})