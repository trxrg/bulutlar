const path = require('path');
const { app } = require('electron')
const isDev = app.isPackaged ? false : require('electron-is-dev');

const development = {
    env: 'development',
    logFilePath: path.resolve(__dirname, "../logs/app.log"),
    contentDbPath: path.resolve(__dirname, "../data/active/content.db"),
    programDbPath: path.resolve(__dirname, "../data/active/program.db"),
    dbBackupFolderPath: path.resolve(__dirname, "../data/backup"),
    imagesFolderPath: path.resolve(__dirname, "../data/active/images"),
};

const production = {
    env: 'production',
    logFilePath: path.resolve(__dirname, "../../../logs/app.log"),
    contentDbPath: path.resolve(__dirname, "../../../data/active/content.db"),
    programDbPath: path.resolve(__dirname, "../../../data/active/program.db"),
    dbBackupFolderPath: path.resolve(__dirname, "../../../data/backup"),
    imagesFolderPath: path.resolve(__dirname, "../../../data/active/images"),
};

const changeDbBackupFolderPath = (newPath) => {
    development.dbBackupFolderPath = newPath;
    production.dbBackupFolderPath = newPath;
}

const revertDbBackupFolderPath = () => {
    development.dbBackupFolderPath = path.resolve(__dirname, "../data/backup");
    production.dbBackupFolderPath = path.resolve(__dirname, "../../../data/backup");
}

const initConfig = () => {
    // LOG CONFIGS
    const log = require('electron-log');
    log.transports.file.level = 'info';
    log.transports.file.maxSize = 5 * 1024 * 1024; // 5 MB
    log.transports.file.resolvePathFn = () => config.logFilePath;
    log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] [{processType}] {text}';

    log.transports.console.level = 'debug';
    log.transports.console.format = '{h}:{i}:{s}.{ms} [{level}] [{processType}] {text}';

    Object.assign(console, log.functions);

    console.info('Config initialized');
}

const config = isDev ? development : production;

module.exports = { config, initConfig, changeDbBackupFolderPath, revertDbBackupFolderPath };
