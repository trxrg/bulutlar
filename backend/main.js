const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('node:path')
require('@electron/remote/main').initialize();
const isDev = app.isPackaged ? false : require('electron-is-dev');

const { initDB } = require('./sequelize');
const { initServices } = require('./service');

require('./scripts/docReader')
require('./scripts/jsonReader')

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    title: 'Bulutlar',
    // frame: false, // Hide the default title bar
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      enableRemoteModule: true, // Enable remote module
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'"],
          imgSrc: ["'self'"],
          // Add more directives as needed
        }
      }
    },
  })

  mainWindow.setMenuBarVisibility(false);

  
  require('@electron/remote/main').enable(mainWindow.webContents);

  mainWindow.loadURL(
    isDev
      ? 'http://localhost:3000' // Development URL
      : `file://${path.join(__dirname, '../build/index.html')}` // Production URL there is a problem here, it opens empty
  );

  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }
}

app.whenReady().then(() => {
  initDB();
  initServices();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
