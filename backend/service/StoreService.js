import { ipcMain } from 'electron';
import Store from 'electron-store';
import path from 'path';
import { config } from '../config.js';

let store;

function initService() {
    store = new Store({
        cwd: config.storeFolderPath,
    });
    
    ipcMain.handle('store/set', (event, key, value) => setState(key, value));
    ipcMain.handle('store/get', (event, key) => getState(key));
}

function setState(key, value) {
    store.set(key, value);
}

function getState(key) {
    return store.get(key);
}

const storeService = {
    initService,
};

export default storeService;
