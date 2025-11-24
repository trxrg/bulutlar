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
    ipcMain.handle('store/delete', (event, key) => deleteState(key));
    ipcMain.handle('store/clear', () => clearState());
    ipcMain.handle('store/deleteMany', (event, keys) => deleteManyStates(keys));
}

function setState(key, value) {
    store.set(key, value);
}

function getState(key) {
    return store.get(key);
}

function deleteState(key) {
    store.delete(key);
}

function clearState() {
    store.clear();
}

function deleteManyStates(keys) {
    keys.forEach(key => store.delete(key));
}

const storeService = {
    initService,
};

export default storeService;
