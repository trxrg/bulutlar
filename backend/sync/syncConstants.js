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
