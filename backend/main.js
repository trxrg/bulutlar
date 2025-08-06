import path from 'node:path';
import { app, BrowserWindow, protocol } from 'electron';
import { readFile } from 'fs/promises';
import fs from 'fs';
import isDev from 'electron-is-dev';
import { initialize, enable} from '@electron/remote/main/index.js';
import { startSequelize } from './sequelize/index.js';
import { initServices } from './service/index.js';
import { initConfig } from './config.js';
import lookupService from './service/LookupService.js';
import './scripts/docReader.js';
import './scripts/jsonReader.js';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('main.js running')
console.log('dirname: ', __dirname)
initialize();

let mainWindow;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 900,
    title: 'Bulutlar',
    // frame: false, // Hide the default title bar
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      enableRemoteModule: true, // Enable remote module
      contextIsolation: true,
      sandbox: true, // Re-enable sandbox for security
      webSecurity: true, // Keep web security disabled
      nodeIntegration: false,
    },
  })

  mainWindow.setMenuBarVisibility(false);


  enable(mainWindow.webContents);

  mainWindow.loadURL(
    isDev
      ? 'http://localhost:3000' // Development URL
      : `file://${path.join(__dirname, '../build/index.html')}` // Production URL there is a problem here, it opens empty
  );

  // if (isDev) {
  //   mainWindow.webContents.openDevTools({ mode: 'detach' });
  // }
}

// const handleStreak = async () => {
//   await lookupService.getOrCreateLookup('streak', 1);
//   const today = lookupService.removeTimeFromDate(new Date());
//   const lastActiveDateLookup = await lookupService.getOrCreateLookup('lastActiveDate', today);
//   const streakStartDateLookup = await lookupService.getOrCreateLookup('streakStartDate', today);

//   const lastActiveDate = lookupService.removeTimeFromDate(new Date(lastActiveDateLookup.value));
//   const streakStartDate = lookupService.removeTimeFromDate(new Date(streakStartDateLookup.value));

//   const differenceToLastActiveDateInDays = Math.floor((today - lastActiveDate) / (1000 * 3600 * 24));
//   const differenceToStreakStartDateInDays = Math.floor((today - streakStartDate) / (1000 * 3600 * 24));

//   if (differenceToLastActiveDateInDays > 1) {
//     lookupService.updateValue('streak', 1);
//     lookupService.updateValue('streakStartDate', today);
//   } else {
//     lookupService.updateValue('streak', differenceToStreakStartDateInDays + 1);
//   }
// };

const handleDBVersion = async () => {
  const dbVersion = await lookupService.getOrCreateLookup('dbVersion', '1.0.0');
  if (dbVersion)
    console.info('dbVersion: ', dbVersion.value);
  else
    console.info('dbVersion not found');
}

// Register custom protocol scheme as privileged before app is ready
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'media-file',
    privileges: {
      secure: true,
      standard: true,
      stream: true,
      supportsFetchAPI: true,
      corsEnabled: false
    }
  }
]);

app.whenReady().then(async () => {
  // Register a simple file protocol for serving media files
  protocol.registerFileProtocol('media-file', (request, callback) => {
    try {
      console.log('🎵 Protocol handler received request:', request.url);
      
      const url = new URL(request.url);
      let filePath = url.pathname;
      
      // Handle different URL formats
      if (url.hostname && url.hostname.length === 1) {
        // Format: media-file://c/Users/... -> c:/Users/...
        filePath = url.hostname + ':' + url.pathname;
      } else {
        // Format: media-file:///C:/Users/... -> C:/Users/...
        // Remove leading slash
        if (filePath.startsWith('/')) {
          filePath = filePath.substring(1);
        }
      }
      
      // Decode URL-encoded characters (spaces, special chars, etc.)
      filePath = decodeURIComponent(filePath);
      
      // Convert forward slashes back to backslashes for Windows
      if (process.platform === 'win32') {
        filePath = filePath.replace(/\//g, '\\');
      }
      
      console.log('🎵 Final file path:', filePath);
      console.log('🎵 Is absolute path?', path.isAbsolute(filePath));
      
      // Security check - ensure the file path is absolute
      if (!path.isAbsolute(filePath)) {
        console.error('❌ File path is not absolute:', filePath);
        callback({ error: -6 }); // FILE_NOT_FOUND
        return;
      }
      
      // Check if file exists synchronously for callback-based API
      if (!fs.existsSync(filePath)) {
        console.error('❌ File does not exist:', filePath);
        callback({ error: -6 }); // FILE_NOT_FOUND
        return;
      }
      
      console.log('✅ Serving media file:', filePath);
      callback({ path: filePath });
      
    } catch (error) {
      console.error('❌ Error in protocol handler:', error.message);
      callback({ error: -6 }); // FILE_NOT_FOUND
    }
  });

  console.log('Custom media-file protocol registered successfully');
  
  console.info('main.js in when ready')
  initConfig();
  await startSequelize();
  // await initDB();
  initServices();
  // handleStreak();
  handleDBVersion();

  // require('./scripts/dateConverter'); // TODO DELETE

  createWindow();
  
  console.info('App started main.js');

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


export {
  mainWindow,
}
