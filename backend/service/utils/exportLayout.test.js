import { describe, it, expect } from 'vitest';
import { resolveExportLayout } from './exportLayout.js';

describe('resolveExportLayout', () => {
    it('uses default title/subtitle sizes and A4 with normal margins', () => {
        const layout = resolveExportLayout({});
        expect(layout.titleFontSizePt).toBe(24);
        expect(layout.subtitleFontSizePt).toBe(11);
        expect(layout.documentTitleFontSizePt).toBe(30);
        expect(layout.docxTitleSize).toBe(48);
        expect(layout.pageSizeCss).toBe('A4');
        expect(layout.pageMarginCm).toBe('1.5cm');
        expect(layout.printableWidthIn).toBeCloseTo(210 / 25.4 - 2 * 1.5 / 2.54, 5);
    });

    it('clamps title and subtitle sizes and accepts strings', () => {
        expect(resolveExportLayout({ titleFontSize: '100' }).titleFontSizePt).toBe(48);
        expect(resolveExportLayout({ titleFontSize: 4 }).titleFontSizePt).toBe(12);
        expect(resolveExportLayout({ subtitleFontSize: '14' }).subtitleFontSizePt).toBe(14);
        expect(resolveExportLayout({ subtitleFontSize: 'abc' }).subtitleFontSizePt).toBe(11);
    });

    it('resolves custom margins (clamped) and page sizes', () => {
        const layout = resolveExportLayout({ pageMargin: 'custom', pageMarginCustomCm: '9', pageSize: 'Letter' });
        expect(layout.pageMarginCm).toBe('5cm');
        expect(layout.pageMarginTwips).toBe(2835);
        expect(layout.electronPageSize).toBe('Letter');
        expect(layout.pdfkitPageSize).toBe('LETTER');
        expect(resolveExportLayout({ pageSize: 'nope' }).pageSizeCss).toBe('A4');
    });
});
