const fs = require('fs');
const { ensureFolderExists } = require('./fsOps');
const path = require('path');
const config = require('./config.js');

const logFilePath = config.logFilePath;

ensureFolderExists(path.dirname(logFilePath));

function logToFile(level, ...args) {
    const message = args.join(' ');
    const logMessage = `${new Date().toISOString()} - ${level.toUpperCase()} - ${message}\n`;
    fs.appendFileSync(logFilePath, logMessage, 'utf8');
}

function log(...args) {
    if (config.env === 'development') {
        console.log(...args);
    }
    logToFile('log', ...args);
}

function error(...args) {
    if (config.env === 'development') {
        console.log(...args);
    }
    logToFile('error', ...args);
}

function warn(...args) {
    if (config.env === 'development') {
        console.log(...args);
    }
    logToFile('warn', ...args);
}

// Debugging logs
console.log('logFilePath:', logFilePath);
log('logFilePath:', logFilePath);

module.exports = {
    log,
    error,
    warn
};