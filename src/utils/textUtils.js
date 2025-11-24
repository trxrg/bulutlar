/**
 * Text utility functions for text normalization, conversion, and regex operations
 */

/**
 * Normalizes text by converting Turkish characters to ASCII equivalents and converting to lowercase
 * @param {string} text - The text to normalize
 * @returns {string} The normalized text
 */
export const normalizeText = (text) => {
    if (!text) return '';
    if (typeof text !== 'string') return text;
    const turkishMap = {
        'ç': 'c', 'Ç': 'C',
        'ğ': 'g', 'Ğ': 'G',
        'ı': 'i', 'İ': 'I',
        'ö': 'o', 'Ö': 'O',
        'ş': 's', 'Ş': 'S',
        'ü': 'u', 'Ü': 'U'
    };
    const result = text.split('').map(char => turkishMap[char] || char).join('').toLowerCase();
    return result;
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

