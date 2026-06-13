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

const PAGE_MARGIN_CM = {
    narrow: '1cm',
    normal: '1.5cm',
    wide: '2.5cm',
};

// docx page margins in twips (~567 twips per cm).
const PAGE_MARGIN_TWIPS = {
    narrow: 567,
    normal: 850,
    wide: 1417,
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
    const pageMargin = options.pageMargin || 'normal';
    const docxBodySize = fontSizePt * 2; // Word half-points
    const alignment = resolveTextAlignment(options.textAlignment);
    const spacing = resolveLineSpacing(options.lineSpacing);

    return {
        fontSizePt,
        fontSizeCss: `${fontSizePt}pt`,
        docxBodySize,
        docxTitleSize: Math.round(docxBodySize * 1.45),
        docxHeadingSize: Math.round(docxBodySize * 1.1),
        fontFamilyCss: resolveFontFamilyCss(options.fontFamily),
        docxFont: extractDocxFont(options.fontFamily),
        pageMarginCm: PAGE_MARGIN_CM[pageMargin] || PAGE_MARGIN_CM.normal,
        pageMarginTwips: PAGE_MARGIN_TWIPS[pageMargin] || PAGE_MARGIN_TWIPS.normal,
        textAlignCss: alignment.textAlignCss,
        docxAlignment: alignment.docxAlignment,
        lineHeightCss: spacing.lineHeightCss,
        docxLineSpacing: spacing.docxLineSpacing,
        pdfLineGap: spacing.pdfLineGap,
    };
}
