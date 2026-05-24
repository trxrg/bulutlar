import { ipcMain } from 'electron';
import Store from 'electron-store';
import path from 'path';
import { config } from '../config.js';

let store;

const SHARING_ADMIN_KEY = 'sharingAdminEnabled';

function isSharingAdminEnabled() {
    if (!store) return false;
    return store.get(SHARING_ADMIN_KEY) === true;
}

function setSharingAdminEnabled(value) {
    if (!store) return;
    store.set(SHARING_ADMIN_KEY, !!value);
}

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
    if (!store) return undefined;
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
    getState: (key) => getState(key),
    isSharingAdminEnabled,
    setSharingAdminEnabled,
};

export default storeService;
