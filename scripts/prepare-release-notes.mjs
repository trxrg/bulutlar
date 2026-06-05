/**
 * Extract release notes for the current package.json version from CHANGELOG.md
 * into release-notes.md for electron-builder / GitHub Releases.
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { extractVersionSection } from '../backend/lib/changelog.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const changelogPath = join(root, 'CHANGELOG.md');
const outputPath = join(root, 'release-notes.md');

if (!existsSync(changelogPath)) {
  console.error('CHANGELOG.md not found.');
  process.exit(1);
}

const changelog = readFileSync(changelogPath, 'utf8');
const notes = extractVersionSection(changelog, pkg.version);

if (!notes) {
  console.error(`No CHANGELOG section found for version ${pkg.version}.`);
  console.error('Add a ## [x.y.z] - date section before publishing.');
  process.exit(1);
}

writeFileSync(outputPath, `${notes}\n`, 'utf8');
console.log(`Wrote release notes for v${pkg.version} to release-notes.md`);
