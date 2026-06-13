import { FONT_FAMILY_SELECT_OPTIONS } from '../shared/fontCatalog.js';

export const EXPORT_FONT_FAMILY_OPTIONS = FONT_FAMILY_SELECT_OPTIONS;

export const DEFAULT_EXPORT_FONT_SIZE_PT = 11;
export const EXPORT_FONT_SIZE_MIN_PT = 8;
export const EXPORT_FONT_SIZE_MAX_PT = 24;

const EDITOR_TAILWIND_TO_PT = {
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

export const editorTailwindToPt = (fontSize) => {
    if (typeof fontSize === 'number' && Number.isFinite(fontSize)) {
        return Math.min(EXPORT_FONT_SIZE_MAX_PT, Math.max(EXPORT_FONT_SIZE_MIN_PT, Math.round(fontSize)));
    }
    if (typeof fontSize === 'string' && EDITOR_TAILWIND_TO_PT[fontSize] != null) {
        return EDITOR_TAILWIND_TO_PT[fontSize];
    }
    const parsed = parseInt(fontSize, 10);
    if (Number.isFinite(parsed)) {
        return Math.min(EXPORT_FONT_SIZE_MAX_PT, Math.max(EXPORT_FONT_SIZE_MIN_PT, parsed));
    }
    return DEFAULT_EXPORT_FONT_SIZE_PT;
};

export const EXPORT_PAGE_MARGIN_OPTIONS = [
    { value: 'narrow', labelKey: 'narrow margin' },
    { value: 'normal', labelKey: 'normal margin' },
    { value: 'wide', labelKey: 'wide margin' },
];

export const EXPORT_TEXT_ALIGNMENT_OPTIONS = [
    { value: 'left', labelKey: 'align left' },
    { value: 'justify', labelKey: 'justify text' },
];

export const EXPORT_LINE_SPACING_OPTIONS = [
    { value: 'tight', labelKey: 'tight' },
    { value: 'normal', labelKey: 'normal' },
    { value: 'relaxed', labelKey: 'relaxed' },
    { value: 'loose', labelKey: 'loose' },
    { value: 'very loose', labelKey: 'very loose' },
];
