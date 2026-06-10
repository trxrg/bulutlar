import { execSync } from 'child_process';

console.log('Rebuilding sqlite3 for Electron...');

execSync('npx @electron/rebuild -f -w sqlite3', { stdio: 'inherit' });

console.log('sqlite3 rebuild complete.');
