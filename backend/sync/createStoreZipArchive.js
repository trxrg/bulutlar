import { ZipArchive } from 'archiver';

/**
 * STORED (uncompressed) zip stream used for .blt bundles and mobile-import exports.
 * Recompressing JPEG/MP3/MP4 wastes CPU with no meaningful size gain.
 */
export function createStoreZipArchive() {
    return new ZipArchive({ store: true });
}
