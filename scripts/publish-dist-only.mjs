/**
 * Upload existing dist/ artifacts to GitHub (no rebuild).
 * Requires GH_TOKEN in .env (via dotenv in npm scripts).
 *
 * Usage: node scripts/publish-dist-only.mjs <win|mac>
 */
import { existsSync, readdirSync, readFileSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const platform = process.argv[2];

if (platform !== 'win' && platform !== 'mac') {
  console.error('Usage: node scripts/publish-dist-only.mjs <win|mac>');
  process.exit(1);
}

const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const { name, version } = pkg;
const distDir = join(root, 'dist');

if (!existsSync(distDir)) {
  console.error('dist/ not found — run package-win / publish-win (or mac) first.');
  process.exit(1);
}

const distFiles = readdirSync(distDir, { withFileTypes: true })
  .filter((e) => e.isFile())
  .map((e) => e.name);

function collectWin(files, ver) {
  const base = `${name} Setup ${ver}`;
  return files.filter(
    (f) => f === `${base}.exe` || f === `${base}.exe.blockmap` || f === 'latest.yml',
  );
}

function collectMac(files, ver) {
  const prefix = `${name}-${ver}`;
  return files.filter(
    (f) =>
      (f.startsWith(prefix) &&
        (f.endsWith('.dmg') ||
          f.endsWith('.zip') ||
          f.endsWith('.dmg.blockmap') ||
          f.endsWith('.zip.blockmap'))) ||
      f === 'latest-mac.yml',
  );
}

const selected =
  platform === 'win' ? collectWin(distFiles, version) : collectMac(distFiles, version);

if (selected.length === 0) {
  console.error(
    `No ${platform} artifacts in dist/. Files present: ${distFiles.join(', ') || '(none)'}`,
  );
  process.exit(1);
}

const cli = join(root, 'node_modules', 'electron-builder', 'cli.js');
const args = ['publish', '--policy', 'always', '-v', version];
for (const f of selected.sort()) {
  args.push('-f', join(distDir, f));
}

console.log(`Publishing ${platform} (${version}):`);
for (const f of selected.sort()) {
  console.log(`  - ${f}`);
}

// Run via node (not shell/npx) so paths with spaces stay one argument on Windows.
const result = spawnSync(process.execPath, [cli, ...args], {
  cwd: root,
  stdio: 'inherit',
  windowsHide: true,
});
process.exit(result.status ?? 1);
