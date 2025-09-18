import { convert } from 'html-to-text';
import { TextRun } from 'docx';

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
        
        // Simple state machine to parse formatting
        const tokens = paragraph.split(/(<\/?(?:strong|b|em|i)>)/gi);
        
        for (const token of tokens) {
            if (token.match(/<(?:strong|b)>/i)) {
                if (currentText) {  // Don't trim - preserve spaces
                    runs.push(new TextRun({ 
                        text: currentText, 
                        bold: isBold, 
                        italics: isItalic, 
                        font: 'Arial' 
                    }));
                    currentText = '';
                }
                isBold = true;
            } else if (token.match(/<\/(?:strong|b)>/i)) {
                if (currentText) {  // Don't trim - preserve spaces
                    runs.push(new TextRun({ 
                        text: currentText, 
                        bold: isBold, 
                        italics: isItalic, 
                        font: 'Arial' 
                    }));
                    currentText = '';
                }
                isBold = false;
            } else if (token.match(/<(?:em|i)>/i)) {
                if (currentText) {  // Don't trim - preserve spaces
                    runs.push(new TextRun({ 
                        text: currentText, 
                        bold: isBold, 
                        italics: isItalic, 
                        font: 'Arial' 
                    }));
                    currentText = '';
                }
                isItalic = true;
            } else if (token.match(/<\/(?:em|i)>/i)) {
                if (currentText) {  // Don't trim - preserve spaces
                    runs.push(new TextRun({ 
                        text: currentText, 
                        bold: isBold, 
                        italics: isItalic, 
                        font: 'Arial' 
                    }));
                    currentText = '';
                }
                isItalic = false;
            } else if (token) {  // Don't check trim() - preserve all tokens including spaces
                currentText += token;
            }
        }
        
        // Add remaining text
        if (currentText) {
            runs.push(new TextRun({ 
                text: currentText, 
                bold: isBold, 
                italics: isItalic, 
                font: 'Arial' 
            }));
        }
        
        // If no runs were created, create a simple one with the whole paragraph
        if (runs.length === 0 && paragraph.trim()) {
            return [new TextRun({ text: paragraph, font: 'Arial' })];
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
        
        // Simple state machine to parse formatting
        const tokens = paragraph.split(/(<\/?(?:strong|b|em|i)>)/gi);
        
        for (const token of tokens) {
            if (token.match(/<(?:strong|b)>/i)) {
                if (currentText) {  // Don't trim - preserve spaces
                    segments.push({ 
                        text: currentText, 
                        bold: isBold, 
                        italic: isItalic 
                    });
                    currentText = '';
                }
                isBold = true;
            } else if (token.match(/<\/(?:strong|b)>/i)) {
                if (currentText) {  // Don't trim - preserve spaces
                    segments.push({ 
                        text: currentText, 
                        bold: isBold, 
                        italic: isItalic 
                    });
                    currentText = '';
                }
                isBold = false;
            } else if (token.match(/<(?:em|i)>/i)) {
                if (currentText) {  // Don't trim - preserve spaces
                    segments.push({ 
                        text: currentText, 
                        bold: isBold, 
                        italic: isItalic 
                    });
                    currentText = '';
                }
                isItalic = true;
            } else if (token.match(/<\/(?:em|i)>/i)) {
                if (currentText) {  // Don't trim - preserve spaces
                    segments.push({ 
                        text: currentText, 
                        bold: isBold, 
                        italic: isItalic 
                    });
                    currentText = '';
                }
                isItalic = false;
            } else if (token) {  // Don't check trim() - preserve all tokens including spaces
                currentText += token;
            }
        }
        
        // Add remaining text
        if (currentText) {  // Don't trim - preserve spaces
            segments.push({ 
                text: currentText, 
                bold: isBold, 
                italic: isItalic 
            });
        }
        
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
