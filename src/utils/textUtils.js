/**
 * Text utility functions for text normalization, conversion, and regex operations
 */

const NORMALIZE_CHAR_MAP = {
    // Turkish
    'ç': 'c', 'Ç': 'C',
    'ğ': 'g', 'Ğ': 'G',
    'ı': 'i', 'İ': 'I',
    'ö': 'o', 'Ö': 'O',
    'ş': 's', 'Ş': 'S',
    'ü': 'u', 'Ü': 'U',
    // a variants
    'à': 'a', 'á': 'a', 'â': 'a', 'ã': 'a', 'ä': 'a', 'å': 'a', 'ā': 'a', 'ą': 'a',
    'À': 'A', 'Á': 'A', 'Â': 'A', 'Ã': 'A', 'Ä': 'A', 'Å': 'A', 'Ā': 'A', 'Ą': 'A',
    // e variants
    'è': 'e', 'é': 'e', 'ê': 'e', 'ë': 'e', 'ē': 'e', 'ę': 'e', 'ě': 'e',
    'È': 'E', 'É': 'E', 'Ê': 'E', 'Ë': 'E', 'Ē': 'E', 'Ę': 'E', 'Ě': 'E',
    // i variants
    'ì': 'i', 'í': 'i', 'î': 'i', 'ï': 'i', 'ī': 'i', 'į': 'i',
    'Ì': 'I', 'Í': 'I', 'Î': 'I', 'Ï': 'I', 'Ī': 'I', 'Į': 'I',
    // o variants
    'ò': 'o', 'ó': 'o', 'ô': 'o', 'õ': 'o', 'ō': 'o', 'ő': 'o', 'ǒ': 'o', 'ø': 'o',
    'Ò': 'O', 'Ó': 'O', 'Ô': 'O', 'Õ': 'O', 'Ō': 'O', 'Ő': 'O', 'Ǒ': 'O', 'Ø': 'O',
    // u variants
    'ù': 'u', 'ú': 'u', 'û': 'u', 'ū': 'u', 'ů': 'u', 'ű': 'u', 'ǔ': 'u',
    'Ù': 'U', 'Ú': 'U', 'Û': 'U', 'Ū': 'U', 'Ů': 'U', 'Ű': 'U', 'Ǔ': 'U',
    // other common
    'ć': 'c', 'č': 'c', 'Ć': 'C', 'Č': 'C',
    'ñ': 'n', 'ń': 'n', 'ň': 'n', 'ņ': 'n', 'Ñ': 'N', 'Ń': 'N', 'Ň': 'N', 'Ņ': 'N',
    'ś': 's', 'š': 's', 'Ś': 'S', 'Š': 'S',
    'ý': 'y', 'ÿ': 'y', 'ŷ': 'y', 'Ý': 'Y', 'Ÿ': 'Y', 'Ŷ': 'Y',
    'ź': 'z', 'ż': 'z', 'ž': 'z', 'Ź': 'Z', 'Ż': 'Z', 'Ž': 'Z',
    'æ': 'ae', 'Æ': 'AE', 'œ': 'oe', 'Œ': 'OE', 'ß': 'ss',
    // apostrophe (remove so "don't" matches "dont")
    "'": '', '\u2019': '',
    '-': ''
};

/**
 * Normalizes text by converting accented and Turkish characters to ASCII equivalents and converting to lowercase.
 * e.g. â, î, û -> a, i, u; é, ê -> e; and Turkish ç, ğ, ı, ö, ş, ü.
 * @param {string} text - The text to normalize
 * @returns {string} The normalized text
 */
export const normalizeText = (text) => {
    if (!text) return '';
    if (typeof text !== 'string') return text;
    const result = text.split('').map(char => NORMALIZE_CHAR_MAP[char] ?? char).join('').toLowerCase();
    return result;
};

/**
 * Normalizes text and returns a mapping from normalized indices to original string indices.
 * Use this when you need to find matches in normalized text but highlight in the original (e.g. search highlight).
 * @param {string} text - The text to normalize
 * @returns {{ normalized: string, normalizedToOriginalStart: number[] }} normalized string and, for each normalized index i, the original start index of the character that produced it
 */
export const normalizeTextWithMapping = (text) => {
    if (!text) return { normalized: '', normalizedToOriginalStart: [] };
    if (typeof text !== 'string') return { normalized: text, normalizedToOriginalStart: [] };
    const normalizedChars = [];
    const normalizedToOriginalStart = [];
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const replacement = NORMALIZE_CHAR_MAP[char] ?? char;
        for (let j = 0; j < replacement.length; j++) {
            normalizedChars.push(replacement[j]);
            normalizedToOriginalStart.push(i);
        }
    }
    const normalized = normalizedChars.join('').toLowerCase();
    return { normalized, normalizedToOriginalStart };
};

/**
 * Converts a match range [start, end] in normalized text to the equivalent [originalStart, originalEnd] in the original text.
 * @param {number[]} normalizedToOriginalStart - from normalizeTextWithMapping
 * @param {number} normalizedStart - match start index in normalized string
 * @param {number} normalizedEnd - match end index in normalized string (exclusive)
 * @param {number} originalLength - length of the original string (for capping)
 * @returns {[number, number]} [originalStart, originalEnd] for slicing the original string
 */
export const normalizedRangeToOriginal = (normalizedToOriginalStart, normalizedStart, normalizedEnd, originalLength) => {
    if (normalizedToOriginalStart.length === 0 || normalizedEnd <= normalizedStart) {
        return [0, 0];
    }
    const originalStart = normalizedToOriginalStart[normalizedStart];
    const originalEnd = normalizedEnd > 0
        ? Math.min(normalizedToOriginalStart[normalizedEnd - 1] + 1, originalLength)
        : 0;
    return [originalStart, originalEnd];
};

/**
 * Converts HTML string to plain text
 * @param {string} html - The HTML string to convert
 * @returns {string} The plain text content
 */
export const htmlToText = (html) => {
    if (!html) return '';
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
};

/**
 * Escapes special regex characters in a string to use it safely in RegExp constructor
 * @param {string} string - The string to escape
 * @returns {string} The escaped string safe for use in regex
 */
export const escapeRegExp = (string) => {
    if (!string || typeof string !== 'string') return '';
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

