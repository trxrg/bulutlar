import { ipcMain } from 'electron';
import crypto from 'node:crypto';
import storeService from './StoreService.js';

// Override at build/run time: BULUTLAR_ADMIN_PASSPHRASE=your-secret npm run dev
const ADMIN_PASSPHRASE = process.env.BULUTLAR_ADMIN_PASSPHRASE || 'bulutlar-admin';

function verifyPassphrase(passphrase) {
    if (typeof passphrase !== 'string') return false;
    const expected = Buffer.from(ADMIN_PASSPHRASE, 'utf8');
    const actual = Buffer.from(passphrase, 'utf8');
    if (expected.length !== actual.length) return false;
    return crypto.timingSafeEqual(expected, actual);
}

function initService() {
    ipcMain.handle('admin/isEnabled', async () => storeService.isSharingAdminEnabled());

    ipcMain.handle('admin/unlock', async (_event, passphrase) => {
        if (!verifyPassphrase(passphrase)) return false;
        storeService.setSharingAdminEnabled(true);
        return true;
    });

    ipcMain.handle('admin/lock', async () => {
        storeService.setSharingAdminEnabled(false);
        return true;
    });

    console.info('AdminService initialized');
}

const adminService = {
    initService,
};

export default adminService;
