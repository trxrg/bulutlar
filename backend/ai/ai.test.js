// @vitest-environment node
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { buildArticleText, buildSystemPrompt, htmlToPlain } from './articleText.js';
import { MODEL_CATALOG, getCatalogEntry, recommendedModelId } from './modelCatalog.js';
import { safeImportedFileName } from './modelStore.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');

// ------------------------------------------------------------ privacy rules
describe('AI code has no network access', () => {
    // modelDownloader.js is the single allowed exception: it fetches a pinned
    // public model file and never receives article data.
    const ALLOWED = new Set(['modelDownloader.js']);
    const NETWORK_PATTERNS = [
        /\bfetch\s*\(/,
        /from\s+['"]node:(https?|net|tls|dns|http2|dgram)['"]/,
        /from\s+['"](https?|net|tls|dns|http2|dgram)['"]/,
        /require\(\s*['"](node:)?(https?|net|tls|dns|http2|dgram)['"]\s*\)/,
        /\bnet\.request\b/,
        /\bWebSocket\b/,
        /\bXMLHttpRequest\b/,
        /\bresolveModelFile\b/,
        /\bcreateModelDownloader\b/,
        /\bshell\.openExternal\b/,
    ];

    const files = [
        ...fs.readdirSync(__dirname)
            .filter((f) => f.endsWith('.js') && !f.endsWith('.test.js') && !ALLOWED.has(f))
            .map((f) => path.join(__dirname, f)),
        path.join(repoRoot, 'backend/service/AIService.js'),
        path.join(repoRoot, 'src/components/article/read/right-panel/AIChatPanel.jsx'),
        path.join(repoRoot, 'src/components/settings/AISettings.jsx'),
    ];

    for (const file of files) {
        it(`${path.relative(repoRoot, file)} uses no network APIs`, () => {
            let src = fs.readFileSync(file, 'utf8');
            // The guard names the APIs it blocks; it never calls them.
            if (file.endsWith('networkGuard.js')) src = src.replace(/^.*(block\(|globalThis\.|\.prototype\.|import ).*$/gm, '');
            for (const re of NETWORK_PATTERNS) {
                expect(src, `${re} found`).not.toMatch(re);
            }
        });
    }

    it('the downloader only accepts catalog ids pinned to huggingface.co', () => {
        const src = fs.readFileSync(path.join(__dirname, 'modelDownloader.js'), 'utf8');
        expect(src).toMatch(/getCatalogEntry\(catalogId\)/);
        expect(src).toMatch(/ALLOWED_HOST = 'huggingface\.co'/);
    });

    it('the network guard blocks sockets, DNS and fetch in a real process', () => {
        const guard = path.join(__dirname, 'networkGuard.js');
        const script = `
            const { installNetworkGuard } = await import(${JSON.stringify(guard)});
            installNetworkGuard();
            const net = await import('node:net');
            const https = await import('node:https');
            const dns = await import('node:dns');
            const results = [];
            const tryIt = (name, fn) => { try { fn(); results.push(name + ':open'); } catch (e) { results.push(name + ':' + e.name); } };
            tryIt('socket', () => new net.Socket().connect(443, '1.1.1.1'));
            tryIt('net', () => net.connect(443, '1.1.1.1'));
            tryIt('https', () => https.request('https://example.com'));
            tryIt('dns', () => dns.lookup('example.com', () => {}));
            tryIt('fetch', () => fetch('https://example.com'));
            console.log(results.join(','));
        `;
        const out = spawnSync(process.execPath, ['--input-type=module', '-e', script], { encoding: 'utf8' });
        expect(out.stderr).toBe('');
        const results = out.stdout.trim().split(',');
        expect(results).toHaveLength(5);
        for (const r of results) expect(r).toMatch(/:NetworkBlockedError$/);
    });
});

// ------------------------------------------------------------ article text
describe('buildArticleText', () => {
    const article = {
        title: 'Köprüler',
        date: '2020-05-01T00:00:00.000Z',
        isDateUncertain: true,
        owner: { name: 'Ayşe' },
        category: { name: 'Mühendislik' },
        tags: [{ name: 'tarih' }, { name: 'yapı' }],
        explanation: '<p>Kısa açıklama</p>',
        text: '<h2>Giriş</h2><p>Roma <b>kemer</b> köprüleri.<img src="x.jpg"></p><p><a href="http://x">bağlantı</a></p>',
        comments: [{ text: '<p>Bir yorum</p>' }, { text: '' }],
        annotations: [{ quote: 'kemer', note: 'önemli' }, { quote: '', note: '' }],
    };

    it('includes metadata, body, comments and annotations as plain text', () => {
        const { header, body } = buildArticleText(article);
        expect(header).toContain('Title: Köprüler');
        expect(header).toContain('Date: 2020-05-01 (uncertain)');
        expect(header).toContain('Author: Ayşe');
        expect(header).toContain('Category: Mühendislik');
        expect(header).toContain('Tags: tarih, yapı');
        expect(body).toContain('Kısa açıklama');
        expect(body).toContain('Roma kemer köprüleri.');
        expect(body).toContain('bağlantı');
        expect(body).not.toContain('http://x');
        expect(body).not.toContain('<');
        expect(body).toContain('## Comments\nBir yorum');
        expect(body).toContain('> kemer\nNote: önemli');
    });

    it('handles a bare article', () => {
        const { header, body } = buildArticleText({ title: 'x' });
        expect(header).toBe('Title: x');
        expect(body).toBe('');
        expect(htmlToPlain(null)).toBe('');
    });

    it('builds a system prompt that wraps the article and flags truncation', () => {
        const p = buildSystemPrompt('ARTICLE', { truncated: true });
        expect(p).toContain('<article>\nARTICLE\n</article>');
        expect(p).toMatch(/cut off/);
        expect(buildSystemPrompt('A')).not.toMatch(/cut off/);
    });
});

// ---------------------------------------------------------------- catalog
describe('model catalog', () => {
    it('pins every entry to a huggingface commit with a sha256', () => {
        for (const m of MODEL_CATALOG) {
            expect(m.url).toMatch(/^https:\/\/huggingface\.co\/[\w.-]+\/[\w.-]+\/resolve\/[0-9a-f]{40}\/[\w.-]+\.gguf$/);
            expect(m.url.endsWith(`/${m.file}`)).toBe(true);
            expect(m.sha256).toMatch(/^[0-9a-f]{64}$/);
        }
        expect(new Set(MODEL_CATALOG.map((m) => m.id)).size).toBe(MODEL_CATALOG.length);
    });

    it('recommends a model that exists and fits in memory', () => {
        const GiB = 1024 ** 3;
        for (const ram of [8, 16, 24, 32, 64]) {
            const id = recommendedModelId(ram * GiB);
            const entry = getCatalogEntry(id);
            expect(entry).not.toBeNull();
            expect(entry.minRamGB).toBeLessThanOrEqual(ram);
        }
        expect(recommendedModelId(24 * GiB)).toBe('gemma-4-26b-a4b-q3');
    });

    it('sanitizes imported file names', () => {
        expect(safeImportedFileName('/a/b/My Model (1).gguf')).toBe('My_Model_1_.gguf');
        expect(safeImportedFileName('/a/../evil')).toBe('evil.gguf');
    });
});
