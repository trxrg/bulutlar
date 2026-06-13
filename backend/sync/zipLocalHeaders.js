/**
 * Low-level ZIP local-header inspection for Bulutlar export bundles.
 * Used to verify archiver sets UTF-8 names (GP bit 11) and STORED entries.
 */

export const ZIP_LOCAL_HEADER_SIG = 0x04034b50;
export const UTF8_FLAG = 0x0800; // general-purpose bit 11 (EFS / UTF-8 names)

/** @typedef {{ name: string, flags: number, compressionMethod: number, compSize: number, nameBytes: Buffer, dataOffset: number }} LocalZipEntry */

/**
 * Walk local file headers in a ZIP buffer (stops at central directory).
 * @param {Buffer} buf
 * @returns {LocalZipEntry[]}
 */
export function readLocalZipEntries(buf) {
    const entries = [];
    let offset = 0;

    while (offset + 30 <= buf.length) {
        const sig = buf.readUInt32LE(offset);
        if (sig !== ZIP_LOCAL_HEADER_SIG) break;

        const flags = buf.readUInt16LE(offset + 6);
        const compressionMethod = buf.readUInt16LE(offset + 8);
        const compSize = buf.readUInt32LE(offset + 18);
        const fnameLen = buf.readUInt16LE(offset + 26);
        const extraLen = buf.readUInt16LE(offset + 28);
        const nameBytes = buf.subarray(offset + 30, offset + 30 + fnameLen);
        const name = nameBytes.toString('utf8');
        const dataOffset = offset + 30 + fnameLen + extraLen;

        entries.push({
            name,
            flags,
            compressionMethod,
            compSize,
            nameBytes,
            dataOffset,
        });

        offset = dataOffset + compSize;
    }

    return entries;
}

/**
 * @param {LocalZipEntry[]} entries
 * @param {string} [expectedName] optional exact name round-trip check
 */
export function assertAllLocalEntriesUtf8(entries, expectedName) {
    if (entries.length === 0) {
        throw new Error('no local file entries found');
    }

    for (const entry of entries) {
        if (/[^\x00-\x7F]/.test(entry.name)) {
            if ((entry.flags & UTF8_FLAG) === 0) {
                throw new Error(
                    `entry ${JSON.stringify(entry.name)}: UTF-8 flag (bit 11) NOT set `
                    + `(flags=0x${entry.flags.toString(16)})`,
                );
            }
        }

        if (expectedName && entry.name === expectedName) {
            const expectedBytes = Buffer.from(expectedName, 'utf8');
            if (!entry.nameBytes.equals(expectedBytes)) {
                throw new Error('entry name bytes are not UTF-8 of the source string');
            }
        }
    }

    return entries.length;
}

/**
 * @param {LocalZipEntry[]} entries
 */
export function assertAllLocalEntriesStored(entries) {
    for (const entry of entries) {
        if (entry.compressionMethod !== 0) {
            throw new Error(
                `entry ${JSON.stringify(entry.name)}: expected STORED (method 0), `
                + `got method ${entry.compressionMethod}`,
            );
        }
    }
}

/**
 * @param {Buffer} buf
 * @param {string} entryName
 * @returns {Buffer}
 */
export function readStoredEntryPayload(buf, entryName) {
    const entry = readLocalZipEntries(buf).find((e) => e.name === entryName);
    if (!entry) {
        throw new Error(`entry not found: ${entryName}`);
    }
    if (entry.compressionMethod !== 0) {
        throw new Error(`entry ${entryName} is not STORED`);
    }
    return buf.subarray(entry.dataOffset, entry.dataOffset + entry.compSize);
}
