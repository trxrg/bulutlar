const TAILWIND_FONT_SIZE_TO_PT = {
    'text-xs': 9,
    'text-sm': 10,
    'text-base': 11,
    'text-lg': 12,
    'text-xl': 14,
    'text-2xl': 16,
    'text-3xl': 18,
    'text-4xl': 22,
    'text-5xl': 28,
};

const DEFAULT_FONT_SIZE_PT = 11;
const MIN_FONT_SIZE_PT = 8;
const MAX_FONT_SIZE_PT = 24;

// Article title and the info line under it ("subtitle"). Keep in sync with
// EXPORT_TITLE_FONT_SIZE_* / EXPORT_SUBTITLE_FONT_SIZE_* in src/utils/exportFontOptions.js.
const TITLE_FONT_SIZE = { min: 12, max: 48, default: 24 };
const SUBTITLE_FONT_SIZE = { min: 8, max: 24, default: 11 };
// The merged document's own title is drawn a step larger than article titles.
const DOCUMENT_TITLE_SCALE = 1.25;

const clampPt = (value, { min, max, default: fallback }) => {
    const parsed = typeof value === 'number' ? value : parseInt(value, 10);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(max, Math.max(min, Math.round(parsed)));
};

const PAGE_MARGIN_CM = {
    narrow: '1cm',
    normal: '1.5cm',
    wide: '2.5cm',
};

export const CUSTOM_PAGE_MARGIN_MIN_CM = 0.5;
export const CUSTOM_PAGE_MARGIN_MAX_CM = 5;
const DEFAULT_CUSTOM_PAGE_MARGIN_CM = 1.5;
const TWIPS_PER_CM = 567;
const CM_PER_INCH = 2.54;
const PT_PER_CM = 72 / CM_PER_INCH;

const MM_PER_INCH = 25.4;

// css: @page size keyword; electron: printToPDF pageSize (name, or inches);
// pdfkit: PDFDocument size; widthIn: portrait page width in inches.
const PAGE_SIZES = {
    A3: { css: 'A3', electron: 'A3', pdfkit: 'A3', widthIn: 297 / MM_PER_INCH },
    A4: { css: 'A4', electron: 'A4', pdfkit: 'A4', widthIn: 210 / MM_PER_INCH },
    A5: { css: 'A5', electron: 'A5', pdfkit: 'A5', widthIn: 148 / MM_PER_INCH },
    B5: { css: 'B5', electron: { width: 176 / MM_PER_INCH, height: 250 / MM_PER_INCH }, pdfkit: 'B5', widthIn: 176 / MM_PER_INCH },
    Letter: { css: 'letter', electron: 'Letter', pdfkit: 'LETTER', widthIn: 8.5 },
    Legal: { css: 'legal', electron: 'Legal', pdfkit: 'LEGAL', widthIn: 8.5 },
};
const DEFAULT_PAGE_SIZE = 'A4';

const resolvePageMarginCm = (options) => {
    if (options.pageMargin === 'custom') {
        const value = parseFloat(options.pageMarginCustomCm);
        const cm = Number.isFinite(value) ? value : DEFAULT_CUSTOM_PAGE_MARGIN_CM;
        return Math.min(CUSTOM_PAGE_MARGIN_MAX_CM, Math.max(CUSTOM_PAGE_MARGIN_MIN_CM, cm));
    }
    return parseFloat(PAGE_MARGIN_CM[options.pageMargin] || PAGE_MARGIN_CM.normal);
};

// Matches editor line-height presets (Tailwind leading-* ratios).
const LINE_SPACING_PRESETS = {
    tight: { lineHeightCss: 1.25, docxLineSpacing: 300, pdfLineGap: 2 },
    normal: { lineHeightCss: 1.5, docxLineSpacing: 360, pdfLineGap: 4 },
    relaxed: { lineHeightCss: 1.625, docxLineSpacing: 390, pdfLineGap: 6 },
    loose: { lineHeightCss: 2, docxLineSpacing: 480, pdfLineGap: 9 },
    'very loose': { lineHeightCss: 2.5, docxLineSpacing: 600, pdfLineGap: 12 },
};

const DEFAULT_LINE_SPACING = LINE_SPACING_PRESETS.relaxed;

const normalizeFontSizePt = (fontSize) => {
    if (typeof fontSize === 'number' && Number.isFinite(fontSize)) {
        return Math.min(MAX_FONT_SIZE_PT, Math.max(MIN_FONT_SIZE_PT, Math.round(fontSize)));
    }
    if (typeof fontSize === 'string' && TAILWIND_FONT_SIZE_TO_PT[fontSize] != null) {
        return TAILWIND_FONT_SIZE_TO_PT[fontSize];
    }
    const parsed = parseInt(fontSize, 10);
    if (Number.isFinite(parsed)) {
        return Math.min(MAX_FONT_SIZE_PT, Math.max(MIN_FONT_SIZE_PT, parsed));
    }
    return DEFAULT_FONT_SIZE_PT;
};

export const extractPrimaryFontName = (fontFamily) => {
    if (!fontFamily || fontFamily === 'system-ui') return null;
    const quoted = fontFamily.match(/"([^"]+)"/);
    if (quoted) return quoted[1];
    const first = fontFamily.split(',')[0].trim().replace(/['"]/g, '');
    return first || null;
};

const extractDocxFont = (fontFamily) => {
    const primary = extractPrimaryFontName(fontFamily);
    if (!primary) return 'Segoe UI';
    return primary;
};

const resolveFontFamilyCss = (fontFamily) => {
    if (!fontFamily || fontFamily === 'system-ui') {
        return "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    }
    return fontFamily;
};

const resolveTextAlignment = (textAlignment) => {
    if (textAlignment === 'left') {
        return {
            textAlignCss: 'left',
            docxAlignment: 'left',
        };
    }
    return {
        textAlignCss: 'justify',
        docxAlignment: 'both',
    };
};

const resolveLineSpacing = (lineSpacing) => {
    const preset = LINE_SPACING_PRESETS[lineSpacing] || DEFAULT_LINE_SPACING;
    return {
        lineHeightCss: preset.lineHeightCss,
        docxLineSpacing: preset.docxLineSpacing,
        pdfLineGap: preset.pdfLineGap,
    };
};

export function resolveExportLayout(options = {}) {
    const fontSizePt = normalizeFontSizePt(options.fontSize);
    const pageMarginCm = resolvePageMarginCm(options);
    const pageSizeKey = PAGE_SIZES[options.pageSize] ? options.pageSize : DEFAULT_PAGE_SIZE;
    const pageSize = PAGE_SIZES[pageSizeKey];
    const docxBodySize = fontSizePt * 2; // Word half-points
    const titleFontSizePt = clampPt(options.titleFontSize, TITLE_FONT_SIZE);
    const subtitleFontSizePt = clampPt(options.subtitleFontSize, SUBTITLE_FONT_SIZE);
    const documentTitleFontSizePt = Math.round(titleFontSizePt * DOCUMENT_TITLE_SCALE);
    const pageMarginIn = pageMarginCm / CM_PER_INCH;
    const alignment = resolveTextAlignment(options.textAlignment);
    const spacing = resolveLineSpacing(options.lineSpacing);

    return {
        fontSizePt,
        fontSizeCss: `${fontSizePt}pt`,
        docxBodySize,
        titleFontSizePt,
        subtitleFontSizePt,
        documentTitleFontSizePt,
        docxTitleSize: titleFontSizePt * 2,
        docxSubtitleSize: subtitleFontSizePt * 2,
        docxDocumentTitleSize: documentTitleFontSizePt * 2,
        docxHeadingSize: Math.round(docxBodySize * 1.1),
        fontFamilyCss: resolveFontFamilyCss(options.fontFamily),
        docxFont: extractDocxFont(options.fontFamily),
        pageMarginCm: `${pageMarginCm}cm`,
        pageMarginTwips: Math.round(pageMarginCm * TWIPS_PER_CM),
        pageMarginPt: pageMarginCm * PT_PER_CM,
        pageMarginIn,
        // Width available to content (images are sized to this).
        printableWidthIn: Math.max(1, pageSize.widthIn - 2 * pageMarginIn),
        pageSizeCss: pageSize.css,
        electronPageSize: pageSize.electron,
        pdfkitPageSize: pageSize.pdfkit,
        textAlignCss: alignment.textAlignCss,
        docxAlignment: alignment.docxAlignment,
        lineHeightCss: spacing.lineHeightCss,
        docxLineSpacing: spacing.docxLineSpacing,
        pdfLineGap: spacing.pdfLineGap,
    };
}
