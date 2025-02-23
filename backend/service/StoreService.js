import { ipcMain } from 'electron';
import Store from 'electron-store';

function initService() {
    ipcMain.handle('store/set', (key, value) => setState(key, value));
    ipcMain.handle('store/get', (key) => getState(key));
}

function setState(key, value) {
    const store = new Store();
    store.set(key, value);
}

function getState(key) {
    const store = new Store();
    return store.get(key);
}

const storeService = {
    initService,
};

export default storeService;
