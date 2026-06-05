import { readFile } from 'fs/promises';
import path from 'node:path';
import { app } from 'electron';
import log from 'electron-log';
import { extractCumulativeNotes } from '../lib/changelog.js';

const GITHUB_OWNER = 'trxrg';
const GITHUB_REPO = 'bulutlar';
const REMOTE_CHANGELOG_URL = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/main/CHANGELOG.md`;

async function readBundledChangelog() {
  const candidates = [
    path.join(app.getAppPath(), 'CHANGELOG.md'),
    path.join(process.cwd(), 'CHANGELOG.md'),
  ];

  for (const filePath of candidates) {
    try {
      return await readFile(filePath, 'utf8');
    } catch {
      // try next location
    }
  }

  return null;
}

async function fetchRemoteChangelog() {
  try {
    const response = await fetch(REMOTE_CHANGELOG_URL, {
      headers: { 'User-Agent': 'bulutlar-updater' },
    });
    if (!response.ok) {
      log.warn(`Remote changelog fetch failed: HTTP ${response.status}`);
      return null;
    }
    return await response.text();
  } catch (error) {
    log.warn('Remote changelog fetch failed:', error);
    return null;
  }
}

async function loadChangelog() {
  const remote = await fetchRemoteChangelog();
  if (remote) return remote;

  const bundled = await readBundledChangelog();
  if (bundled) return bundled;

  return null;
}

async function getCumulativeNotes(fromVersion, toVersion) {
  if (!fromVersion || !toVersion || fromVersion === toVersion) {
    return null;
  }

  const content = await loadChangelog();
  if (!content) return null;

  return extractCumulativeNotes(content, fromVersion, toVersion);
}

export default {
  getCumulativeNotes,
};
