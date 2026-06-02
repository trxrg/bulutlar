/**
 * Verifies that `archiver` sets the ZIP general-purpose bit 11 (the UTF-8 /
 * EFS language-encoding flag) on entries with non-ASCII names. This is the
 * load-bearing property for the desktop -> mobile export: without bit 11 the
 * receiver's zip library guesses the codepage and Turkish filenames stop
 * matching the DB `path` column.
 *
 * Usage: from repo root, `node scripts/verify-archiver-utf8-flag.mjs`
 */
import fs from 'fs';
import os from 'os';
import path from 'path';
import { createWriteStream } from 'fs';
import archiver from 'archiver';

const ZIP_LOCAL_HEADER_SIG = 0x04034b50;
const UTF8_FLAG = 0x0800; // bit 11

const ENTRY_NAME = 'audios/Türkçe ses, vol1.m4a';

function writeZip(filePath) {
    return new Promise((resolve, reject) => {
        const output = createWriteStream(filePath);
        const archive = archiver('zip', { store: true });
        output.on('close', resolve);
        output.on('error', reject);
        archive.on('error', reject);
        archive.on('warning', reject);
        archive.pipe(output);
        archive.append(Buffer.from('dummy audio bytes'), { name: ENTRY_NAME });
        archive.finalize();
    });
}

/** Walk every local file header and assert bit 11 is set on each. */
function assertAllLocalEntriesUtf8(zipPath) {
    const buf = fs.readFileSync(zipPath);
    let offset = 0;
    let checked = 0;
    while (offset + 30 <= buf.length) {
        const sig = buf.readUInt32LE(offset);
        if (sig !== ZIP_LOCAL_HEADER_SIG) break; // reached central directory
        const flags = buf.readUInt16LE(offset + 6);
        const fnameLen = buf.readUInt16LE(offset + 26);
        const extraLen = buf.readUInt16LE(offset + 28);
        const compSize = buf.readUInt32LE(offset + 18);
        const nameBytes = buf.subarray(offset + 30, offset + 30 + fnameLen);
        const name = nameBytes.toString('utf8');

        if ((flags & UTF8_FLAG) === 0) {
            throw new Error(
                `entry ${JSON.stringify(name)}: UTF-8 flag (bit 11) NOT set (flags=0x${flags.toString(16)})`,
            );
        }
        // Confirm the name bytes are the UTF-8 encoding of the original string.
        if (name !== ENTRY_NAME) {
            throw new Error(`entry name round-trip mismatch: got ${JSON.stringify(name)}`);
        }
        const expected = Buffer.from(ENTRY_NAME, 'utf8');
        if (!nameBytes.equals(expected)) {
            throw new Error('entry name bytes are not UTF-8 of the source string');
        }
        checked++;
        offset += 30 + fnameLen + extraLen + compSize;
    }
    if (checked === 0) throw new Error('no local file entries found');
    return checked;
}

async function main() {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bulutlar-archiver-utf8-'));
    const zipPath = path.join(tmp, 'test.zip');
    await writeZip(zipPath);
    const n = assertAllLocalEntriesUtf8(zipPath);
    fs.rmSync(tmp, { recursive: true, force: true });
    console.log(`verify-archiver-utf8-flag: OK (bit 11 set on ${n} entry/entries, UTF-8 round-trip verified)`);
}

main().catch((err) => {
    console.error('verify-archiver-utf8-flag: FAILED');
    console.error(err);
    process.exit(1);
});
