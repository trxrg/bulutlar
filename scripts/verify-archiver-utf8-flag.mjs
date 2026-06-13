/**
 * Verifies that `archiver` sets the ZIP general-purpose bit 11 (the UTF-8 /
 * EFS language-encoding flag) on entries with non-ASCII names. This is the
 * load-bearing property for the desktop -> mobile export: without bit 11 the
 * receiver's zip library guesses the codepage and Turkish filenames stop
 * matching the DB `path` column.
 *
 * Usage: from repo root, `npm run verify:archiver-utf8`
 */
import fs from 'fs';
import os from 'os';
import path from 'path';
import { createWriteStream } from 'fs';
import { createStoreZipArchive } from '../backend/sync/createStoreZipArchive.js';
import {
    readLocalZipEntries,
    assertAllLocalEntriesUtf8,
} from '../backend/sync/zipLocalHeaders.js';

const ENTRY_NAME = 'audios/Türkçe ses, vol1.m4a';

function writeZip(filePath) {
    return new Promise((resolve, reject) => {
        const output = createWriteStream(filePath);
        const archive = createStoreZipArchive();
        output.on('close', resolve);
        output.on('error', reject);
        archive.on('error', reject);
        archive.on('warning', reject);
        archive.pipe(output);
        archive.append(Buffer.from('dummy audio bytes'), { name: ENTRY_NAME });
        archive.finalize();
    });
}

async function main() {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bulutlar-archiver-utf8-'));
    const zipPath = path.join(tmp, 'test.zip');
    await writeZip(zipPath);
    const buf = fs.readFileSync(zipPath);
    const entries = readLocalZipEntries(buf);
    const n = assertAllLocalEntriesUtf8(entries, ENTRY_NAME);
    fs.rmSync(tmp, { recursive: true, force: true });
    console.log(`verify-archiver-utf8-flag: OK (bit 11 set on ${n} entry/entries, UTF-8 round-trip verified)`);
}

main().catch((err) => {
    console.error('verify-archiver-utf8-flag: FAILED');
    console.error(err);
    process.exit(1);
});
