import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { app } from 'electron';
import { extractPrimaryFontName } from './exportLayout.js';
import { FONT_SUBSET_UNICODE_RANGES } from '../../../scripts/font-catalog.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let manifestCache = null;

export function getBundledFontsDir() {
    try {
        const appPath = app.getAppPath();
        const unpackedFonts = path.join(
            appPath.replace('app.asar', 'app.asar.unpacked'),
            'public',
            'fonts'
        );
        if (fs.existsSync(path.join(unpackedFonts, 'fonts-manifest.json'))) {
            return unpackedFonts;
        }
        const packagedFonts = path.join(appPath, 'public', 'fonts');
        if (fs.existsSync(path.join(packagedFonts, 'fonts-manifest.json'))) {
            return packagedFonts;
        }
    } catch {
        // Not running inside Electron (e.g. unit tests).
    }
    return path.resolve(__dirname, '../../../public/fonts');
}

function loadManifest() {
    if (!manifestCache) {
        const manifestPath = path.join(getBundledFontsDir(), 'fonts-manifest.json');
        manifestCache = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    }
    return manifestCache;
}

/** Inline @font-face rules for PDF/HTML export using local woff2 files (no network). */
export function buildBundledFontFaceCss(fontFamily) {
    const familyName = extractPrimaryFontName(fontFamily);
    if (!familyName) return '';

    const manifest = loadManifest();
    const entry = manifest[familyName];
    if (!entry?.files?.length) return '';

    const fontsDir = getBundledFontsDir();
    const sortedFiles = [...entry.files].sort((a, b) => {
        const subsetOrder = (file) => (file.subset === 'latin' || file.filename.includes('-latin-')) ? 0 : 1;
        const weightOrder = (file) => file.weight * 10 + (file.style === 'italic' ? 1 : 0);
        return weightOrder(a) - weightOrder(b) || subsetOrder(a) - subsetOrder(b);
    });

    return sortedFiles.map((file) => {
        const filePath = path.join(fontsDir, entry.package, file.filename);
        const url = pathToFileURL(filePath).href;
        const subset = file.subset || (file.filename.includes('-latin-ext-') ? 'latin-ext' : 'latin');
        const unicodeRange = FONT_SUBSET_UNICODE_RANGES[subset];
        const unicodeLine = unicodeRange ? `\n  unicode-range: ${unicodeRange};` : '';
        return `@font-face {
  font-family: '${familyName}';
  font-style: ${file.style};
  font-weight: ${file.weight};
  font-display: swap;${unicodeLine}
  src: url('${url}') format('woff2');
}`;
    }).join('\n');
}
