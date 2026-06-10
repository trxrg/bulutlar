import { execSync } from 'child_process';
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sqlite3Dir = path.join(__dirname, '..', 'node_modules', 'sqlite3');
const electronVersion = require('electron/package.json').version;

console.log(`Rebuilding sqlite3 for Electron ${electronVersion}...`);

execSync(
    `npx node-gyp rebuild --target=${electronVersion} --arch=x64 --dist-url=https://electronjs.org/headers`,
    { cwd: sqlite3Dir, stdio: 'inherit' },
);

console.log('sqlite3 rebuild complete.');
