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
    backgroundColor: '#000000', // Set window background to black immediately
    show: false, // Don't show window until ready
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

  // Show window only when ready to prevent white flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

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
  // Register a modern file protocol handler using protocol.handle with streaming support
  protocol.handle('media-file', async (request) => {
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
        return new Response('File not found', { status: 404 });
      }
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        console.error('❌ File does not exist:', filePath);
        return new Response('File not found', { status: 404 });
      }
      
      console.log('✅ Serving media file:', filePath);
      
      // Get file stats for size and streaming support
      const stats = fs.statSync(filePath);
      const fileSize = stats.size;
      
      // Get the MIME type based on file extension
      const ext = path.extname(filePath).toLowerCase();
      const mimeTypes = {
        '.mp4': 'video/mp4',
        '.webm': 'video/webm',
        '.ogg': 'video/ogg',
        '.mp3': 'audio/mpeg',
        '.wav': 'audio/wav',
        '.m4a': 'audio/mp4'
      };
      const mimeType = mimeTypes[ext] || 'application/octet-stream';
      
      // Handle range requests for video streaming
      const range = request.headers.get('range');
      
      if (range) {
        // Parse range header (e.g., "bytes=0-1023")
        const ranges = range.replace('bytes=', '').split('-');
        const start = parseInt(ranges[0], 10) || 0;
        const end = parseInt(ranges[1], 10) || fileSize - 1;
        const chunkSize = (end - start) + 1;
        
        console.log(`🎵 Range request: ${start}-${end}/${fileSize}`);
        
        // Create a read stream for the requested range
        const stream = fs.createReadStream(filePath, { start, end });
        const chunks = [];
        
        // Collect chunks from the stream
        for await (const chunk of stream) {
          chunks.push(chunk);
        }
        
        const buffer = Buffer.concat(chunks);
        
        return new Response(buffer, {
          status: 206, // Partial Content
          headers: {
            'Content-Type': mimeType,
            'Content-Length': chunkSize.toString(),
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
          }
        });
      } else {
        // Serve the entire file
        const fileBuffer = await readFile(filePath);
        
        return new Response(fileBuffer, {
          headers: {
            'Content-Type': mimeType,
            'Content-Length': fileSize.toString(),
            'Accept-Ranges': 'bytes',
          }
        });
      }
      
    } catch (error) {
      console.error('❌ Error in protocol handler:', error.message);
      return new Response('Internal server error', { status: 500 });
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
