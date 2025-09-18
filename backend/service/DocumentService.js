import { ipcMain, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config.js';
import articleService from './ArticleService.js';
import { getEntityResolutionOptions } from './utils/documentHelpers.js';
import { generatePDF, generateMergedPDF } from './utils/pdfGeneration.js';
import { generateHTMLToPDF, generateMergedHTMLToPDF } from './utils/htmlToPdfGeneration.js';
import { generateWordDocument, generateMergedWordDocument } from './utils/wordGeneration.js';
import { generateHTMLDocument, generateMergedHTMLDocument } from './utils/htmlGeneration.js';

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

async function exportArticle(exportData) {
    try {
        const { articleId, options, translations } = exportData;
        
        const article = await articleService.getArticleById(articleId);
        const { annotations, tags, collections, relatedArticles, category, owner } = await articleService.resolveArticleEntities(article, getEntityResolutionOptions(options));

        // Show save dialog
        const result = await dialog.showSaveDialog({
            title: translations?.['exportArticle'] || 'Export Article',
            defaultPath: `${article.title || 'article'}.${options.format}`,
            filters: [
                options.format === 'pdf' 
                    ? { name: 'PDF Files', extensions: ['pdf'] }
                    : options.format === 'docx'
                    ? { name: 'Word Documents', extensions: ['docx'] }
                    : { name: 'HTML Files', extensions: ['html'] }
            ]
        });

        if (result.canceled || !result.filePath) {
            return { success: false, canceled: true };
        }

        // Create updated export data with resolved entities
        const updatedExportData = {
            ...exportData,
            article,
            annotations,
            tags,
            collections,
            relatedArticles,
            category,
            owner,
            translations
        };

        if (options.format === 'pdf') {
            // Use new HTML-to-PDF generation for much better quality
            try {
                await generateHTMLToPDF(updatedExportData, result.filePath, imagesFolderPath);
            } catch (htmlToPdfError) {
                console.warn('HTML-to-PDF generation failed, falling back to legacy PDF generation:', htmlToPdfError);
                await generatePDF(updatedExportData, result.filePath, imagesFolderPath);
            }
        } else if (options.format === 'docx') {
            await generateWordDocument(updatedExportData, result.filePath, imagesFolderPath);
        } else if (options.format === 'html') {
            await generateHTMLDocument(updatedExportData, result.filePath, imagesFolderPath);
        }

        return { success: true, filePath: result.filePath };

    } catch (error) {
        console.error('Error exporting article:', error);
        throw error;
    }
}

// Export multiple articles as a merged document
async function exportMultipleArticles(exportData) {
    const { articleIds, options, documentTitle, translations } = exportData;
    
    if (!articleIds || articleIds.length === 0) {
        return { success: false, error: 'No articles provided' };
    }

    try {
        // Get full articles with resolved data, just like single article export
        const fullArticles = [];
        for (const articleId of articleIds) {
            const fullArticle = await articleService.getArticleById(articleId);
            if (fullArticle) {
                fullArticles.push(fullArticle);
            }
        }

        // Show save dialog
        const result = await dialog.showSaveDialog({
            title: translations?.saveMergedArticles || 'Save Merged Articles',
            defaultPath: `${documentTitle || 'Merged Articles'}.${options.format}`,
            filters: [
                options.format === 'pdf' 
                    ? { name: 'PDF Files', extensions: ['pdf'] }
                    : options.format === 'docx'
                    ? { name: 'Word Documents', extensions: ['docx'] }
                    : { name: 'HTML Files', extensions: ['html'] }
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
            // Use new HTML-to-PDF generation for much better quality
            try {
                await generateMergedHTMLToPDF(updatedExportData, result.filePath, imagesFolderPath, articleService);
            } catch (htmlToPdfError) {
                console.warn('HTML-to-PDF generation failed, falling back to legacy PDF generation:', htmlToPdfError);
                await generateMergedPDF(updatedExportData, result.filePath, imagesFolderPath, articleService);
            }
        } else if (options.format === 'docx') {
            await generateMergedWordDocument(updatedExportData, result.filePath, imagesFolderPath, articleService);
        } else if (options.format === 'html') {
            await generateMergedHTMLDocument(updatedExportData, result.filePath, imagesFolderPath, articleService);
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