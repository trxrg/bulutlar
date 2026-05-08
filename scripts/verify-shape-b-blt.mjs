/**
 * Builds a minimal empty-ops .blt via bundleBuilder and asserts Shape B:
 * - first 4 bytes = ZIP local file header (PK\x03\x04)
 * - first entry name is exactly manifest.json (UTF-8 bytes), archive root only —
 *   not ./manifest.json, not a subpath, case-sensitive (mobile tryReadShapeBLeadingManifest)
 * - compression method = 0 (STORED)
 *
 * Usage: from repo root, `node scripts/verify-shape-b-blt.mjs`
 */
import fs from 'fs';
import os from 'os';
import path from 'path';

import { build } from '../backend/sync/bundleBuilder.js';

const ZIP_LOCAL_HEADER_SIG = 0x04034b50;

/** Must match mobile `tryReadShapeBLeadingManifest` fast path: sole allowed first LFN. */
const SHAPE_B_FIRST_LOCAL_ENTRY_UTF8 = Buffer.from('manifest.json', 'utf8');

function assertShapeBFirstLocalEntryFileName(nameBytes) {
    if (nameBytes.length !== SHAPE_B_FIRST_LOCAL_ENTRY_UTF8.length) {
        throw new Error(
            `first local entry name must be exactly ${JSON.stringify(SHAPE_B_FIRST_LOCAL_ENTRY_UTF8.toString('utf8'))} (14 UTF-8 bytes); `
            + `got length ${nameBytes.length} (${JSON.stringify(nameBytes.toString('utf8'))})`,
        );
    }
    if (!nameBytes.equals(SHAPE_B_FIRST_LOCAL_ENTRY_UTF8)) {
        const asUtf8 = nameBytes.toString('utf8');
        throw new Error(
            `first local entry name must match ${JSON.stringify(SHAPE_B_FIRST_LOCAL_ENTRY_UTF8.toString('utf8'))} byte-for-byte (case-sensitive, no ./ prefix, no folders); `
            + `got ${JSON.stringify(asUtf8)}`,
        );
    }
}

function assertFirstZipEntryShapeB(bltPath) {
    const buf = fs.readFileSync(bltPath);
    if (buf.length < 30) throw new Error('.blt file too small for a ZIP local header');

    const sig = buf.readUInt32LE(0);
    if (sig !== ZIP_LOCAL_HEADER_SIG) {
        throw new Error(
            `expected ZIP local file header 0x${ZIP_LOCAL_HEADER_SIG.toString(16)} (PK\\x03\\x04) at offset 0, got 0x${sig.toString(16)}`,
        );
    }

    const compMethod = buf.readUInt16LE(8);
    const fnameLen = buf.readUInt16LE(26);
    const extraLen = buf.readUInt16LE(28);
    if (30 + fnameLen + extraLen > buf.length) {
        throw new Error('truncated ZIP local file header');
    }

    const nameBytes = buf.subarray(30, 30 + fnameLen);

    if (nameBytes.includes(0x2f) || nameBytes.includes(0x5c)) {
        throw new Error(
            `first local entry name must not be a subpath (no / or \\\\); got ${JSON.stringify(nameBytes.toString('utf8'))}`,
        );
    }

    assertShapeBFirstLocalEntryFileName(nameBytes);

    if (compMethod !== 0) {
        throw new Error(`manifest.json must be STORED (method 0), got ${compMethod}`);
    }
}

const emptyBuildInput = {
    articles: [],
    owners: [],
    categories: [],
    tags: [],
    groups: [],
    comments: [],
    annotations: [],
    images: [],
    audios: [],
    videos: [],
    articleTagRels: [],
    articleGroupRels: [],
    articleArticleRels: [],
    manualDeletes: [],
    autoDeletes: [],
    sourceAppVersion: 'verify-shape-b-blt',
};

async function main() {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bulutlar-blt-shape-b-'));
    const result = await build({
        ...emptyBuildInput,
        outputDir: tmp,
    });

    assertFirstZipEntryShapeB(result.filePath);

    const buf = fs.readFileSync(result.filePath);
    const fnameLen = buf.readUInt16LE(26);
    const extraLen = buf.readUInt16LE(28);
    const dataOff = 30 + fnameLen + extraLen;
    const compSize = buf.readUInt32LE(18);
    const uncompSize = buf.readUInt32LE(22);
    if (compSize !== uncompSize) {
        throw new Error('manifest.json entry compressed size mismatch — expected STORED');
    }
    const payload = buf.subarray(dataOff, dataOff + compSize);
    const parsed = JSON.parse(payload.toString('utf8'));
    if (parsed.bundleLayout !== 'shape-b-zip') {
        throw new Error(`expected manifest.bundleLayout shape-b-zip, got ${JSON.stringify(parsed.bundleLayout)}`);
    }
    if (parsed.format !== 'bulutlar-sync' || parsed.formatVersion !== 1) {
        throw new Error('manifest format / formatVersion mismatch');
    }

    fs.rmSync(tmp, { recursive: true, force: true });

    console.log('verify-shape-b-blt: OK (minimal bundle Shape B layout + manifest payload)');
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
