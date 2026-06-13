import { Document, Packer, Paragraph, TextRun, ImageRun, HeadingLevel, PageBreak } from 'docx';
import fs from 'fs/promises';
import path from 'path';
import sizeOf from 'image-size';
import {
    buildArticleInfoParts,
    resolveMergedDocumentTitle,
    formatGenerationDate,
    shouldShowMergedDocumentHeader,
} from './documentHelpers.js';
import { htmlToFormattedRuns, isHtmlStringEmpty, stripInvalidXmlChars } from './htmlProcessing.js';
import { resolveExportLayout } from './exportLayout.js';

// Scrub user-supplied plain strings before they end up as <w:t> text in the
// exported docx. Tiptap/Draft content may pass through here indirectly (e.g.
// titles pasted with hidden control chars), and OOXML's <w:t> does not allow
// C0 control characters - their presence can cause MS Word to flag the file
// as corrupt/unsafe.
const s = (str) => stripInvalidXmlChars(str || '');

const buildDocStyles = (layout) => ({
    default: {
        document: { run: { font: layout.docxFont, size: layout.docxBodySize } },
        paragraph: {
            alignment: layout.docxAlignment,
            spacing: { line: layout.docxLineSpacing, lineRule: 'auto' },
        },
    },
});

const buildSectionProperties = (layout) => ({
    page: {
        margin: {
            top: layout.pageMarginTwips,
            right: layout.pageMarginTwips,
            bottom: layout.pageMarginTwips,
            left: layout.pageMarginTwips,
        },
    },
});

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
const buildImageParagraph = async (image, imagesFolderPath, docxFont = 'Segoe UI') => {
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
                    font: docxFont,
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
                font: docxFont,
            })],
            alignment: 'center',
            spacing: { before: 200, after: 200 },
        });
    }
};

// Generate Word document
export async function generateWordDocument(exportData, filePath, imagesFolderPath) {
    const { article, options, annotations, tags, relatedArticles, collections, category, owner, translations } = exportData;
    const layout = resolveExportLayout(options);
    const runDefaults = { font: layout.docxFont, size: layout.docxBodySize };
    const children = [];

    // Title
    children.push(new Paragraph({
        children: [new TextRun({ text: s(article.title) || 'Untitled Article', bold: true, size: layout.docxTitleSize, font: layout.docxFont })],
        heading: HeadingLevel.TITLE,
        alignment: 'center',
        spacing: { after: 400 }  // Add space after title
    }));

    // Article info
    const articleInfoParts = buildArticleInfoParts(article, category, owner, translations);
    if (articleInfoParts.length > 0) {
        children.push(new Paragraph({
            children: [new TextRun({ text: s(articleInfoParts.join(' | ')), font: layout.docxFont, size: layout.docxBodySize })],
        }));
        children.push(new Paragraph({ text: '' })); // Empty line
    }

    // Content sections
    if (options.explanation && article.explanation) {
        const formattedRuns = htmlToFormattedRuns(article.explanation, runDefaults);
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
                    }
                }));
            });
            children.push(new Paragraph({ text: '' })); // Empty line
        }
    }

    if (options.mainText && article.text) {
        const formattedRuns = htmlToFormattedRuns(article.text, runDefaults);
        if (formattedRuns.length > 0) {
            formattedRuns.forEach((runs, index) => {
                children.push(new Paragraph({
                    children: runs,
                    spacing: { 
                        after: index === formattedRuns.length - 1 ? 120 : 60,
                    }
                }));
            });
            children.push(new Paragraph({ text: '' })); // Empty line
        }
    }

    // Images (moved after main text)
    if (options.images && article.images && article.images.length > 0) {
        for (const image of article.images) {
            children.push(await buildImageParagraph(image, imagesFolderPath, layout.docxFont));
        }
        children.push(new Paragraph({ text: '' })); // Empty line
    }

    // Comment (moved after images)
    if (options.comment && article.comments && article.comments.length > 0 && article.comments[0].text) {
        const formattedRuns = htmlToFormattedRuns(article.comments[0].text, runDefaults);
        if (formattedRuns.length > 0) {
            children.push(new Paragraph({
                children: [new TextRun({ text: s(translations?.comment) || 'Comment', bold: true, size: layout.docxHeadingSize, font: layout.docxFont })],
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 300, after: 200 }
            }));
            formattedRuns.forEach((runs, index) => {
                children.push(new Paragraph({
                    children: runs,
                    spacing: { 
                        after: index === formattedRuns.length - 1 ? 120 : 60,
                    }
                }));
            });
            children.push(new Paragraph({ text: '' })); // Empty line
        }
    }

    // Notes/Annotations
    if (options.notes && annotations && annotations.length > 0) {
        children.push(new Paragraph({
            children: [new TextRun({ text: s(translations?.notes) || 'Notes', bold: true, size: layout.docxHeadingSize, font: layout.docxFont })],
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 200 }
        }));
        annotations.forEach((annotation, index) => {
            children.push(new Paragraph({
                children: [new TextRun({ text: `${index + 1}. ${s(annotation.note || annotation.quote || '')}`, font: layout.docxFont, size: layout.docxBodySize })],
            }));
        });
        children.push(new Paragraph({ text: '' })); // Empty line
    }

    // Tags
    if (options.tags && tags && tags.length > 0) {
        children.push(new Paragraph({
            children: [new TextRun({ text: s(translations?.tags) || 'Tags', bold: true, size: layout.docxHeadingSize, font: layout.docxFont })],
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 200 }
        }));
        children.push(new Paragraph({
            children: [new TextRun({ text: s(tags.map(tag => tag.name).join(', ')), font: layout.docxFont, size: layout.docxBodySize })],
        }));
        children.push(new Paragraph({ text: '' })); // Empty line
    }

    // Related Articles
    if (options.relatedArticles && relatedArticles && relatedArticles.length > 0) {
        children.push(new Paragraph({
            children: [new TextRun({ text: s(translations?.relatedArticles) || 'Related Articles', bold: true, size: layout.docxHeadingSize, font: layout.docxFont })],
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 200 }
        }));
        relatedArticles.forEach((relatedArticle, index) => {
            children.push(new Paragraph({
                children: [new TextRun({ text: `${index + 1}. ${s(relatedArticle.title)}`, font: layout.docxFont, size: layout.docxBodySize })],
            }));
        });
        children.push(new Paragraph({ text: '' })); // Empty line
    }

    // Collections
    if (options.collections && collections && collections.length > 0) {
        children.push(new Paragraph({
            children: [new TextRun({ text: s(translations?.collections) || 'Collections', bold: true, size: layout.docxHeadingSize, font: layout.docxFont })],
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 200 }
        }));
        children.push(new Paragraph({
            children: [new TextRun({ text: s(collections.map(collection => collection.name).join(', ')), font: layout.docxFont, size: layout.docxBodySize })],
        }));
    }

    const doc = new Document({
        ...buildDocMetadata(article.title),
        styles: buildDocStyles(layout),
        sections: [{
            properties: buildSectionProperties(layout),
            children: children
        }]
    });

    const buffer = await Packer.toBuffer(doc);
    await fs.writeFile(filePath, buffer);
}

function buildMergedWordHeaderChildren(options, documentTitle, translations, locale, layout) {
    if (!shouldShowMergedDocumentHeader(options)) return [];

    const resolvedTitle = resolveMergedDocumentTitle(documentTitle, options);
    const showTitle = options?.includeDocumentTitle !== false && resolvedTitle;
    const showDate = options?.includeGenerationDate === true;
    const separatePage = options?.documentTitleSeparatePage === true;
    const headerChildren = [];

    if (showTitle) {
        headerChildren.push(new Paragraph({
            children: [new TextRun({
                text: s(resolvedTitle),
                bold: true,
                size: layout.docxTitleSize + 4,
                font: layout.docxFont,
            })],
            heading: HeadingLevel.TITLE,
            alignment: 'center',
            spacing: { after: showDate ? 200 : 600 },
        }));
    }

    if (showDate) {
        headerChildren.push(new Paragraph({
            children: [new TextRun({
                text: s(formatGenerationDate(locale)),
                size: layout.docxBodySize,
                color: '666666',
                font: layout.docxFont,
            })],
            alignment: 'center',
            spacing: { after: 600 },
        }));
    }

    if (separatePage && headerChildren.length > 0) {
        headerChildren.push(new Paragraph({ children: [new PageBreak()] }));
    }

    return headerChildren;
}

// Generate merged Word document from multiple articles
export async function generateMergedWordDocument(exportData, filePath, imagesFolderPath, articleService) {
    const { articles, options, documentTitle, translations, locale } = exportData;
    const layout = resolveExportLayout(options);
    const runDefaults = { font: layout.docxFont, size: layout.docxBodySize };
    const children = [
        ...buildMergedWordHeaderChildren(options, documentTitle, translations, locale, layout),
    ];
    const metadataTitle = resolveMergedDocumentTitle(documentTitle, options) || 'Merged Articles';

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
            children: [new TextRun({ text: s(article.title) || 'Untitled Article', bold: true, size: layout.docxTitleSize - 4, font: layout.docxFont })],
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
            const formattedRuns = htmlToFormattedRuns(article.explanation, runDefaults);
            if (formattedRuns.length > 0) {
                formattedRuns.forEach((runs, index) => {
                    // const italicRuns = runs.map(run => new TextRun({ 
                    //     ...run, 
                    //     italics: true, 
                    //     size: 22,
                    //     font: layout.docxFont, size: layout.docxBodySize
                    // }));
                    const italicRuns = runs;
                    children.push(new Paragraph({
                        children: italicRuns,
                        spacing: { 
                            before: index === 0 ? 120 : 0, 
                            after: index === formattedRuns.length - 1 ? 120 : 60,
                        }
                    }));
                });
            }
        }

        // Main Text
        if (options.mainText && article.text && !isHtmlStringEmpty(article.text)) {
            const formattedRuns = htmlToFormattedRuns(article.text, runDefaults);
            if (formattedRuns.length > 0) {
                formattedRuns.forEach((runs, index) => {
                    children.push(new Paragraph({
                        children: runs,
                    spacing: {
                        after: index === formattedRuns.length - 1 ? 120 : 60,
                    }
                    }));
                });
            }
        }

        // Images (moved after main text)
        if (options.images && article.images && article.images.length > 0) {
            for (const image of article.images) {
                children.push(await buildImageParagraph(image, imagesFolderPath, layout.docxFont));
            }
        }

        // Comment (moved after images)
        if (options.comment && article.comments && article.comments.length > 0 && !isHtmlStringEmpty(article.comments[0]?.text)) {
            const formattedRuns = htmlToFormattedRuns(article.comments[0].text, runDefaults);
            if (formattedRuns.length > 0) {
                children.push(new Paragraph({
                    children: [new TextRun({ text: s(translations?.comment) || 'Comment', bold: true, size: layout.docxHeadingSize, font: layout.docxFont })],
                    heading: HeadingLevel.HEADING_1,
                    spacing: { before: 300, after: 200 }
                }));
                formattedRuns.forEach((runs, index) => {
                    children.push(new Paragraph({
                        children: runs,
                    spacing: {
                        after: index === formattedRuns.length - 1 ? 120 : 60,
                    }
                    }));
                });
            }
        }

        // Notes/Annotations
        if (options.notes && annotations && annotations.length > 0) {
            children.push(new Paragraph({
                children: [new TextRun({ text: s(translations?.notes) || 'Notes', bold: true, size: layout.docxHeadingSize, font: layout.docxFont })],
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 300, after: 200 }
            }));
            annotations.forEach((annotation, index) => {
                children.push(new Paragraph({
                    children: [new TextRun({ text: `${index + 1}. ${s(annotation.note || annotation.quote || '')}`, font: layout.docxFont, size: layout.docxBodySize })],
                }));
            });
            children.push(new Paragraph({ text: '' })); // Empty line
        }

        // Tags
        if (options.tags && tags && tags.length > 0) {
            children.push(new Paragraph({
                children: [new TextRun({ text: s(translations?.tags) || 'Tags', bold: true, size: layout.docxHeadingSize, font: layout.docxFont })],
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 300, after: 200 }
            }));
            children.push(new Paragraph({
                children: [new TextRun({ text: s(tags.map(tag => tag.name).join(', ')), font: layout.docxFont, size: layout.docxBodySize })],
            }));
            children.push(new Paragraph({ text: '' })); // Empty line
        }

        // Related Articles
        if (options.relatedArticles && relatedArticles && relatedArticles.length > 0) {
            children.push(new Paragraph({
                children: [new TextRun({ text: s(translations?.relatedArticles) || 'Related Articles', bold: true, size: layout.docxHeadingSize, font: layout.docxFont })],
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 300, after: 200 }
            }));
            relatedArticles.forEach((relatedArticle, index) => {
                children.push(new Paragraph({
                    children: [new TextRun({ text: `${index + 1}. ${s(relatedArticle.title)}`, font: layout.docxFont, size: layout.docxBodySize })],
                }));
            });
            children.push(new Paragraph({ text: '' })); // Empty line
        }

        // Collections
        if (options.collections && collections && collections.length > 0) {
            children.push(new Paragraph({
                children: [new TextRun({ text: s(translations?.collections) || 'Collections', bold: true, size: layout.docxHeadingSize, font: layout.docxFont })],
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 300, after: 200 }
            }));
            children.push(new Paragraph({
                children: [new TextRun({ text: s(collections.map(collection => collection.name).join(', ')), font: layout.docxFont, size: layout.docxBodySize })],
            }));
        }

        // Add spacing at the end
        children.push(new Paragraph({ text: '' }));
    }

    // Create and save document
    const doc = new Document({
        ...buildDocMetadata(metadataTitle),
        styles: buildDocStyles(layout),
        sections: [{ properties: buildSectionProperties(layout), children }],
    });
    const buffer = await Packer.toBuffer(doc);
    await fs.writeFile(filePath, buffer);
}
