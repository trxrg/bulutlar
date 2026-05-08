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

/** Optional `manifest.bundleLayout` on Shape B exports (debugging / tooling). */
export const SYNC_BUNDLE_LAYOUT_SHAPE_B_ZIP = 'shape-b-zip';

// Legacy Shape A only — fixed BLTM prefix + raw manifest UTF-8 + inner ZIP.
// Desktop **writers** must not use this; mobile may still read old bundles.
// (Mirror legacy constants in mobile/src/sync/syncConstants.js.)
/** @deprecated Legacy Shape A reader metadata only. */
export const BLT_MAGIC = 'BLTM';
/** @deprecated Legacy Shape A reader metadata only. */
export const BLT_HEADER_VERSION = 1;
