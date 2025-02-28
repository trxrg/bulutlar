import path from 'path';
import { fileURLToPath } from 'url';
import { app } from 'electron';
import isDev from 'electron-is-dev';
import log from 'electron-log';
import Store from 'electron-store';

const store = new Store();

const userDataPath = app.getPath('userData');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDevMode = app.isPackaged ? false : isDev;

const storedDbBackupFolderPath = store.get('dbBackupFolderPath');

const development = {
    env: 'development',
    logFilePath: path.resolve(__dirname, "../logs/app.log"),
    contentDbPath: path.resolve(__dirname, "../data/active/content.db"),
    storeFolderPath: path.resolve(__dirname, "../data/active/"),
    dbBackupFolderPath: storedDbBackupFolderPath || path.resolve(__dirname, "../data/backup"),
    imagesFolderPath: path.resolve(__dirname, "../data/active/images"),
    publicFolderPath: path.resolve(__dirname, "../public"),
};

const production = {
    env: 'production',
    logFilePath: path.join(userDataPath, "/logs/app.log"),
    contentDbPath: path.join(userDataPath, "/data/active/content.db"),
    storeFolderPath: path.join(userDataPath, "/data/active/"),
    dbBackupFolderPath: storedDbBackupFolderPath || path.join(userDataPath, "/data/backup"),
    imagesFolderPath: path.join(userDataPath, "/data/active/images"),
    publicFolderPath: path.resolve(__dirname, '../public'),
};

const changeDbBackupFolderPath = (newPath) => {
    development.dbBackupFolderPath = newPath;
    production.dbBackupFolderPath = newPath;
    
    store.set('dbBackupFolderPath', newPath);
}

const revertDbBackupFolderPath = () => {
    development.dbBackupFolderPath = path.resolve(__dirname, "../data/backup");
    production.dbBackupFolderPath = path.resolve(__dirname, "../../../data/backup");
}

const initConfig = () => {
    // LOG CONFIGS
    log.initialize();
    log.transports.file.level = 'info';
    log.transports.file.maxSize = 5 * 1024 * 1024; // 5 MB
    log.transports.file.resolvePathFn = () => config.logFilePath;
    log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] [{processType}] {text}';

    log.transports.console.level = 'debug';
    log.transports.console.format = '{h}:{i}:{s}.{ms} [{level}] [{processType}] {text}';

    Object.assign(console, log.functions);

    console.info('Config initialized');
    console.info('userDataPath:', userDataPath);
}

const config = isDevMode ? development : production;

export { config, initConfig, changeDbBackupFolderPath, revertDbBackupFolderPath };
