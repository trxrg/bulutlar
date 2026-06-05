/**
 * If the GitHub release for the current version has an empty body,
 * populate it from CHANGELOG.md via the GitHub API.
 *
 * Requires GH_TOKEN (or GITHUB_TOKEN) in the environment.
 */
import { readFileSync, existsSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { extractVersionSection } from '../backend/lib/changelog.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const { version } = pkg;
const owner = pkg.build?.publish?.owner ?? 'trxrg';
const repo = pkg.build?.publish?.repo ?? 'bulutlar';
const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
const tag = `v${version}`;

if (!token) {
  console.warn('GH_TOKEN not set — skipping GitHub release notes backfill.');
  process.exit(0);
}

const changelogPath = join(root, 'CHANGELOG.md');
if (!existsSync(changelogPath)) {
  console.error('CHANGELOG.md not found.');
  process.exit(1);
}

const notes = extractVersionSection(readFileSync(changelogPath, 'utf8'), version);
if (!notes) {
  console.error(`No CHANGELOG section found for version ${version}.`);
  process.exit(1);
}

const apiBase = `https://api.github.com/repos/${owner}/${repo}`;
const headers = {
  Accept: 'application/vnd.github+json',
  Authorization: `Bearer ${token}`,
  'User-Agent': 'bulutlar-release-notes',
  'X-GitHub-Api-Version': '2022-11-28',
};

async function getReleaseByTag() {
  const response = await fetch(`${apiBase}/releases/tags/${encodeURIComponent(tag)}`, { headers });
  if (response.status === 404) {
    console.warn(`GitHub release ${tag} not found yet — electron-builder may still be creating it.`);
    return null;
  }
  if (!response.ok) {
    throw new Error(`Failed to fetch release ${tag}: HTTP ${response.status}`);
  }
  return response.json();
}

async function updateReleaseBody(releaseId, body) {
  const response = await fetch(`${apiBase}/releases/${releaseId}`, {
    method: 'PATCH',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ body }),
  });
  if (!response.ok) {
    throw new Error(`Failed to update release ${tag}: HTTP ${response.status}`);
  }
  return response.json();
}

const release = await getReleaseByTag();
if (!release) {
  process.exit(0);
}

const existingBody = (release.body ?? '').trim();
if (existingBody) {
  console.log(`GitHub release ${tag} already has release notes — nothing to do.`);
  process.exit(0);
}

await updateReleaseBody(release.id, notes);
console.log(`Updated empty GitHub release ${tag} with CHANGELOG notes.`);
