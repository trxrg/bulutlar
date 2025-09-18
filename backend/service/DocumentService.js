import { ipcMain, dialog } from 'electron';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { convert } from 'html-to-text';
import PDFDocument from 'pdfkit';
import { Document, Packer, Paragraph, TextRun, ImageRun, HeadingLevel } from 'docx';
import { fileURLToPath } from 'url';
import { config } from '../config.js';
import articleService from './ArticleService.js';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let imagesFolderPath;

function initService() {
    // Initialize IPC handlers for export functionality
    ipcMain.handle('article/exportArticle', async (event, exportData) => await exportArticle(exportData));
    ipcMain.handle('article/exportMultipleArticles', async (event, exportData) => await exportMultipleArticles(exportData));
    
    // Initialize folder paths
    imagesFolderPath = config.imagesFolderPath;
    console.info('DocumentService initialized');
}

// Configure html-to-text to preserve Turkish characters and fix newlines
const htmlToTextOptions = {
    wordwrap: null,
    preserveNewlines: false,
    uppercaseHeadings: false,
    ignoreHref: true,
    ignoreImage: true,
    tables: true,
    decodeEntities: true,
    selectors: [
        { selector: 'p', options: { leadingLineBreaks: 0, trailingLineBreaks: 1 } },
        { selector: 'br', options: { leadingLineBreaks: 0, trailingLineBreaks: 1 } },
        { selector: 'div', options: { leadingLineBreaks: 0, trailingLineBreaks: 1 } }
    ]
};

// Helper function to clean up excessive newlines for PDF
const cleanTextForPDF = (text) => {
    if (!text) return '';
    // Replace multiple consecutive newlines with single newlines
    return text.replace(/\n\s*\n+/g, '\n').trim();
};

// Helper function to convert HTML to paragraphs for Word documents
const htmlToParagraphs = (htmlContent) => {
    if (!htmlContent) return [];
    
    // Convert HTML to text but preserve paragraph structure
    const textWithParagraphs = convert(htmlContent, {
        wordwrap: null,
        preserveNewlines: true,
        uppercaseHeadings: false,
        ignoreHref: true,
        ignoreImage: true,
        tables: true,
        decodeEntities: true,
        selectors: [
            { selector: 'p', options: { leadingLineBreaks: 0, trailingLineBreaks: 2 } },
            { selector: 'br', options: { leadingLineBreaks: 1, trailingLineBreaks: 0 } },
            { selector: 'div', options: { leadingLineBreaks: 0, trailingLineBreaks: 2 } }
        ]
    });
    
    // Split by double newlines to get paragraphs, filter empty ones
    return textWithParagraphs
        .split(/\n\s*\n/)
        .map(p => p.trim())
        .filter(p => p.length > 0);
};

// Helper function to parse HTML and create formatted TextRuns for Word documents
const htmlToFormattedRuns = (htmlContent) => {
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
const htmlToFormattedSegmentsPDF = (htmlContent) => {
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

// Helper function to render formatted text segments in PDF (MUCH simpler approach)
const renderFormattedTextPDF = (doc, segments, options = {}) => {
    const defaultOptions = {
        lineGap: 6,
        width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
        align: 'justify'
    };
    const renderOptions = { ...defaultOptions, ...options };
    
    segments.forEach((paragraphSegments, paragraphIndex) => {
        if (paragraphIndex > 0) {
            doc.moveDown(0.3); // Space between paragraphs
        }
        
        // SIMPLE APPROACH: Just concatenate all text with ** markers for bold
        let fullText = '';
        paragraphSegments.forEach((segment) => {
            if (segment.bold) {
                fullText += '**' + segment.text + '**';
            } else {
                fullText += segment.text;
            }
        });
        
        // Set default font and render the full text
        try {
            doc.font('NotoSans');
        } catch (error) {
            doc.font('Helvetica');
        }
        
        // For now, just render as plain text to test spacing
        doc.text(ensureUTF8(fullText), {
            lineGap: renderOptions.lineGap,
            width: renderOptions.width,
            align: renderOptions.align
        });
    });
};

// Helper function to ensure proper UTF-8 encoding
const ensureUTF8 = (text) => {
    if (!text) return '';
    // Ensure the text is properly encoded as UTF-8
    try {
        // Convert to Buffer and back to ensure proper encoding
        return Buffer.from(text, 'utf8').toString('utf8');
    } catch (error) {
        console.warn('Error encoding text to UTF-8:', error);
        return text;
    }
};

// Helper function to check if HTML string is empty
function isHtmlStringEmpty(htmlString) {
    if (!htmlString) return true;
    // Remove HTML tags and check if there's any text content
    const textContent = htmlString.replace(/<[^>]*>/g, '').trim();
    return !textContent;
}

async function exportArticle(exportData) {
    try {
        const { article, options, translations } = exportData;
        
        // Use the entity resolver function from ArticleService
        const { annotations, tags, collections, relatedArticles, category, owner } = await articleService.resolveArticleEntities(article);
        
        // Show save dialog
        const result = await dialog.showSaveDialog({
            title: 'Export Article',
            defaultPath: `${article.title || 'article'}.${options.format}`,
            filters: [
                options.format === 'pdf' 
                    ? { name: 'PDF Files', extensions: ['pdf'] }
                    : { name: 'Word Documents', extensions: ['docx'] }
            ]
        });

        if (result.canceled || !result.filePath) {
            return { success: false, canceled: true };
        }

        // Create updated export data with resolved entities
        const updatedExportData = {
            ...exportData,
            annotations,
            tags,
            collections,
            relatedArticles,
            category,
            owner
        };

        if (options.format === 'pdf') {
            await generatePDF(updatedExportData, result.filePath);
        } else if (options.format === 'docx') {
            await generateWordDocument(updatedExportData, result.filePath);
        }

        return { success: true, filePath: result.filePath };

    } catch (error) {
        console.error('Error exporting article:', error);
        throw error;
    }
}

async function generatePDF(exportData, filePath) {
    const { article, options, annotations, tags, relatedArticles, collections, category, owner, translations } = exportData;
    
    const doc = new PDFDocument({ 
        margin: 50,
        bufferPages: true,
        info: {
            Title: article.title || 'Article Export',
            Producer: 'Bulutlar App',
            Creator: 'Bulutlar App'
        }
    });
    
    // Create write stream with UTF-8 encoding
    const writeStream = fsSync.createWriteStream(filePath);
    doc.pipe(writeStream);
    
    // Set default line spacing to 1.5
    const defaultLineSpacing = 1.5;
    
    // Register and use Noto Sans fonts which have excellent Unicode support
    try {
        const fontPathRegular = path.join(__dirname, '../fonts/NotoSans-Regular.ttf');
        const fontPathBold = path.join(__dirname, '../fonts/NotoSans-Bold.ttf');
        doc.registerFont('NotoSans', fontPathRegular);
        doc.registerFont('NotoSans-Bold', fontPathBold);
        doc.font('NotoSans');
        console.log('Successfully loaded NotoSans fonts for Turkish character support');
    } catch (error) {
        console.error('Failed to load NotoSans fonts, falling back to Helvetica:', error);
        doc.font('Helvetica');
    }

    // Title
    doc.fontSize(20).text(ensureUTF8(article.title || 'Untitled Article'), { align: 'center' });
    doc.moveDown();

    // Article info (like ArticleInfo component)
    const articleInfoParts = [];
    if (owner) {
        articleInfoParts.push(owner.name);
    }
    if (category) {
        articleInfoParts.push(category.name);
    }
    if (!article.isDateUncertain && article.date) {
        articleInfoParts.push(new Date(article.date).toLocaleDateString('tr'));
        articleInfoParts.push(`(${article.number})`);
        
        // Day of week (translated)
        const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayKey = weekdays[new Date(article.date).getDay()];
        const dayOfWeek = translations?.[dayKey] || dayKey;
        articleInfoParts.push(dayOfWeek);
        
        if (article.date2) {
            articleInfoParts.push(new Date(article.date2).toLocaleDateString('tr'));
            articleInfoParts.push(`(${article.number2})`);
        }
    }
    
    // Read time if available
    if (article.field1 && article.field1.trim() !== '') {
        const readTime = parseInt(article.field1, 10);
        if (!isNaN(readTime) && readTime > 0) {
            articleInfoParts.push(`${readTime} ${readTime === 1 ? (translations?.minRead || 'min read') : (translations?.minsRead || 'mins read')}`);
        }
    }
    
    if (articleInfoParts.length > 0) {
        doc.fontSize(12).text(ensureUTF8(articleInfoParts.join(' | ')), { align: 'left', lineGap: 6 });
        doc.moveDown();
    }

    // Content sections
    if (options.explanation && article.explanation) {
        const explanationSegments = htmlToFormattedSegmentsPDF(article.explanation);
        if (explanationSegments.length > 0) {
            // Add explanation text with italic styling and preserved bold formatting
            doc.fontSize(12);
            
            renderFormattedTextPDF(doc, explanationSegments, {
                lineGap: 6,
                width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
                align: 'justify'
            });
            
            doc.moveDown();
        }
    }

    if (options.mainText && article.text) {
        const mainTextSegments = htmlToFormattedSegmentsPDF(article.text);
        if (mainTextSegments.length > 0) {
            doc.fontSize(12);
            
            renderFormattedTextPDF(doc, mainTextSegments, {
                lineGap: 6,
                width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
                align: 'justify'
            });
            
            doc.moveDown();
        }
    }

    if (options.comment && article.comments && article.comments.length > 0 && article.comments[0].text) {
        const commentSegments = htmlToFormattedSegmentsPDF(article.comments[0].text);
        if (commentSegments.length > 0) {
            doc.fontSize(16).text(translations?.comment || 'Comment', { underline: true });
            doc.moveDown(0.5);
            doc.fontSize(12);
            
            renderFormattedTextPDF(doc, commentSegments, {
                lineGap: 6,
                width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
                align: 'justify'
            });
            
            doc.moveDown();
        }
    }

    // Images
    if (options.images && article.images && article.images.length > 0) {
        for (const image of article.images) {
            try {
                const imagePath = path.join(imagesFolderPath, image.path);
                const imageBuffer = await fs.readFile(imagePath);
                doc.image(imageBuffer, { fit: [400, 300], align: 'center' });
                doc.moveDown();
            } catch (error) {
                console.error('Error adding image to PDF:', error);
                doc.fontSize(10).text(`[Image: ${image.name}]`, { align: 'center' });
                doc.moveDown();
            }
        }
    }

    // Notes/Annotations
    if (options.notes && annotations && annotations.length > 0) {
        doc.fontSize(16).text(translations?.notes || 'Notes', { underline: true });
        doc.moveDown(0.5);
        annotations.forEach((annotation, index) => {
            doc.fontSize(12).text(ensureUTF8(`${index + 1}. ${annotation.note || annotation.quote || ''}`), { 
                lineGap: 6,
                width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
                align: 'justify'
            });
            doc.moveDown(0.3);
        });
        doc.moveDown();
    }

    // Tags
    if (options.tags && tags && tags.length > 0) {
        doc.fontSize(16).text(translations?.tags || 'Tags', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(12).text(ensureUTF8(tags.map(tag => tag.name).join(', ')), { 
            lineGap: 6,
            width: doc.page.width - doc.page.margins.left - doc.page.margins.right
        });
        doc.moveDown();
    }

    // Related Articles
    if (options.relatedArticles && relatedArticles && relatedArticles.length > 0) {
        doc.fontSize(16).text(translations?.relatedArticles || 'Related Articles', { underline: true });
        doc.moveDown(0.5);
        relatedArticles.forEach((relatedArticle, index) => {
            doc.fontSize(12).text(ensureUTF8(`${index + 1}. ${relatedArticle.title}`), { 
                lineGap: 6,
                width: doc.page.width - doc.page.margins.left - doc.page.margins.right
            });
            doc.moveDown(0.3);
        });
        doc.moveDown();
    }

    // Collections
    if (options.collections && collections && collections.length > 0) {
        doc.fontSize(16).text(translations?.collections || 'Collections', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(12).text(ensureUTF8(collections.map(collection => collection.name).join(', ')), { 
            lineGap: 6,
            width: doc.page.width - doc.page.margins.left - doc.page.margins.right
        });
        doc.moveDown();
    }

    doc.end();
}

async function generateWordDocument(exportData, filePath) {
    const { article, options, annotations, tags, relatedArticles, collections, category, owner, translations } = exportData;
    
    const children = [];

    // Title
    children.push(new Paragraph({
        children: [new TextRun({ text: article.title || 'Untitled Article', bold: true, size: 32, font: 'Arial' })],
        heading: HeadingLevel.TITLE,
        alignment: 'center',
        spacing: { after: 400 }  // Add space after title
    }));

    // Article info (like ArticleInfo component)
    const articleInfoParts = [];
    if (owner) {
        articleInfoParts.push(owner.name);
    }
    if (category) {
        articleInfoParts.push(category.name);
    }
    if (!article.isDateUncertain && article.date) {
        articleInfoParts.push(new Date(article.date).toLocaleDateString('tr'));
        articleInfoParts.push(`(${article.number})`);
        
        // Day of week (translated)
        const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayKey = weekdays[new Date(article.date).getDay()];
        const dayOfWeek = translations?.[dayKey] || dayKey;
        articleInfoParts.push(dayOfWeek);
        
        if (article.date2) {
            articleInfoParts.push(new Date(article.date2).toLocaleDateString('tr'));
            articleInfoParts.push(`(${article.number2})`);
        }
    }
    
    // Read time if available
    if (article.field1 && article.field1.trim() !== '') {
        const readTime = parseInt(article.field1, 10);
        if (!isNaN(readTime) && readTime > 0) {
            articleInfoParts.push(`${readTime} ${readTime === 1 ? (translations?.minRead || 'min read') : (translations?.minsRead || 'mins read')}`);
        }
    }
    
    if (articleInfoParts.length > 0) {
        children.push(new Paragraph({
            children: [new TextRun({ text: articleInfoParts.join(' | '), italics: true, font: 'Arial' })],
        }));
        children.push(new Paragraph({ text: '' })); // Empty line
    }

    // Content sections
    if (options.explanation && article.explanation) {
        const formattedRuns = htmlToFormattedRuns(article.explanation);
        if (formattedRuns.length > 0) {
            formattedRuns.forEach((runs, index) => {
                // Make all runs italic for explanation
                const italicRuns = runs.map(run => new TextRun({ 
                    ...run, 
                    italics: true, 
                    size: 22 
                }));
                children.push(new Paragraph({
                    children: italicRuns,
                    spacing: { 
                        before: index === 0 ? 120 : 0, 
                        after: index === formattedRuns.length - 1 ? 120 : 60, 
                        line: 360, 
                        lineRule: 'auto' 
                    }
                }));
            });
            children.push(new Paragraph({ text: '' })); // Empty line
        }
    }

    if (options.mainText && article.text) {
        const formattedRuns = htmlToFormattedRuns(article.text);
        if (formattedRuns.length > 0) {
            formattedRuns.forEach((runs, index) => {
                children.push(new Paragraph({
                    children: runs,
                    spacing: { 
                        after: index === formattedRuns.length - 1 ? 120 : 60, 
                        line: 360, 
                        lineRule: 'auto' 
                    }
                }));
            });
            children.push(new Paragraph({ text: '' })); // Empty line
        }
    }

    if (options.comment && article.comments && article.comments.length > 0 && article.comments[0].text) {
        const formattedRuns = htmlToFormattedRuns(article.comments[0].text);
        if (formattedRuns.length > 0) {
            children.push(new Paragraph({
                children: [new TextRun({ text: translations?.comment || 'Comment', bold: true, size: 24, font: 'Arial' })],
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 300, after: 200 }
            }));
            formattedRuns.forEach((runs, index) => {
                children.push(new Paragraph({
                    children: runs,
                    spacing: { 
                        after: index === formattedRuns.length - 1 ? 120 : 60, 
                        line: 360, 
                        lineRule: 'auto' 
                    }
                }));
            });
            children.push(new Paragraph({ text: '' })); // Empty line
        }
    }

    // Images
    if (options.images && article.images && article.images.length > 0) {
        for (const image of article.images) {
            try {
                const imagePath = path.join(imagesFolderPath, image.path);
                const imageBuffer = await fs.readFile(imagePath);
                children.push(new Paragraph({
                    children: [new ImageRun({
                        data: imageBuffer,
                        transformation: { width: 400, height: 300 }
                    })]
                }));
            } catch (error) {
                console.error('Error adding image to Word document:', error);
                children.push(new Paragraph({
                    children: [new TextRun({ text: `[Image: ${image.name}]`, italics: true, font: 'Arial' })]
                }));
            }
        }
        children.push(new Paragraph({ text: '' })); // Empty line
    }

    // Notes/Annotations
    if (options.notes && annotations && annotations.length > 0) {
        children.push(new Paragraph({
            children: [new TextRun({ text: translations?.notes || 'Notes', bold: true, size: 24, font: 'Arial' })],
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 200 }
        }));
        annotations.forEach((annotation, index) => {
            children.push(new Paragraph({
                children: [new TextRun({ text: `${index + 1}. ${annotation.note || annotation.quote || ''}`, font: 'Arial' })],
                spacing: { line: 360, lineRule: 'auto' }
            }));
        });
        children.push(new Paragraph({ text: '' })); // Empty line
    }

    // Tags
    if (options.tags && tags && tags.length > 0) {
        children.push(new Paragraph({
            children: [new TextRun({ text: translations?.tags || 'Tags', bold: true, size: 24, font: 'Arial' })],
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 200 }
        }));
        children.push(new Paragraph({
            children: [new TextRun({ text: tags.map(tag => tag.name).join(', '), font: 'Arial' })],
            spacing: { line: 360, lineRule: 'auto' }
        }));
        children.push(new Paragraph({ text: '' })); // Empty line
    }

    // Related Articles
    if (options.relatedArticles && relatedArticles && relatedArticles.length > 0) {
        children.push(new Paragraph({
            children: [new TextRun({ text: translations?.relatedArticles || 'Related Articles', bold: true, size: 24, font: 'Arial' })],
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 200 }
        }));
        relatedArticles.forEach((relatedArticle, index) => {
            children.push(new Paragraph({
                children: [new TextRun({ text: `${index + 1}. ${relatedArticle.title}`, font: 'Arial' })],
                spacing: { line: 360, lineRule: 'auto' }
            }));
        });
        children.push(new Paragraph({ text: '' })); // Empty line
    }

    // Collections
    if (options.collections && collections && collections.length > 0) {
        children.push(new Paragraph({
            children: [new TextRun({ text: translations?.collections || 'Collections', bold: true, size: 24, font: 'Arial' })],
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 200 }
        }));
        children.push(new Paragraph({
            children: [new TextRun({ text: collections.map(collection => collection.name).join(', '), font: 'Arial' })],
            spacing: { line: 360, lineRule: 'auto' }
        }));
    }

    const doc = new Document({
        sections: [{
            properties: {},
            children: children
        }]
    });

    const buffer = await Packer.toBuffer(doc);
    await fs.writeFile(filePath, buffer);
}

// Generate merged PDF document from multiple articles
async function generateMergedPDF(exportData, filePath) {
    const { articles, options, documentTitle, translations } = exportData;
    
    const doc = new PDFDocument({ margin: 50, bufferPages: true });
    const writeStream = fsSync.createWriteStream(filePath);
    doc.pipe(writeStream);
    
    // Set document info
    doc.info.Title = documentTitle || 'Merged Articles';
    doc.info.Author = 'Article Export';
    doc.info.Subject = 'Merged Articles Export';
    doc.info.Creator = 'Article Export Tool';

    // Register and use Noto Sans fonts which have excellent Unicode support
    try {
        const fontPathRegular = path.join(__dirname, '../fonts/NotoSans-Regular.ttf');
        const fontPathBold = path.join(__dirname, '../fonts/NotoSans-Bold.ttf');
        doc.registerFont('NotoSans', fontPathRegular);
        doc.registerFont('NotoSans-Bold', fontPathBold);
        doc.font('NotoSans');
        console.log('Successfully loaded NotoSans fonts for Turkish character support');
    } catch (error) {
        console.error('Failed to load NotoSans fonts, falling back to Helvetica:', error);
        doc.font('Helvetica');
    }

    // Document Title
    doc.fontSize(24).text(ensureUTF8(documentTitle || 'Merged Articles'), { align: 'center' });
    doc.moveDown(2);

    // Process each article
    for (let i = 0; i < articles.length; i++) {
        const article = articles[i];
        
        // Add separator between articles (except for the first one)
        if (i > 0) {
            doc.moveDown(2);
            // Add a horizontal line separator
            doc.strokeColor('#cccccc')
               .lineWidth(1)
               .moveTo(doc.page.margins.left, doc.y)
               .lineTo(doc.page.width - doc.page.margins.right, doc.y)
               .stroke();
            doc.moveDown(1);
        }

        // Article title
        doc.fontSize(18).text(ensureUTF8(article.title || 'Untitled Article'), { align: 'left' });
        doc.moveDown(0.5);
        
        // Resolve IDs to full objects for this article using ArticleService
        const { annotations, tags, collections, relatedArticles, category, owner } = await articleService.resolveArticleEntities(article);

        // COPY EXACT LOGIC FROM SINGLE ARTICLE EXPORT
        
        // Explanation
        if (options.explanation && article.explanation && !isHtmlStringEmpty(article.explanation)) {
            const explanationSegments = htmlToFormattedSegmentsPDF(article.explanation);
            if (explanationSegments.length > 0) {
                doc.fontSize(12);
                renderFormattedTextPDF(doc, explanationSegments, {
                    lineGap: 6,
                    width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
                    align: 'justify'
                });
                doc.moveDown();
            }
        }

        // Main Text
        if (options.mainText && article.text && !isHtmlStringEmpty(article.text)) {
            const mainTextSegments = htmlToFormattedSegmentsPDF(article.text);
            if (mainTextSegments.length > 0) {
                doc.fontSize(12);
                renderFormattedTextPDF(doc, mainTextSegments, {
                    lineGap: 6,
                    width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
                    align: 'justify'
                });
                doc.moveDown();
            }
        }

        // Comment
        if (options.comment && article.comments && article.comments.length > 0 && !isHtmlStringEmpty(article.comments[0]?.text)) {
            const commentSegments = htmlToFormattedSegmentsPDF(article.comments[0].text);
            if (commentSegments.length > 0) {
                doc.fontSize(16).text(translations?.comment || 'Comment', { underline: true });
                doc.moveDown(0.5);
                doc.fontSize(12);
                renderFormattedTextPDF(doc, commentSegments, {
                    lineGap: 6,
                    width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
                    align: 'justify'
                });
                doc.moveDown();
            }
        }

        // Images
        if (options.images && article.images && article.images.length > 0) {
            for (const image of article.images) {
                try {
                    const imagePath = path.join(imagesFolderPath, image.path);
                    const imageBuffer = await fs.readFile(imagePath);
                    doc.image(imageBuffer, { fit: [400, 300], align: 'center' });
                    doc.moveDown();
                } catch (error) {
                    console.error('Error adding image to PDF:', error);
                }
            }
        }

        // Notes/Annotations
        if (options.notes && annotations && annotations.length > 0) {
            doc.fontSize(16).text(translations?.notes || 'Notes', { underline: true });
            doc.moveDown(0.5);
            annotations.forEach((annotation, index) => {
                doc.fontSize(12).text(ensureUTF8(`${index + 1}. ${annotation.note || annotation.quote || ''}`), { 
                    lineGap: 6,
                    width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
                    align: 'justify'
                });
                doc.moveDown(0.3);
            });
            doc.moveDown();
        }

        // Tags
        if (options.tags && tags && tags.length > 0) {
            doc.fontSize(16).text(translations?.tags || 'Tags', { underline: true });
            doc.moveDown(0.5);
            doc.fontSize(12).text(ensureUTF8(tags.map(tag => tag.name).join(', ')), { 
                lineGap: 6,
                width: doc.page.width - doc.page.margins.left - doc.page.margins.right
            });
            doc.moveDown();
        }

        // Related Articles
        if (options.relatedArticles && relatedArticles && relatedArticles.length > 0) {
            doc.fontSize(16).text(translations?.relatedArticles || 'Related Articles', { underline: true });
            doc.moveDown(0.5);
            relatedArticles.forEach((relatedArticle, index) => {
                doc.fontSize(12).text(ensureUTF8(`${index + 1}. ${relatedArticle.title}`), { 
                    lineGap: 6,
                    width: doc.page.width - doc.page.margins.left - doc.page.margins.right
                });
                doc.moveDown(0.3);
            });
            doc.moveDown();
        }

        // Collections
        if (options.collections && collections && collections.length > 0) {
            doc.fontSize(16).text(translations?.collections || 'Collections', { underline: true });
            doc.moveDown(0.5);
            doc.fontSize(12).text(ensureUTF8(collections.map(collection => collection.name).join(', ')), { 
                lineGap: 6,
                width: doc.page.width - doc.page.margins.left - doc.page.margins.right
            });
            doc.moveDown();
        }

        doc.moveDown(0.5);
    }

    doc.end();
    
    return new Promise((resolve, reject) => {
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
    });
}

// Generate merged Word document from multiple articles
async function generateMergedWordDocument(exportData, filePath) {
    const { articles, options, documentTitle, translations } = exportData;
    
    const children = [];

    // Document Title
    children.push(new Paragraph({
        children: [new TextRun({ text: documentTitle || 'Merged Articles', bold: true, size: 36, font: 'Arial' })],
        heading: HeadingLevel.TITLE,
        alignment: 'center',
        spacing: { after: 600 }
    }));

    // Process each article
    for (let i = 0; i < articles.length; i++) {
        const article = articles[i];
        
        // Add separator between articles (except for the first one)
        if (i > 0) {
            children.push(new Paragraph({ text: '' })); // Empty line
            children.push(new Paragraph({ text: '' })); // Empty line
            // Add horizontal line separator
            children.push(new Paragraph({
                children: [new TextRun({ text: '─'.repeat(50), color: 'CCCCCC' })],
                alignment: 'center',
                spacing: { before: 200, after: 200 }
            }));
        }

        // Article title
        children.push(new Paragraph({
            children: [new TextRun({ text: article.title || 'Untitled Article', bold: true, size: 28, font: 'Arial' })],
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 200, after: 300 }
        }));
        
        // Resolve IDs to full objects for this article using ArticleService
        const { annotations, tags, collections, relatedArticles, category, owner } = await articleService.resolveArticleEntities(article);

        // COPY EXACT LOGIC FROM SINGLE ARTICLE EXPORT

        // Explanation
        if (options.explanation && article.explanation && !isHtmlStringEmpty(article.explanation)) {
            const formattedRuns = htmlToFormattedRuns(article.explanation);
            if (formattedRuns.length > 0) {
                formattedRuns.forEach((runs, index) => {
                    const italicRuns = runs.map(run => new TextRun({ 
                        ...run, 
                        italics: true, 
                        size: 22,
                        font: 'Arial'
                    }));
                    children.push(new Paragraph({
                        children: italicRuns,
                        spacing: { 
                            before: index === 0 ? 120 : 0, 
                            after: index === formattedRuns.length - 1 ? 120 : 60, 
                            line: 360, 
                            lineRule: 'auto' 
                        }
                    }));
                });
            }
        }

        // Main Text
        if (options.mainText && article.text && !isHtmlStringEmpty(article.text)) {
            const formattedRuns = htmlToFormattedRuns(article.text);
            if (formattedRuns.length > 0) {
                formattedRuns.forEach((runs, index) => {
                    children.push(new Paragraph({
                        children: runs,
                        spacing: { 
                            after: index === formattedRuns.length - 1 ? 120 : 60, 
                            line: 360, 
                            lineRule: 'auto' 
                        }
                    }));
                });
            }
        }

        // Comment
        if (options.comment && article.comments && article.comments.length > 0 && !isHtmlStringEmpty(article.comments[0]?.text)) {
            const formattedRuns = htmlToFormattedRuns(article.comments[0].text);
            if (formattedRuns.length > 0) {
                children.push(new Paragraph({
                    children: [new TextRun({ text: translations?.comment || 'Comment', bold: true, size: 24, font: 'Arial' })],
                    heading: HeadingLevel.HEADING_1,
                    spacing: { before: 300, after: 200 }
                }));
                formattedRuns.forEach((runs, index) => {
                    children.push(new Paragraph({
                        children: runs,
                        spacing: { 
                            after: index === formattedRuns.length - 1 ? 120 : 60, 
                            line: 360, 
                            lineRule: 'auto' 
                        }
                    }));
                });
            }
        }

        // Images
        if (options.images && article.images && article.images.length > 0) {
            for (const image of article.images) {
                try {
                    const imagePath = path.join(imagesFolderPath, image.path);
                    const imageBuffer = await fs.readFile(imagePath);
                    children.push(new Paragraph({
                        children: [new ImageRun({
                            data: imageBuffer,
                            transformation: {
                                width: 500,
                                height: 400,
                            },
                        })],
                        alignment: 'center',
                        spacing: { before: 200, after: 200 }
                    }));
                } catch (error) {
                    console.error('Error adding image to Word:', error);
                }
            }
        }

        // Notes/Annotations
        if (options.notes && annotations && annotations.length > 0) {
            children.push(new Paragraph({
                children: [new TextRun({ text: translations?.notes || 'Notes', bold: true, size: 24, font: 'Arial' })],
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 300, after: 200 }
            }));
            annotations.forEach((annotation, index) => {
                children.push(new Paragraph({
                    children: [new TextRun({ text: `${index + 1}. ${annotation.note || annotation.quote || ''}`, font: 'Arial' })],
                    spacing: { line: 360, lineRule: 'auto' }
                }));
            });
            children.push(new Paragraph({ text: '' })); // Empty line
        }

        // Tags
        if (options.tags && tags && tags.length > 0) {
            children.push(new Paragraph({
                children: [new TextRun({ text: translations?.tags || 'Tags', bold: true, size: 24, font: 'Arial' })],
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 300, after: 200 }
            }));
            children.push(new Paragraph({
                children: [new TextRun({ text: tags.map(tag => tag.name).join(', '), font: 'Arial' })],
                spacing: { line: 360, lineRule: 'auto' }
            }));
            children.push(new Paragraph({ text: '' })); // Empty line
        }

        // Related Articles
        if (options.relatedArticles && relatedArticles && relatedArticles.length > 0) {
            children.push(new Paragraph({
                children: [new TextRun({ text: translations?.relatedArticles || 'Related Articles', bold: true, size: 24, font: 'Arial' })],
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 300, after: 200 }
            }));
            relatedArticles.forEach((relatedArticle, index) => {
                children.push(new Paragraph({
                    children: [new TextRun({ text: `${index + 1}. ${relatedArticle.title}`, font: 'Arial' })],
                    spacing: { line: 360, lineRule: 'auto' }
                }));
            });
            children.push(new Paragraph({ text: '' })); // Empty line
        }

        // Collections
        if (options.collections && collections && collections.length > 0) {
            children.push(new Paragraph({
                children: [new TextRun({ text: translations?.collections || 'Collections', bold: true, size: 24, font: 'Arial' })],
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 300, after: 200 }
            }));
            children.push(new Paragraph({
                children: [new TextRun({ text: collections.map(collection => collection.name).join(', '), font: 'Arial' })],
                spacing: { line: 360, lineRule: 'auto' }
            }));
        }

        // Add spacing at the end
        children.push(new Paragraph({ text: '' }));
    }

    // Create and save document
    const doc = new Document({ sections: [{ children }] });
    const buffer = await Packer.toBuffer(doc);
    await fs.writeFile(filePath, buffer);
}

// Export multiple articles as a merged document
async function exportMultipleArticles(exportData) {
    const { articles, options, documentTitle, translations } = exportData;
    
    if (!articles || articles.length === 0) {
        return { success: false, error: 'No articles provided' };
    }

    try {
        // Get full articles with resolved data, just like single article export
        const fullArticles = [];
        for (const article of articles) {
            let fullArticle;
            if (typeof article === 'string' || typeof article === 'number') {
                fullArticle = await articleService.getArticleById(article);
            } else {
                fullArticle = article;
            }
            if (fullArticle) {
                fullArticles.push(fullArticle);
            }
        }

        // Show save dialog
        const result = await dialog.showSaveDialog({
            title: 'Save Merged Articles',
            defaultPath: `${documentTitle || 'Merged Articles'}.${options.format}`,
            filters: [
                options.format === 'pdf' 
                    ? { name: 'PDF Files', extensions: ['pdf'] }
                    : { name: 'Word Documents', extensions: ['docx'] }
            ]
        });

        if (result.canceled) {
            return { success: false, canceled: true };
        }

        // Update export data with full articles
        const updatedExportData = {
            ...exportData,
            articles: fullArticles
        };

        // Generate the merged document
        if (options.format === 'pdf') {
            await generateMergedPDF(updatedExportData, result.filePath);
        } else {
            await generateMergedWordDocument(updatedExportData, result.filePath);
        }

        return { success: true, filePath: result.filePath };
    } catch (error) {
        console.error('Export multiple articles failed:', error);
        return { success: false, error: error.message };
    }
}

const DocumentService = {
    initService,
    exportArticle,
    exportMultipleArticles
};

export default DocumentService;
