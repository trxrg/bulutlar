import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildArticleInfoParts } from './documentHelpers.js';
import { isHtmlStringEmpty } from './htmlProcessing.js';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Generate comprehensive HTML document with embedded styles
export async function generateHTMLDocument(exportData, filePath, imagesFolderPath) {
    const { article, options, annotations, tags, relatedArticles, collections, category, owner, translations } = exportData;
    
    // Build the HTML content
    let htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(article.title || 'Untitled Article')}</title>
    <style>
        ${getEmbeddedCSS()}
    </style>
    <script>
        // Wait for all images to load and handle page breaks for images
        window.addEventListener('load', function() {
            const images = document.querySelectorAll('img');
            Promise.all(Array.from(images).map(img => {
                if (img.complete) return Promise.resolve();
                return new Promise(resolve => {
                    img.onload = resolve;
                    img.onerror = resolve;
                });
            })).then(() => {
                // After images load, wrap them in tables for better page break handling
                wrapImagesInTables();
                document.body.classList.add('ready-for-pdf');
            });
        });
        
        function wrapImagesInTables() {
            const imageWrappers = document.querySelectorAll('.image-wrapper');
            imageWrappers.forEach(wrapper => {
                const img = wrapper.querySelector('img');
                if (!img) return;
                
                // Check image height
                const imgHeight = img.naturalHeight || img.height;
                const imgWidth = img.naturalWidth || img.width;
                
                // If image is tall (more than 450px), ensure it starts on a new page if near bottom
                if (imgHeight > 450) {
                    const rect = wrapper.getBoundingClientRect();
                    const pageHeight = 1123; // Approximate A4 height in pixels
                    const positionInPage = rect.top % pageHeight;
                    
                    // If we're past 60% of the page, force a page break before
                    if (positionInPage > pageHeight * 0.6) {
                        wrapper.style.pageBreakBefore = 'always';
                        wrapper.style.breakBefore = 'page';
                    }
                }
            });
        }
    </script>
</head>
<body>
    <div class="container">
        <header class="article-header">
            <h1 class="article-title">${escapeHtml(article.title || 'Untitled Article')}</h1>
            ${buildArticleInfoHTML(article, category, owner, translations)}
        </header>
        
        <main class="article-content">
            ${await buildContentSectionsHTML(article, options, imagesFolderPath, translations)}
        </main>
        
        <footer class="article-footer">
            ${await buildFooterSectionsHTML(annotations, tags, relatedArticles, collections, options, translations)}
        </footer>
    </div>
</body>
</html>`;

    await fs.writeFile(filePath, htmlContent, 'utf8');
}

// Generate merged HTML document from multiple articles
export async function generateMergedHTMLDocument(exportData, filePath, imagesFolderPath, articleService) {
    const { articles, options, documentTitle, translations } = exportData;
    
    let htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(documentTitle || 'Merged Articles')}</title>
    <style>
        ${getEmbeddedCSS()}
        .article-separator {
            margin: 3rem 0;
            border-bottom: 2px solid #e5e5e5;
            padding-bottom: 2rem;
        }
        .article-separator:last-child {
            border-bottom: none;
        }
    </style>
    <script>
        // Wait for all images to load and handle page breaks for images
        window.addEventListener('load', function() {
            const images = document.querySelectorAll('img');
            Promise.all(Array.from(images).map(img => {
                if (img.complete) return Promise.resolve();
                return new Promise(resolve => {
                    img.onload = resolve;
                    img.onerror = resolve;
                });
            })).then(() => {
                // After images load, wrap them in tables for better page break handling
                wrapImagesInTables();
                document.body.classList.add('ready-for-pdf');
            });
        });
        
        function wrapImagesInTables() {
            const imageWrappers = document.querySelectorAll('.image-wrapper');
            imageWrappers.forEach(wrapper => {
                const img = wrapper.querySelector('img');
                if (!img) return;
                
                // Check image height
                const imgHeight = img.naturalHeight || img.height;
                const imgWidth = img.naturalWidth || img.width;
                
                // If image is tall (more than 450px), ensure it starts on a new page if near bottom
                if (imgHeight > 450) {
                    const rect = wrapper.getBoundingClientRect();
                    const pageHeight = 1123; // Approximate A4 height in pixels
                    const positionInPage = rect.top % pageHeight;
                    
                    // If we're past 60% of the page, force a page break before
                    if (positionInPage > pageHeight * 0.6) {
                        wrapper.style.pageBreakBefore = 'always';
                        wrapper.style.breakBefore = 'page';
                    }
                }
            });
        }
    </script>
</head>
<body>
    <div class="container">
        <header class="document-header">
            <h1 class="document-title">${escapeHtml(documentTitle || 'Merged Articles')}</h1>
        </header>
        
        <main class="document-content">`;

    // Process each article
    for (let i = 0; i < articles.length; i++) {
        const article = articles[i];
        
        // Resolve entities for this article
        const entityOptions = {
            includeAnnotations: options.notes || false,
            includeTags: options.tags || false,
            includeCollections: options.collections || false,
            includeRelatedArticles: options.relatedArticles || false,
            includeCategory: true,
            includeOwner: true
        };
        const { annotations, tags, collections, relatedArticles, category, owner } = await articleService.resolveArticleEntities(article, entityOptions);

        htmlContent += `
            <article class="article-separator">
                <header class="article-header">
                    <h2 class="article-title">${escapeHtml(article.title || 'Untitled Article')}</h2>
                    ${buildArticleInfoHTML(article, category, owner, translations)}
                </header>
                
                <div class="article-content">
                    ${await buildContentSectionsHTML(article, options, imagesFolderPath, translations)}
                </div>
                
                <footer class="article-footer">
                    ${await buildFooterSectionsHTML(annotations, tags, relatedArticles, collections, options, translations)}
                </footer>
            </article>`;
    }

    htmlContent += `
        </main>
    </div>
</body>
</html>`;

    await fs.writeFile(filePath, htmlContent, 'utf8');
}

// Build article info HTML section
function buildArticleInfoHTML(article, category, owner, translations) {
    const articleInfoParts = buildArticleInfoParts(article, category, owner, translations);
    if (articleInfoParts.length === 0) return '';
    
    return `<div class="article-info">${escapeHtml(articleInfoParts.join(' | '))}</div>`;
}

// Build main content sections HTML
async function buildContentSectionsHTML(article, options, imagesFolderPath, translations) {
    let contentHTML = '';
    
    // Explanation section
    if (options.explanation && article.explanation && !isHtmlStringEmpty(article.explanation)) {
        contentHTML += `
            <section class="explanation-section">
                <div class="content-html">${decodeHtmlEntities(article.explanation)}</div>
            </section>`;
    }
    
    // Main text section
    if (options.mainText && article.text && !isHtmlStringEmpty(article.text)) {
        contentHTML += `
            <section class="main-text-section">
                <div class="content-html">${decodeHtmlEntities(article.text)}</div>
            </section>`;
    }
    
    // Images section (moved after main text)
    if (options.images && article.images && article.images.length > 0) {
        contentHTML += `<section class="images-section">`;
        for (const image of article.images) {
            try {
                const imagePath = path.join(imagesFolderPath, image.path);
                const imageBuffer = await fs.readFile(imagePath);
                const base64Image = imageBuffer.toString('base64');
                const mimeType = getMimeType(image.path);
                
                contentHTML += `
                    <table class="image-wrapper" style="page-break-inside: avoid; break-inside: avoid; margin: 2rem auto; width: 100%;">
                        <tr>
                            <td style="text-align: center; padding: 1rem;">
                                <div class="image-container">
                                    <img src="data:${mimeType};base64,${base64Image}" 
                                         alt="${escapeHtml(image.name || 'Image')}"
                                         class="embedded-image" />
                                </div>
                            </td>
                        </tr>
                    </table>`;
            } catch (error) {
                console.error('Error embedding image:', error);
                contentHTML += `<p class="image-placeholder">[Image: ${escapeHtml(image.name)}]</p>`;
            }
        }
        contentHTML += `</section>`;
    }
    
    // Comment section (moved after images)
    if (options.comment && article.comments && article.comments.length > 0 && !isHtmlStringEmpty(article.comments[0]?.text)) {
        contentHTML += `
            <section class="comment-section">
                <h3 class="section-title">${escapeHtml(translations?.comment || 'Comment')}</h3>
                <div class="content-html">${decodeHtmlEntities(article.comments[0].text)}</div>
            </section>`;
    }
    
    
    return contentHTML;
}

// Build footer sections HTML
async function buildFooterSectionsHTML(annotations, tags, relatedArticles, collections, options, translations) {
    let footerHTML = '';
    
    // Notes/Annotations
    if (options.notes && annotations && annotations.length > 0) {
        footerHTML += `
            <section class="notes-section">
                <h3 class="section-title">${escapeHtml(translations?.notes || 'Notes')}</h3>
                <ol class="notes-list">`;
        annotations.forEach((annotation) => {
            footerHTML += `<li class="note-item">${escapeHtml(annotation.note || annotation.quote || '')}</li>`;
        });
        footerHTML += `</ol>
            </section>`;
    }
    
    // Tags
    if (options.tags && tags && tags.length > 0) {
        footerHTML += `
            <section class="tags-section">
                <h3 class="section-title">${escapeHtml(translations?.tags || 'Tags')}</h3>
                <div class="tags-list">`;
        tags.forEach(tag => {
            footerHTML += `<span class="tag-item">${escapeHtml(tag.name)}</span>`;
        });
        footerHTML += `</div>
            </section>`;
    }
    
    // Related Articles
    if (options.relatedArticles && relatedArticles && relatedArticles.length > 0) {
        footerHTML += `
            <section class="related-articles-section">
                <h3 class="section-title">${escapeHtml(translations?.relatedArticles || 'Related Articles')}</h3>
                <ol class="related-articles-list">`;
        relatedArticles.forEach((relatedArticle) => {
            footerHTML += `<li class="related-article-item">${escapeHtml(relatedArticle.title)}</li>`;
        });
        footerHTML += `</ol>
            </section>`;
    }
    
    // Collections
    if (options.collections && collections && collections.length > 0) {
        footerHTML += `
            <section class="collections-section">
                <h3 class="section-title">${escapeHtml(translations?.collections || 'Collections')}</h3>
                <div class="collections-list">`;
        collections.forEach(collection => {
            footerHTML += `<span class="collection-item">${escapeHtml(collection.name)}</span>`;
        });
        footerHTML += `</div>
            </section>`;
    }
    
    return footerHTML;
}

// Get comprehensive embedded CSS
function getEmbeddedCSS() {
    return `
        /* Reset and base styles */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
        }
        
        /* Header styles */
        .document-header, .article-header {
            margin-bottom: 2rem;
            padding-bottom: 1rem;
            border-bottom: 2px solid #e5e5e5;
        }
        
        .document-title, .article-title {
            font-size: 2.5rem;
            font-weight: bold;
            margin-bottom: 0.5rem;
            color: #2c3e50;
        }
        
        .article-title {
            font-size: 2rem;
        }
        
        .article-info {
            font-size: 0.9rem;
            color: #666;
        }
        
        /* Content styles */
        .article-content, .document-content {
            margin-bottom: 2rem;
        }
        
        .explanation-section, .main-text-section, .comment-section {
            margin-bottom: 2rem;
        }
        
        .content-html {
            font-size: 1.1rem;
            line-height: 1.8;
        }
        
        /* Preserve Draft.js formatting */
        .content-html p {
            margin-bottom: 0.5rem;
        }
        
        .content-html strong, .content-html b {
            font-weight: bold;
        }
        
        .content-html em, .content-html i {
            font-style: italic;
        }
        
        .content-html u {
            text-decoration: underline;
        }
        
        /* Handle Draft.js custom styles */
        .content-html span[style*="background-color"] {
            padding: 2px 4px;
            border-radius: 3px;
        }
        
        .content-html sup {
            vertical-align: super;
            font-size: 0.8em;
        }
        
        .content-html sub {
            vertical-align: sub;
            font-size: 0.8em;
        }
        
        /* Section titles */
        .section-title {
            font-size: 1.5rem;
            font-weight: bold;
            margin-bottom: 1rem;
            color: #2c3e50;
            border-bottom: 1px solid #ddd;
            padding-bottom: 0.5rem;
        }
        
        /* Media sections */
        .images-section {
            margin: 2rem 0;
        }
        
        .image-wrapper {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-before: auto;
            page-break-after: auto;
            margin: 2rem auto !important;
            width: 100%;
            border-collapse: collapse;
        }
        
        .image-wrapper td {
            text-align: center;
            padding: 1rem;
        }
        
        .image-container {
            text-align: center;
            display: inline-block;
            max-width: 100%;
        }
        
        .embedded-image {
            max-width: 85%;
            max-height: 550px;
            height: auto;
            width: auto;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            display: block;
            margin: 0 auto;
        }
        
        .image-placeholder {
            font-style: italic;
            color: #999;
            text-align: center;
            padding: 1rem;
            border: 2px dashed #ddd;
            border-radius: 4px;
            margin: 1rem 0;
        }
        
        /* Footer sections */
        .article-footer {
            margin-top: 3rem;
            padding-top: 2rem;
        }
        
        .notes-section, .tags-section, .related-articles-section, .collections-section {
            margin-bottom: 2rem;
        }
        
        .notes-list, .related-articles-list {
            padding-left: 1.5rem;
        }
        
        .note-item, .related-article-item {
            margin-bottom: 0.5rem;
            line-height: 1.6;
        }
        
        .tags-list, .collections-list {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
        }
        
        .tag-item, .collection-item {
            background-color: #f1f3f4;
            color: #333;
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 0.9rem;
            border: 1px solid #ddd;
        }
        
        /* Print styles - optimized for PDF generation */
        @media print {
            * {
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
            }
            
            .container {
                max-width: none;
                margin: 0;
                padding: 1rem;
            }
            
            .document-title, .article-title {
                color: #2c3e50 !important;
                page-break-after: avoid;
            }
            
            .section-title {
                color: #2c3e50 !important;
                page-break-after: avoid;
                margin-top: 1.5rem;
            }
            
            .images-section {
                page-break-inside: auto;
            }
            
            .image-wrapper {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                page-break-before: auto;
                page-break-after: auto;
                margin: 2rem auto !important;
            }
            
            .image-wrapper td {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
            }
            
            .image-container {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                display: inline-block;
            }
            
            .embedded-image {
                max-width: 85%;
                max-height: 600px;
                height: auto;
                width: auto;
                box-shadow: none;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                margin: 0 auto;
                display: block;
            }
            
            .article-separator {
                page-break-before: always;
                margin-top: 0;
            }
            
            .article-separator:first-child {
                page-break-before: avoid;
            }
            
            .content-html p {
                orphans: 3;
                widows: 3;
                margin-bottom: 0.5rem;
            }
            
            .notes-section, .tags-section, .related-articles-section, .collections-section {
                page-break-inside: avoid;
            }
            
            .tag-item, .collection-item {
                background-color: #f1f3f4 !important;
                border: 1px solid #ddd !important;
            }
        }
        
        /* Puppeteer-specific optimizations */
        @page {
            size: A4;
        }
        
        body {
            margin: 0;
            padding: 0;
        }
        
        /* Responsive design */
        @media (max-width: 768px) {
            .container {
                padding: 1rem;
            }
            
            .document-title, .article-title {
                font-size: 1.8rem;
            }
            
            .article-title {
                font-size: 1.5rem;
            }
        }
    `;
}

// Utility functions
function escapeHtml(text) {
    if (!text) return '';
    const div = { innerHTML: '' };
    div.textContent = text;
    return div.innerHTML || text.toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Decode HTML entities if the content has been double-escaped or contains literal entity strings
function decodeHtmlEntities(text) {
    if (!text) return '';
    
    // First, handle double-escaped entities (like &amp;nbsp; instead of &nbsp;)
    let result = text;
    if (result.includes('&amp;')) {
        result = result
            .replace(/&amp;nbsp;/g, '&nbsp;')
            .replace(/&amp;lt;/g, '&lt;')
            .replace(/&amp;gt;/g, '&gt;')
            .replace(/&amp;quot;/g, '&quot;')
            .replace(/&amp;#39;/g, '&#39;')
            .replace(/&amp;/g, '&');
    }
    
    return result;
}

function getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.bmp': 'image/bmp',
        '.svg': 'image/svg+xml'
    };
    return mimeTypes[ext] || 'image/jpeg';
}

