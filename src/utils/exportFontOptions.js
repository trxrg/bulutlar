import { FONT_FAMILY_SELECT_OPTIONS } from '../shared/fontCatalog.js';

export const EXPORT_FONT_FAMILY_OPTIONS = FONT_FAMILY_SELECT_OPTIONS;

export const DEFAULT_EXPORT_FONT_SIZE_PT = 11;
export const EXPORT_FONT_SIZE_MIN_PT = 8;
export const EXPORT_FONT_SIZE_MAX_PT = 24;

// Article title and the info line under it. Keep in sync with
// TITLE_FONT_SIZE / SUBTITLE_FONT_SIZE in backend/service/utils/exportLayout.js.
export const EXPORT_TITLE_FONT_SIZE = { min: 12, max: 48, default: 24 };
export const EXPORT_SUBTITLE_FONT_SIZE = { min: 8, max: 24, default: 11 };

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
    { value: 'custom', labelKey: 'custom margin' },
];

// Keep in sync with CUSTOM_PAGE_MARGIN_* in backend/service/utils/exportLayout.js.
export const EXPORT_CUSTOM_MARGIN_MIN_CM = 0.5;
export const EXPORT_CUSTOM_MARGIN_MAX_CM = 5;

// Values match the PAGE_SIZES keys in backend/service/utils/exportLayout.js.
export const EXPORT_PAGE_SIZE_OPTIONS = [
    { value: 'A3', label: 'A3 (297 × 420 mm)' },
    { value: 'A4', label: 'A4 (210 × 297 mm)' },
    { value: 'A5', label: 'A5 (148 × 210 mm)' },
    { value: 'B5', label: 'B5 (176 × 250 mm)' },
    { value: 'Letter', label: 'Letter (8.5 × 11 in)' },
    { value: 'Legal', label: 'Legal (8.5 × 14 in)' },
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
