import PDFDocument from 'pdfkit';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ensureUTF8, buildArticleInfoParts } from './documentHelpers.js';
import { htmlToFormattedSegmentsPDF, isHtmlStringEmpty } from './htmlProcessing.js';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to render formatted text segments in PDF (MUCH simpler approach)
export const renderFormattedTextPDF = (doc, segments, options = {}) => {
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

// Initialize PDF fonts
export const initializePDFFont = (doc) => {
    try {
        const fontPathRegular = path.join(__dirname, '../../fonts/NotoSans-Regular.ttf');
        const fontPathBold = path.join(__dirname, '../../fonts/NotoSans-Bold.ttf');
        doc.registerFont('NotoSans', fontPathRegular);
        doc.registerFont('NotoSans-Bold', fontPathBold);
        doc.font('NotoSans');
        console.log('Successfully loaded NotoSans fonts for Turkish character support');
    } catch (error) {
        console.error('Failed to load NotoSans fonts, falling back to Helvetica:', error);
        doc.font('Helvetica');
    }
};

// Generate PDF document
export async function generatePDF(exportData, filePath, imagesFolderPath) {
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
    
    // Initialize fonts
    initializePDFFont(doc);

    // Title
    doc.fontSize(20).text(ensureUTF8(article.title || 'Untitled Article'), { align: 'center' });
    doc.moveDown();

    // Article info
    const articleInfoParts = buildArticleInfoParts(article, category, owner, translations);
    if (articleInfoParts.length > 0) {
        doc.fontSize(12).text(ensureUTF8(articleInfoParts.join(' | ')), { align: 'left', lineGap: 6 });
        doc.moveDown();
    }

    // Content sections
    if (options.explanation && article.explanation) {
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

// Generate merged PDF document from multiple articles
export async function generateMergedPDF(exportData, filePath, imagesFolderPath, articleService) {
    const { articles, options, documentTitle, translations } = exportData;
    
    const doc = new PDFDocument({ margin: 50, bufferPages: true });
    const writeStream = fsSync.createWriteStream(filePath);
    doc.pipe(writeStream);
    
    // Set document info
    doc.info.Title = documentTitle || 'Merged Articles';
    doc.info.Author = 'Article Export';
    doc.info.Subject = 'Merged Articles Export';
    doc.info.Creator = 'Article Export Tool';

    // Initialize fonts
    initializePDFFont(doc);

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
        
        // Resolve IDs to full objects for this article using ArticleService with optimized options
        const entityOptions = {
            includeAnnotations: options.notes || false,
            includeTags: options.tags || false,
            includeCollections: options.collections || false,
            includeRelatedArticles: options.relatedArticles || false,
            includeCategory: true,
            includeOwner: true
        };
        const { annotations, tags, collections, relatedArticles, category, owner } = await articleService.resolveArticleEntities(article, entityOptions);

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
