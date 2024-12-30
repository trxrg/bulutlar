const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('node:path')
require('@electron/remote/main').initialize();
const isDev = app.isPackaged ? false : require('electron-is-dev');

const { initDB } = require('./sequelize');
const { initServices } = require('./service');
const lookupService = require('./service/LookupService');
let mainWindow;

require('./scripts/docReader')
require('./scripts/jsonReader')

const createWindow = () => {
  mainWindow = new BrowserWindow({
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

const handleStreak = async () => {
  await lookupService.getOrCreateLookup('streak', 1);
  const today = lookupService.removeTimeFromDate(new Date());
  const lastActiveDateLookup = await lookupService.getOrCreateLookup('lastActiveDate', today);
  const streakStartDateLookup = await lookupService.getOrCreateLookup('streakStartDate', today);

  const lastActiveDate = lookupService.removeTimeFromDate(new Date(lastActiveDateLookup.value));
  const streakStartDate = lookupService.removeTimeFromDate(new Date(streakStartDateLookup.value));

  const differenceToLastActiveDateInDays = Math.floor((today - lastActiveDate) / (1000 * 3600 * 24));
  const differenceToStreakStartDateInDays = Math.floor((today - streakStartDate) / (1000 * 3600 * 24));

  if (differenceToLastActiveDateInDays > 1) {
    lookupService.updateValue('streak', 1);
    lookupService.updateValue('streakStartDate', today);
  } else {
    lookupService.updateValue('streak', differenceToStreakStartDateInDays + 1);
  }
};

const handleDBVersion = async () => {
  const dbVersion = await lookupService.getOrCreateLookup('dbVersion', '1.0.0');
  if (dbVersion)
    console.log('dbVersion: ', dbVersion.value);
  else
    console.log('dbVersion not found');
}

app.whenReady().then(async () => {
  await initDB();
  initServices();
  handleStreak();
  handleDBVersion();
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

module.exports = {
  mainWindow
}
