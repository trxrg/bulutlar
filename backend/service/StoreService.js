import { ipcMain } from 'electron';
import Store from 'electron-store';

let store;

function initService() {
    ipcMain.handle('store/set', (event, key, value) => setState(key, value));
    ipcMain.handle('store/get', (event, key) => getState(key));
    store = new Store();
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
