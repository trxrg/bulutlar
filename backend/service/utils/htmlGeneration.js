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
                <div class="content-html">${article.explanation}</div>
            </section>`;
    }
    
    // Main text section
    if (options.mainText && article.text && !isHtmlStringEmpty(article.text)) {
        contentHTML += `
            <section class="main-text-section">
                <div class="content-html">${article.text}</div>
            </section>`;
    }
    
    // Comment section
    if (options.comment && article.comments && article.comments.length > 0 && !isHtmlStringEmpty(article.comments[0]?.text)) {
        contentHTML += `
            <section class="comment-section">
                <h3 class="section-title">${escapeHtml(translations?.comment || 'Comment')}</h3>
                <div class="content-html">${article.comments[0].text}</div>
            </section>`;
    }
    
    // Images section
    if (options.images && article.images && article.images.length > 0) {
        contentHTML += `<section class="images-section">`;
        for (const image of article.images) {
            try {
                const imagePath = path.join(imagesFolderPath, image.path);
                const imageBuffer = await fs.readFile(imagePath);
                const base64Image = imageBuffer.toString('base64');
                const mimeType = getMimeType(image.path);
                
                contentHTML += `
                    <div class="image-container">
                        <img src="data:${mimeType};base64,${base64Image}" 
                             alt="${escapeHtml(image.name || 'Image')}"
                             class="embedded-image" />
                        ${image.name ? `<p class="image-caption">${escapeHtml(image.name)}</p>` : ''}
                    </div>`;
            } catch (error) {
                console.error('Error embedding image:', error);
                contentHTML += `<p class="image-placeholder">[Image: ${escapeHtml(image.name)}]</p>`;
            }
        }
        contentHTML += `</section>`;
    }
    
    // Audio section
    if (options.audio && article.audios && article.audios.length > 0) {
        contentHTML += `<section class="audio-section">`;
        for (const audio of article.audios) {
            try {
                const audioPath = path.join(imagesFolderPath, audio.path);
                const audioBuffer = await fs.readFile(audioPath);
                const base64Audio = audioBuffer.toString('base64');
                const mimeType = getAudioMimeType(audio.path);
                
                contentHTML += `
                    <div class="audio-container">
                        <audio controls class="embedded-audio">
                            <source src="data:${mimeType};base64,${base64Audio}" type="${mimeType}">
                            Your browser does not support the audio element.
                        </audio>
                        ${audio.name ? `<p class="audio-caption">${escapeHtml(audio.name)}</p>` : ''}
                    </div>`;
            } catch (error) {
                console.error('Error embedding audio:', error);
                contentHTML += `<p class="audio-placeholder">[Audio: ${escapeHtml(audio.name)}]</p>`;
            }
        }
        contentHTML += `</section>`;
    }
    
    // Video section  
    if (options.video && article.videos && article.videos.length > 0) {
        contentHTML += `<section class="video-section">`;
        for (const video of article.videos) {
            try {
                const videoPath = path.join(imagesFolderPath, video.path);
                const videoBuffer = await fs.readFile(videoPath);
                const base64Video = videoBuffer.toString('base64');
                const mimeType = getVideoMimeType(video.path);
                
                contentHTML += `
                    <div class="video-container">
                        <video controls class="embedded-video">
                            <source src="data:${mimeType};base64,${base64Video}" type="${mimeType}">
                            Your browser does not support the video element.
                        </video>
                        ${video.name ? `<p class="video-caption">${escapeHtml(video.name)}</p>` : ''}
                    </div>`;
            } catch (error) {
                console.error('Error embedding video:', error);
                contentHTML += `<p class="video-placeholder">[Video: ${escapeHtml(video.name)}]</p>`;
            }
        }
        contentHTML += `</section>`;
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
            background-color: #fff;
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
            font-style: italic;
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
            margin-bottom: 1rem;
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
        .images-section, .audio-section, .video-section {
            margin: 2rem 0;
        }
        
        .image-container, .audio-container, .video-container {
            text-align: center;
            margin: 1.5rem 0;
        }
        
        .embedded-image {
            max-width: 100%;
            height: auto;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        
        .embedded-audio, .embedded-video {
            max-width: 100%;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        
        .embedded-video {
            max-height: 400px;
        }
        
        .image-caption, .audio-caption, .video-caption {
            font-size: 0.9rem;
            color: #666;
            margin-top: 0.5rem;
            font-style: italic;
        }
        
        .image-placeholder, .audio-placeholder, .video-placeholder {
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
            border-top: 1px solid #e5e5e5;
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
                padding: 0;
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
            
            .embedded-image {
                max-width: 100%;
                box-shadow: none;
                page-break-inside: avoid;
                margin: 1rem 0;
            }
            
            .embedded-audio, .embedded-video {
                page-break-inside: avoid;
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
            margin: 0;
            size: A4;
        }
        
        body {
            margin: 0;
            padding: 2rem;
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

function getAudioMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
        '.mp3': 'audio/mpeg',
        '.wav': 'audio/wav',
        '.ogg': 'audio/ogg',
        '.m4a': 'audio/mp4',
        '.aac': 'audio/aac',
        '.flac': 'audio/flac'
    };
    return mimeTypes[ext] || 'audio/mpeg';
}

function getVideoMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
        '.mp4': 'video/mp4',
        '.webm': 'video/webm',
        '.ogg': 'video/ogg',
        '.avi': 'video/x-msvideo',
        '.mov': 'video/quicktime',
        '.wmv': 'video/x-ms-wmv'
    };
    return mimeTypes[ext] || 'video/mp4';
}
