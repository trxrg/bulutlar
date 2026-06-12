/**
 * Copies @fontsource woff2 files into public/fonts/ and writes fonts.css +
 * fonts-manifest.json for offline editor + PDF export.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
    FONT_CATALOG,
    BUNDLED_FONT_VARIANTS,
    BUNDLED_FONT_SUBSETS,
    FONT_SUBSET_UNICODE_RANGES,
} from './font-catalog.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'public', 'fonts');
const nodeModules = path.join(root, 'node_modules');

function ensureDir(dir) {
    fs.mkdirSync(dir, { recursive: true });
}

function buildFontFaceRule({ family, style, weight, packageName, filename, subset }) {
    const unicodeRange = FONT_SUBSET_UNICODE_RANGES[subset];
    const unicodeLine = unicodeRange ? `\n  unicode-range: ${unicodeRange};` : '';
    return `@font-face {
  font-family: '${family}';
  font-style: ${style};
  font-weight: ${weight};
  font-display: swap;${unicodeLine}
  src: url('./${packageName}/${filename}') format('woff2');
}`;
}

function copyFontFiles() {
    ensureDir(outDir);
    const cssRules = [];
    const manifest = {};
    const warnings = [];

    for (const entry of FONT_CATALOG) {
        if (!entry.package) continue;

        const pkgDir = path.join(nodeModules, '@fontsource', entry.package, 'files');
        const metaPath = path.join(nodeModules, '@fontsource', entry.package, 'metadata.json');
        if (!fs.existsSync(pkgDir)) {
            console.warn(`[copy-bundled-fonts] missing package files: ${entry.package}`);
            continue;
        }

        const meta = fs.existsSync(metaPath)
            ? JSON.parse(fs.readFileSync(metaPath, 'utf8'))
            : null;
        const availableSubsets = BUNDLED_FONT_SUBSETS.filter(
            (subset) => !meta?.subsets || meta.subsets.includes(subset),
        );

        const destPkgDir = path.join(outDir, entry.package);
        ensureDir(destPkgDir);
        manifest[entry.family] = { package: entry.package, files: [] };

        for (const variant of BUNDLED_FONT_VARIANTS) {
            if (meta) {
                if (!meta.weights.includes(variant.weight)) continue;
                if (variant.style === 'italic' && !meta.styles.includes('italic')) continue;
            }

            let copiedLatin = false;
            for (const subset of availableSubsets) {
                const filename = `${entry.package}-${subset}-${variant.suffix}.woff2`;
                const src = path.join(pkgDir, filename);
                if (!fs.existsSync(src)) continue;

                const dest = path.join(destPkgDir, filename);
                fs.copyFileSync(src, dest);
                manifest[entry.family].files.push({
                    filename,
                    subset,
                    style: variant.style,
                    weight: variant.weight,
                });
                cssRules.push(buildFontFaceRule({
                    family: entry.family,
                    style: variant.style,
                    weight: variant.weight,
                    packageName: entry.package,
                    filename,
                    subset,
                }));
                if (subset === 'latin') copiedLatin = true;
            }

            if (!copiedLatin && manifest[entry.family].files.length > 0) {
                const extOnly = availableSubsets.includes('latin-ext')
                    && fs.existsSync(path.join(pkgDir, `${entry.package}-latin-ext-${variant.suffix}.woff2`));
                if (extOnly) {
                    warnings.push(`${entry.family} ${variant.suffix}: only latin-ext bundled (no latin file in package)`);
                }
            }
        }

        if (manifest[entry.family].files.length === 0) {
            delete manifest[entry.family];
            console.warn(`[copy-bundled-fonts] no files copied for ${entry.family}`);
        }
    }

    fs.writeFileSync(path.join(outDir, 'fonts.css'), `${cssRules.join('\n\n')}\n`, 'utf8');
    fs.writeFileSync(
        path.join(outDir, 'fonts-manifest.json'),
        JSON.stringify(manifest, null, 2),
        'utf8',
    );
    console.info(`[copy-bundled-fonts] wrote ${cssRules.length} @font-face rules to public/fonts/`);
    for (const warning of warnings) {
        console.warn(`[copy-bundled-fonts] ${warning}`);
    }
}

copyFontFiles();
