const path = require('path');

const { app } = require('electron')
const isDev = app.isPackaged ? false : require('electron-is-dev');

const changeDbBackupFolderPath = (newPath) => {
    development.dbBackupFolderPath = newPath;
    production.dbBackupFolderPath = newPath;
}

const revertDbBackupFolderPath = () => {
    development.dbBackupFolderPath = path.resolve(__dirname, "../data/backup");
    production.dbBackupFolderPath = path.resolve(__dirname, "../../../data/backup");
}

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

const config = isDev ? development : production;

module.exports = {config, changeDbBackupFolderPath, revertDbBackupFolderPath};
