import { describe, it, expect, vi } from 'vitest';

vi.mock('./bundledFonts.js', () => ({ buildBundledFontFaceCss: () => '' }));

const { buildMergedHTMLString, fillTableOfContentsPageNumbers } = await import('./htmlGeneration.js');

const articleService = { resolveArticleEntities: async () => ({}) };
const articles = [
    { title: 'First', text: '<p>one</p>', images: [], comments: [] },
    { title: 'Second', text: '<p>two</p>', images: [], comments: [] },
];

describe('buildMergedHTMLString', () => {
    it('applies title/subtitle sizes, page size and print-safe responsive rules', async () => {
        const html = await buildMergedHTMLString(
            { articles, options: { mainText: true, titleFontSize: 30, subtitleFontSize: 13, pageSize: 'A5' }, documentTitle: 'Doc', translations: {} },
            '.', articleService, { includeTableOfContents: true },
        );
        expect(html).toMatch(/\.article-title \{\s*font-size: 30pt;/);
        expect(html).toMatch(/\.article-info \{\s*font-size: 13pt;/);
        expect(html).toMatch(/\.document-title \{\s*font-size: 38pt;/);
        expect(html).toMatch(/\.toc-title \{\s*font-size: 30pt;/);
        expect(html).toMatch(/size: A5;/);
        expect(html).toContain('@media screen and (max-width: 768px)');
    });

    it('anchors article titles and fills contents page numbers', async () => {
        const html = await buildMergedHTMLString(
            { articles, options: { mainText: true }, documentTitle: 'Doc', translations: { contents: 'İçindekiler' } },
            '.', articleService, { includeTableOfContents: true },
        );
        expect(html).toContain('id="article-0"');
        expect(html).toContain('href="#article-1"');
        expect(html).toContain('İçindekiler');

        const filled = fillTableOfContentsPageNumbers(html, [3, 7]);
        expect(filled).toContain('<span class="toc-page-number" data-toc-index="0">3</span>');
        expect(filled).toContain('<span class="toc-page-number" data-toc-index="1">7</span>');
    });

    it('omits the contents section unless requested', async () => {
        const html = await buildMergedHTMLString(
            { articles, options: { mainText: true }, documentTitle: 'Doc', translations: {} },
            '.', articleService,
        );
        expect(html).not.toContain('toc-page');
        expect(html).not.toContain('id="article-0"');
    });
});
