import { convert } from 'html-to-text';
import { TextRun } from 'docx';

// Default body-text size for Word exports, in half-points (22 = 11pt).
// Ensures Windows/Mac/Word-for-Web all render body runs at the same size
// instead of falling back to each installation's Normal style default.
const DEFAULT_BODY_SIZE = 22;

// Decode the HTML entities that Tiptap's getHTML() (and any stored HTML) can
// emit, so they don't end up as literal text like "&nbsp;" inside the exported
// docx/pdf. Order matters: decode numeric/named entities first and &amp; last,
// so that "&amp;nbsp;" is preserved as the literal string "&nbsp;" rather than
// being double-decoded into a non-breaking space.
const decodeHtmlEntities = (str) => {
    if (!str) return str;
    return str
        .replace(/&#x([0-9a-f]+);/gi, (_, hex) => {
            const code = parseInt(hex, 16);
            return Number.isFinite(code) ? String.fromCodePoint(code) : '';
        })
        .replace(/&#(\d+);/g, (_, dec) => {
            const code = parseInt(dec, 10);
            return Number.isFinite(code) ? String.fromCodePoint(code) : '';
        })
        .replace(/&nbsp;/gi, '\u00A0')
        .replace(/&quot;/gi, '"')
        .replace(/&apos;/gi, "'")
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&amp;/gi, '&');
};

// OOXML's <w:t> content only allows characters permitted by XML 1.0: tab (U+0009),
// LF (U+000A), CR (U+000D), and anything >= U+0020 (plus some surrogate rules).
// Any stray C0 control char (e.g. a pasted U+000B vertical tab) can make Office
// flag the file as unsafe/corrupt. Strip them before they reach a TextRun.
export const stripInvalidXmlChars = (str) => {
    if (!str) return str;
    // eslint-disable-next-line no-control-regex
    return str.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
};

const sanitizeRunText = (str) => stripInvalidXmlChars(decodeHtmlEntities(str));

// Helper function to parse HTML and create formatted TextRuns for Word documents
export const htmlToFormattedRuns = (htmlContent) => {
    if (!htmlContent) return [];
    
    // Simple regex-based approach to preserve bold formatting
    // This handles basic <strong>, <b>, and <em>, <i> tags
    let text = htmlContent
        .replace(/<\/p>/gi, '\n\n')  // Paragraph breaks
        .replace(/<br\s*\/?>/gi, '\n')  // Line breaks
        .replace(/<div[^>]*>/gi, '\n')  // Div starts
        .replace(/<\/div>/gi, '\n')  // Div ends
        .replace(/<[^>]*>/g, (match) => {
            // Preserve formatting tags, remove others
            if (match.match(/<\/?(?:strong|b|em|i)>/i)) {
                return match;
            }
            return '';
        });
    
    // Split into paragraphs
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim());
    
    return paragraphs.map(paragraph => {
        const runs = [];
        let currentText = '';
        let isBold = false;
        let isItalic = false;

        const flush = () => {
            if (!currentText) return;
            const cleaned = sanitizeRunText(currentText);
            currentText = '';
            if (!cleaned) return;
            runs.push(new TextRun({
                text: cleaned,
                bold: isBold,
                italics: isItalic,
                font: 'Arial',
                size: DEFAULT_BODY_SIZE,
            }));
        };

        // Simple state machine to parse formatting
        const tokens = paragraph.split(/(<\/?(?:strong|b|em|i)>)/gi);

        for (const token of tokens) {
            if (token.match(/<(?:strong|b)>/i)) {
                flush();
                isBold = true;
            } else if (token.match(/<\/(?:strong|b)>/i)) {
                flush();
                isBold = false;
            } else if (token.match(/<(?:em|i)>/i)) {
                flush();
                isItalic = true;
            } else if (token.match(/<\/(?:em|i)>/i)) {
                flush();
                isItalic = false;
            } else if (token) {  // Don't check trim() - preserve all tokens including spaces
                currentText += token;
            }
        }

        flush();

        // If no runs were created, create a simple one with the whole paragraph
        if (runs.length === 0 && paragraph.trim()) {
            const cleaned = sanitizeRunText(paragraph);
            if (cleaned) {
                return [new TextRun({ text: cleaned, font: 'Arial', size: DEFAULT_BODY_SIZE })];
            }
        }

        return runs;
    });
};

// Helper function to parse HTML and create formatted text segments for PDF
export const htmlToFormattedSegmentsPDF = (htmlContent) => {
    if (!htmlContent) return [];
    
    // Simple regex-based approach to preserve formatting
    let text = htmlContent
        .replace(/<\/p>/gi, '\n\n')  // Paragraph breaks
        .replace(/<br\s*\/?>/gi, '\n')  // Line breaks
        .replace(/<div[^>]*>/gi, '\n')  // Div starts
        .replace(/<\/div>/gi, '\n')  // Div ends
        .replace(/<[^>]*>/g, (match) => {
            // Preserve formatting tags, remove others
            if (match.match(/<\/?(?:strong|b|em|i)>/i)) {
                return match;
            }
            return '';
        });
    
    // Split into paragraphs
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim());
    
    return paragraphs.map(paragraph => {
        const segments = [];
        let currentText = '';
        let isBold = false;
        let isItalic = false;

        const flush = () => {
            if (!currentText) return;
            const cleaned = sanitizeRunText(currentText);
            currentText = '';
            if (!cleaned) return;
            segments.push({ text: cleaned, bold: isBold, italic: isItalic });
        };

        // Simple state machine to parse formatting
        const tokens = paragraph.split(/(<\/?(?:strong|b|em|i)>)/gi);

        for (const token of tokens) {
            if (token.match(/<(?:strong|b)>/i)) {
                flush();
                isBold = true;
            } else if (token.match(/<\/(?:strong|b)>/i)) {
                flush();
                isBold = false;
            } else if (token.match(/<(?:em|i)>/i)) {
                flush();
                isItalic = true;
            } else if (token.match(/<\/(?:em|i)>/i)) {
                flush();
                isItalic = false;
            } else if (token) {  // Don't check trim() - preserve all tokens including spaces
                currentText += token;
            }
        }

        flush();

        return segments;
    }).filter(segments => segments.length > 0);
};

// Helper function to check if HTML string is empty
export function isHtmlStringEmpty(htmlString) {
    if (!htmlString) return true;
    // Remove HTML tags and check if there's any text content
    const textContent = htmlString.replace(/<[^>]*>/g, '').trim();
    return !textContent;
}
