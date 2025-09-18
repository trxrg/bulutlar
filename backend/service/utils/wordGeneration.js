import { Document, Packer, Paragraph, TextRun, ImageRun, HeadingLevel } from 'docx';
import fs from 'fs/promises';
import path from 'path';
import { buildArticleInfoParts } from './documentHelpers.js';
import { htmlToFormattedRuns, isHtmlStringEmpty } from './htmlProcessing.js';

// Generate Word document
export async function generateWordDocument(exportData, filePath, imagesFolderPath) {
    const { article, options, annotations, tags, relatedArticles, collections, category, owner, translations } = exportData;
    
    const children = [];

    // Title
    children.push(new Paragraph({
        children: [new TextRun({ text: article.title || 'Untitled Article', bold: true, size: 32, font: 'Arial' })],
        heading: HeadingLevel.TITLE,
        alignment: 'center',
        spacing: { after: 400 }  // Add space after title
    }));

    // Article info
    const articleInfoParts = buildArticleInfoParts(article, category, owner, translations);
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

// Generate merged Word document from multiple articles
export async function generateMergedWordDocument(exportData, filePath, imagesFolderPath, articleService) {
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
