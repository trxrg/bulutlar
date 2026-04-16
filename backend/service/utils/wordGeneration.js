import { Document, Packer, Paragraph, TextRun, ImageRun, HeadingLevel } from 'docx';
import fs from 'fs/promises';
import path from 'path';
import sizeOf from 'image-size';
import { buildArticleInfoParts } from './documentHelpers.js';
import { htmlToFormattedRuns, isHtmlStringEmpty, stripInvalidXmlChars } from './htmlProcessing.js';

// Scrub user-supplied plain strings before they end up as <w:t> text in the
// exported docx. Tiptap/Draft content may pass through here indirectly (e.g.
// titles pasted with hidden control chars), and OOXML's <w:t> does not allow
// C0 control characters - their presence can cause MS Word to flag the file
// as corrupt/unsafe.
const s = (str) => stripInvalidXmlChars(str || '');

// Default Word document styling applied to every run that doesn't override it
// itself. Also provides a font for headings/title so Mac Word doesn't fall back
// to Cambria or the installation-specific Normal font.
const DOC_STYLES = {
    default: {
        document: { run: { font: 'Arial', size: 22 } }, // 22 half-points = 11pt
    },
};

// Basic OOXML metadata (goes into docProps/core.xml). Adding these avoids some
// "file might be unsafe / format mismatch" warnings Word for Mac shows for
// docx files with entirely empty document properties.
const buildDocMetadata = (title) => ({
    creator: 'Bulutlar',
    lastModifiedBy: 'Bulutlar',
    title: s(title) || 'Bulutlar Export',
    description: 'Exported from Bulutlar',
});

// docx v9's ImageRun only supports these raster formats. Anything else (webp,
// heic, avif, svg via the regular path, tiff, ...) must NOT be handed to
// ImageRun: the library registers the image in [Content_Types].xml using the
// provided `type` verbatim, and an unsupported/undefined type produces a docx
// that Word opens with "Word found unreadable content". We skip those with a
// placeholder paragraph instead.
const DOCX_IMAGE_TYPES = new Set(['jpg', 'png', 'gif', 'bmp']);

// Map whatever we can learn about an image (image-size detection, stored MIME,
// file extension) to one of the four docx-supported type strings, or null if
// the format isn't representable in docx.
const resolveDocxImageType = ({ detectedType, mime, filename }) => {
    const candidates = [
        detectedType,
        mime && mime.split('/')[1],
        filename && path.extname(filename).slice(1),
    ];
    for (const raw of candidates) {
        if (!raw) continue;
        const t = String(raw).toLowerCase();
        if (t === 'jpeg' || t === 'jpg') return 'jpg';
        if (DOCX_IMAGE_TYPES.has(t)) return t;
    }
    return null;
};

// Build the paragraph that represents a single image inside the docx. If the
// image can't be embedded (missing file, unreadable dimensions, unsupported
// format), fall back to a small italic placeholder paragraph so the export
// still succeeds and stays well-formed.
const buildImageParagraph = async (image, imagesFolderPath) => {
    try {
        const imagePath = path.join(imagesFolderPath, image.path);
        const imageBuffer = await fs.readFile(imagePath);

        const dimensions = sizeOf(imageBuffer);
        const imageType = resolveDocxImageType({
            detectedType: dimensions && dimensions.type,
            mime: image.type,
            filename: image.path || image.name,
        });

        if (!imageType) {
            console.warn(`Skipping image with docx-unsupported format: ${image.name} (detected: ${dimensions && dimensions.type}, mime: ${image.type})`);
            return new Paragraph({
                children: [new TextRun({
                    text: `[Image: ${s(image.name)} — format not supported in Word]`,
                    italics: true,
                    font: 'Arial',
                })],
                alignment: 'center',
                spacing: { before: 200, after: 200 },
            });
        }

        const aspectRatio = dimensions.height / dimensions.width;
        const desiredWidth = 600; // Full text width in points (6 inches * 72 points/inch)
        const calculatedHeight = Math.round(desiredWidth * aspectRatio);

        return new Paragraph({
            children: [new ImageRun({
                type: imageType,
                data: imageBuffer,
                transformation: {
                    width: desiredWidth,
                    height: calculatedHeight,
                },
            })],
            alignment: 'center',
            spacing: { before: 200, after: 200 },
        });
    } catch (error) {
        console.error('Error adding image to Word document:', error);
        return new Paragraph({
            children: [new TextRun({
                text: `[Image: ${s(image.name)}]`,
                italics: true,
                font: 'Arial',
            })],
            alignment: 'center',
            spacing: { before: 200, after: 200 },
        });
    }
};

// Generate Word document
export async function generateWordDocument(exportData, filePath, imagesFolderPath) {
    const { article, options, annotations, tags, relatedArticles, collections, category, owner, translations } = exportData;
    
    const children = [];

    // Title
    children.push(new Paragraph({
        children: [new TextRun({ text: s(article.title) || 'Untitled Article', bold: true, size: 32, font: 'Arial' })],
        heading: HeadingLevel.TITLE,
        alignment: 'center',
        spacing: { after: 400 }  // Add space after title
    }));

    // Article info
    const articleInfoParts = buildArticleInfoParts(article, category, owner, translations);
    if (articleInfoParts.length > 0) {
        children.push(new Paragraph({
            children: [new TextRun({ text: s(articleInfoParts.join(' | ')), font: 'Arial' })],
        }));
        children.push(new Paragraph({ text: '' })); // Empty line
    }

    // Content sections
    if (options.explanation && article.explanation) {
        const formattedRuns = htmlToFormattedRuns(article.explanation);
        if (formattedRuns.length > 0) {
            formattedRuns.forEach((runs, index) => {
                // const italicRuns = runs.map(run => new TextRun({ 
                //     ...run, 
                //     italics: true, 
                //     size: 22 
                // }));
                const italicRuns = runs;
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

    // Images (moved after main text)
    if (options.images && article.images && article.images.length > 0) {
        for (const image of article.images) {
            children.push(await buildImageParagraph(image, imagesFolderPath));
        }
        children.push(new Paragraph({ text: '' })); // Empty line
    }

    // Comment (moved after images)
    if (options.comment && article.comments && article.comments.length > 0 && article.comments[0].text) {
        const formattedRuns = htmlToFormattedRuns(article.comments[0].text);
        if (formattedRuns.length > 0) {
            children.push(new Paragraph({
                children: [new TextRun({ text: s(translations?.comment) || 'Comment', bold: true, size: 24, font: 'Arial' })],
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

    // Notes/Annotations
    if (options.notes && annotations && annotations.length > 0) {
        children.push(new Paragraph({
            children: [new TextRun({ text: s(translations?.notes) || 'Notes', bold: true, size: 24, font: 'Arial' })],
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 200 }
        }));
        annotations.forEach((annotation, index) => {
            children.push(new Paragraph({
                children: [new TextRun({ text: `${index + 1}. ${s(annotation.note || annotation.quote || '')}`, font: 'Arial' })],
                spacing: { line: 360, lineRule: 'auto' }
            }));
        });
        children.push(new Paragraph({ text: '' })); // Empty line
    }

    // Tags
    if (options.tags && tags && tags.length > 0) {
        children.push(new Paragraph({
            children: [new TextRun({ text: s(translations?.tags) || 'Tags', bold: true, size: 24, font: 'Arial' })],
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 200 }
        }));
        children.push(new Paragraph({
            children: [new TextRun({ text: s(tags.map(tag => tag.name).join(', ')), font: 'Arial' })],
            spacing: { line: 360, lineRule: 'auto' }
        }));
        children.push(new Paragraph({ text: '' })); // Empty line
    }

    // Related Articles
    if (options.relatedArticles && relatedArticles && relatedArticles.length > 0) {
        children.push(new Paragraph({
            children: [new TextRun({ text: s(translations?.relatedArticles) || 'Related Articles', bold: true, size: 24, font: 'Arial' })],
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 200 }
        }));
        relatedArticles.forEach((relatedArticle, index) => {
            children.push(new Paragraph({
                children: [new TextRun({ text: `${index + 1}. ${s(relatedArticle.title)}`, font: 'Arial' })],
                spacing: { line: 360, lineRule: 'auto' }
            }));
        });
        children.push(new Paragraph({ text: '' })); // Empty line
    }

    // Collections
    if (options.collections && collections && collections.length > 0) {
        children.push(new Paragraph({
            children: [new TextRun({ text: s(translations?.collections) || 'Collections', bold: true, size: 24, font: 'Arial' })],
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 200 }
        }));
        children.push(new Paragraph({
            children: [new TextRun({ text: s(collections.map(collection => collection.name).join(', ')), font: 'Arial' })],
            spacing: { line: 360, lineRule: 'auto' }
        }));
    }

    const doc = new Document({
        ...buildDocMetadata(article.title),
        styles: DOC_STYLES,
        sections: [{
            properties: {},
            children: children
        }]
    });

    const buffer = await Packer.toBuffer(doc);
    await fs.writeFile(filePath, buffer);
}

// Generate merged Word document from multiple articles
export async function generateMergedWordDocument(exportData, filePath, imagesFolderPath, articleService) {
    const { articles, options, documentTitle, translations } = exportData;
    
    const children = [];

    // Document Title
    children.push(new Paragraph({
        children: [new TextRun({ text: s(documentTitle) || 'Merged Articles', bold: true, size: 36, font: 'Arial' })],
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
            children: [new TextRun({ text: s(article.title) || 'Untitled Article', bold: true, size: 28, font: 'Arial' })],
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 200, after: 300 }
        }));
        
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
            const formattedRuns = htmlToFormattedRuns(article.explanation);
            if (formattedRuns.length > 0) {
                formattedRuns.forEach((runs, index) => {
                    // const italicRuns = runs.map(run => new TextRun({ 
                    //     ...run, 
                    //     italics: true, 
                    //     size: 22,
                    //     font: 'Arial'
                    // }));
                    const italicRuns = runs;
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

        // Images (moved after main text)
        if (options.images && article.images && article.images.length > 0) {
            for (const image of article.images) {
                children.push(await buildImageParagraph(image, imagesFolderPath));
            }
        }

        // Comment (moved after images)
        if (options.comment && article.comments && article.comments.length > 0 && !isHtmlStringEmpty(article.comments[0]?.text)) {
            const formattedRuns = htmlToFormattedRuns(article.comments[0].text);
            if (formattedRuns.length > 0) {
                children.push(new Paragraph({
                    children: [new TextRun({ text: s(translations?.comment) || 'Comment', bold: true, size: 24, font: 'Arial' })],
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

        // Notes/Annotations
        if (options.notes && annotations && annotations.length > 0) {
            children.push(new Paragraph({
                children: [new TextRun({ text: s(translations?.notes) || 'Notes', bold: true, size: 24, font: 'Arial' })],
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 300, after: 200 }
            }));
            annotations.forEach((annotation, index) => {
                children.push(new Paragraph({
                    children: [new TextRun({ text: `${index + 1}. ${s(annotation.note || annotation.quote || '')}`, font: 'Arial' })],
                    spacing: { line: 360, lineRule: 'auto' }
                }));
            });
            children.push(new Paragraph({ text: '' })); // Empty line
        }

        // Tags
        if (options.tags && tags && tags.length > 0) {
            children.push(new Paragraph({
                children: [new TextRun({ text: s(translations?.tags) || 'Tags', bold: true, size: 24, font: 'Arial' })],
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 300, after: 200 }
            }));
            children.push(new Paragraph({
                children: [new TextRun({ text: s(tags.map(tag => tag.name).join(', ')), font: 'Arial' })],
                spacing: { line: 360, lineRule: 'auto' }
            }));
            children.push(new Paragraph({ text: '' })); // Empty line
        }

        // Related Articles
        if (options.relatedArticles && relatedArticles && relatedArticles.length > 0) {
            children.push(new Paragraph({
                children: [new TextRun({ text: s(translations?.relatedArticles) || 'Related Articles', bold: true, size: 24, font: 'Arial' })],
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 300, after: 200 }
            }));
            relatedArticles.forEach((relatedArticle, index) => {
                children.push(new Paragraph({
                    children: [new TextRun({ text: `${index + 1}. ${s(relatedArticle.title)}`, font: 'Arial' })],
                    spacing: { line: 360, lineRule: 'auto' }
                }));
            });
            children.push(new Paragraph({ text: '' })); // Empty line
        }

        // Collections
        if (options.collections && collections && collections.length > 0) {
            children.push(new Paragraph({
                children: [new TextRun({ text: s(translations?.collections) || 'Collections', bold: true, size: 24, font: 'Arial' })],
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 300, after: 200 }
            }));
            children.push(new Paragraph({
                children: [new TextRun({ text: s(collections.map(collection => collection.name).join(', ')), font: 'Arial' })],
                spacing: { line: 360, lineRule: 'auto' }
            }));
        }

        // Add spacing at the end
        children.push(new Paragraph({ text: '' }));
    }

    // Create and save document
    const doc = new Document({
        ...buildDocMetadata(documentTitle),
        styles: DOC_STYLES,
        sections: [{ children }],
    });
    const buffer = await Packer.toBuffer(doc);
    await fs.writeFile(filePath, buffer);
}
