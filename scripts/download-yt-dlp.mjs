#!/usr/bin/env node
/**
 * Downloads yt-dlp binaries into resources/bin/{mac,win,linux}/.
 * Default: all platforms. Pass mac|win|linux to fetch one only.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outRoot = path.resolve(__dirname, '../resources/bin');

const ASSETS = {
    mac: {
        url: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos',
        name: 'yt-dlp',
    },
    win: {
        url: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe',
        name: 'yt-dlp.exe',
    },
    linux: {
        url: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp',
        name: 'yt-dlp',
    },
};

const arg = process.argv[2];
const targets = arg && arg !== 'all'
    ? [arg]
    : Object.keys(ASSETS);

for (const platform of targets) {
    const asset = ASSETS[platform];
    if (!asset) {
        console.error(`Unknown platform: ${platform}`);
        process.exit(1);
    }

    const destDir = path.join(outRoot, platform);
    fs.mkdirSync(destDir, { recursive: true });
    const dest = path.join(destDir, asset.name);

    console.log(`Downloading ${asset.url} -> ${dest}`);
    execSync(`curl -L "${asset.url}" -o "${dest}"`, { stdio: 'inherit' });
    if (platform !== 'win') fs.chmodSync(dest, 0o755);
}

console.log('Done.');
