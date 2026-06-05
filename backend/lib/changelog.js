const SECTION_HEADER_RE = /^## \[([^\]]+)\](?:\s*-\s*([^\n]+))?/gm;

export function compareVersions(a, b) {
  const pa = String(a).replace(/^v/i, '').split('.').map((n) => parseInt(n, 10) || 0);
  const pb = String(b).replace(/^v/i, '').split('.').map((n) => parseInt(n, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i += 1) {
    const da = pa[i] || 0;
    const db = pb[i] || 0;
    if (da !== db) return da < db ? -1 : 1;
  }
  return 0;
}

export function parseChangelog(content) {
  const sections = new Map();
  if (!content) return sections;

  const matches = [...content.matchAll(SECTION_HEADER_RE)];
  for (let i = 0; i < matches.length; i += 1) {
    const match = matches[i];
    const version = match[1].trim();
    if (version.toLowerCase() === 'unreleased') continue;

    const start = match.index + match[0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index : content.length;
    const body = content.slice(start, end).trim();
    sections.set(version, {
      date: match[2]?.trim() ?? null,
      body,
    });
  }

  return sections;
}

export function extractVersionSection(content, version) {
  const sections = parseChangelog(content);
  const entry = sections.get(version);
  if (!entry) return null;

  const dateSuffix = entry.date ? ` - ${entry.date}` : '';
  return `## [${version}]${dateSuffix}\n\n${entry.body}`.trim();
}

export function extractCumulativeNotes(content, fromVersion, toVersion) {
  const sections = parseChangelog(content);
  const versions = [...sections.keys()]
    .filter((v) => compareVersions(fromVersion, v) < 0 && compareVersions(v, toVersion) <= 0)
    .sort(compareVersions);

  if (versions.length === 0) return null;

  return versions
    .map((version) => {
      const entry = sections.get(version);
      const dateSuffix = entry.date ? ` - ${entry.date}` : '';
      return `## [${version}]${dateSuffix}\n\n${entry.body}`.trim();
    })
    .join('\n\n');
}
