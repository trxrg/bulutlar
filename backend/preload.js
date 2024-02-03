const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('versions', {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron
  // we can also expose variables, not just functions
})

contextBridge.exposeInMainWorld('api', {
  ping: () => ipcRenderer.invoke('ping'),  
  getFromDb: () => ipcRenderer.invoke('getFromDb'),
  checkDbConnection: () => ipcRenderer.invoke('checkDbConnection')
})