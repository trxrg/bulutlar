import { shell } from 'electron';

export function showItemInFolder(filePath) {
    if (typeof filePath !== 'string' || filePath.length === 0) return false;
    try {
        shell.showItemInFolder(filePath);
        return true;
    } catch (err) {
        console.warn('showItemInFolder failed:', err);
        return false;
    }
}
