// Frozen constants for the desktop -> mobile sync wire format.
//
// These strings ship in every bundle's manifest.json and on-disk filename, so
// they MUST never change once Phase 3 ships. See docs/mobile-sync-plan.md
// §6 (manifest shape) and §1 (constants triple).
//
// SYNC_SCHEMA_VERSION starts at 1 for v1 of the on-disk format; bump only
// when the wire format breaks compat with mobile (e.g. a new required field
// in Operation, or a renamed entity). New optional fields don't require a
// bump.

export const SYNC_FORMAT = 'bulutlar-sync';
export const SYNC_FORMAT_VERSION = 1;
export const SYNC_FILE_EXT = '.blt';
export const SYNC_MIME_TYPE = 'application/vnd.bulutlar.sync+zip';
export const SYNC_IOS_UTI = 'com.bulutlar.sync';
export const SYNC_SOURCE_APP = 'bulutlar-desktop';
export const SYNC_SCHEMA_VERSION = 1;

// .blt header v1 (transport-level; independent of SYNC_FORMAT_VERSION /
// SYNC_SCHEMA_VERSION which describe the manifest/operations contract).
//
// Every .blt is a zip with a fixed-size prefix prepended so the receiver
// can render its confirm modal without unzipping. All offsets little-endian.
//
//     offset 0  : 4 bytes   magic = 'BLTM' (0x42 0x4C 0x54 0x4D)
//     offset 4  : 1 byte    header version = BLT_HEADER_VERSION
//     offset 5  : 4 bytes   manifest length, uint32 LE
//     offset 9  : N bytes   manifest.json (UTF-8)
//     offset 9+N: rest      standard zip with operations.json + media/
//
// manifest.json lives in the prefix and ONLY in the prefix — never in the
// inner zip. The prefix is the single source of truth.
//
// Standard zip readers locate the End Of Central Directory by scanning
// from the END of the file, so the prefix bytes are ignored: `unzip
// sample.blt` warns about "extra bytes at beginning" and extracts
// operations.json + media/ correctly. Mirror file:
// mobile/src/sync/syncConstants.js.
export const BLT_MAGIC = 'BLTM';
export const BLT_HEADER_VERSION = 1;
