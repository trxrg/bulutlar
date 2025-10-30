import fs from 'fs-extra';
import path from 'path';
import { ipcMain, dialog } from 'electron';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

import { mainWindow } from '../main.js';
import { initDB, stopSequelize, startSequelize } from '../sequelize/index.js';
import { config, changeDbBackupFolderPath } from '../config.js';

function stripRichFormattingKeepMedia(jsonString) {
    try {
        const content = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
        
        // Strip only HIGHLIGHT from inline styles in all blocks
        const strippedBlocks = content.blocks.map(block => {
            // Keep atomic blocks (images, audio, video) as-is
            if (block.type === 'atomic') {
                return block;
            }
            
            // For text blocks, remove only HIGHLIGHT from inline styles
            const filteredInlineStyles = (block.inlineStyleRanges || []).filter(
                style => style.style !== 'HIGHLIGHT'
            );
            
            return {
                ...block,
                inlineStyleRanges: filteredInlineStyles, // Keep all styles except HIGHLIGHT
                entityRanges: [] // Remove entity ranges (links, etc.) - media is in atomic blocks
            };
        });
        
        // Filter entities to keep only IMAGE, AUDIO, VIDEO
        const mediaEntityKeys = new Set();
        Object.entries(content.entityMap || {}).forEach(([key, entity]) => {
            if (['IMAGE', 'AUDIO', 'VIDEO'].includes(entity.type)) {
                mediaEntityKeys.add(key);
            }
        });
        
        const strippedEntityMap = {};
        mediaEntityKeys.forEach(key => {
            strippedEntityMap[key] = content.entityMap[key];
        });
        
        return {
            blocks: strippedBlocks,
            entityMap: strippedEntityMap
        };
    } catch (error) {
        console.error('Error stripping rich formatting:', error);
        return null; // If parsing fails, return null to clear the field
    }
}

function initService() {
    ipcMain.handle('DB/handleExport', () => handleExport());
    ipcMain.handle('DB/handleAdvancedExport', (event, options) => handleAdvancedExport(options));
    ipcMain.handle('DB/handleImport', async () => handleImport());
    ipcMain.handle('DB/handleBackup', () => handleBackup());
    ipcMain.handle('DB/changeBackupDir', () => handleChangeBackupDir());
    ipcMain.handle('DB/getBackupDir', () => getBackupDir());
}

async function handleExport() {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory'], // Open directory selection dialog
    });

    console.info('Exporting database to ', result.filePaths[0]);

    if (result.canceled) {
        console.info('Export cancelled');
        return;
    }

    const dbDir = path.dirname(config.contentDbPath);
    const dateTime = new Date().toISOString().replace(/[:.]/g, '-');
    const dir = path.join(result.filePaths[0], `data-${dateTime}`);
    try {
        await fs.copy(dbDir, dir);
        console.info(`Database copied from ${dbDir} to ${dir}`);
        return dir;
    } catch (err) {
        console.error('Error in DBService handleExport ', err);
        throw err;
    }
}

async function handleImport() {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory'], // Open directory selection dialog
    });

    console.info('Importing database from ', result.filePaths[0]);

    if (result.canceled) {
        console.info('Import cancelled');
        return;
    }

    
    const dirOfNewData = result.filePaths[0];
    const dirOfActive = path.dirname(config.contentDbPath);
    try {
        // backup current db before importing new one
        await handleBackup();
        await stopSequelize(); // we can stop sequelize
        await fs.copy(dirOfNewData, dirOfActive); // we can copy the files
        console.info(`Imported database copied from ${dirOfNewData}`);
        await startSequelize(); // TODO problem in restarting sequelize
        return dirOfNewData;
    } catch (err) {
        console.error('Error in DBService handleImport ', err);
        throw err;
    }
}

async function handleBackup() {
    const dateTime = new Date().toISOString().replace(/[:.]/g, '-');
    const targetDir = path.join(config.dbBackupFolderPath, `data-${dateTime}`);
    const dbDir = path.dirname(config.contentDbPath);
    try {
        await fs.copy(dbDir, targetDir);
        console.info(`Original database backed up to ${targetDir}`);
        return targetDir;
    } catch (err) {
        console.error('Error in DBService handleBackup ', err);
        throw err;
    }
}

async function handleChangeBackupDir() {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory'], // Open directory selection dialog
    });

    console.info('Changeing backup dir to ', result.filePaths[0]);

    if (result.canceled) {
        console.info('Change cancelled');
        return;
    }

    changeDbBackupFolderPath(result.filePaths[0]);
    return config.dbBackupFolderPath;
}

function getBackupDir() {
    return config.dbBackupFolderPath;
}

async function handleAdvancedExport(options) {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory'],
    });

    if (result.canceled) {
        console.info('Advanced export cancelled');
        return;
    }

    const dateTime = new Date().toISOString().replace(/[:.]/g, '-');
    const exportDir = path.join(result.filePaths[0], `data-export-${dateTime}`);
    
    try {
        // Create export directory structure
        await fs.ensureDir(exportDir);
        await fs.ensureDir(path.join(exportDir, 'images'));
        await fs.ensureDir(path.join(exportDir, 'audios'));
        await fs.ensureDir(path.join(exportDir, 'videos'));

        // Copy and modify database
        const sourceDbPath = config.contentDbPath;
        const targetDbPath = path.join(exportDir, 'content.db');
        
        // First, copy the entire database
        await fs.copy(sourceDbPath, targetDbPath);
        
        // Now modify the copied database based on options
        await modifyExportedDatabase(targetDbPath, options);
        
        // Copy only the media files that are still referenced
        await copyReferencedMedia(targetDbPath, exportDir);
        
        // Copy config.json
        const configPath = path.join(path.dirname(sourceDbPath), 'config.json');
        if (await fs.pathExists(configPath)) {
            await fs.copy(configPath, path.join(exportDir, 'config.json'));
        }
        
        console.info(`Advanced export completed to ${exportDir}`);
        return exportDir;
    } catch (err) {
        console.error('Error in DBService handleAdvancedExport ', err);
        throw err;
    }
}

async function modifyExportedDatabase(dbPath, options) {
    const db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    try {
        await db.run('BEGIN TRANSACTION');

        // 1. Filter by categories
        if (options.selectedCategories && options.selectedCategories.length > 0) {
            const categoryIds = options.selectedCategories.join(',');
            
            // Get articles that should be removed
            const articlesToRemove = await db.all(
                `SELECT id FROM articles WHERE categoryId NOT IN (${categoryIds}) OR categoryId IS NULL`
            );
            const articleIdsToRemove = articlesToRemove.map(a => a.id);
            
            if (articleIdsToRemove.length > 0) {
                const idsPlaceholder = articleIdsToRemove.join(',');
                
                // Remove associated data
                await db.run(`DELETE FROM comments WHERE articleId IN (${idsPlaceholder})`);
                await db.run(`DELETE FROM annotations WHERE articleId IN (${idsPlaceholder})`);
                await db.run(`DELETE FROM images WHERE articleId IN (${idsPlaceholder})`);
                await db.run(`DELETE FROM audios WHERE articleId IN (${idsPlaceholder})`);
                await db.run(`DELETE FROM videos WHERE articleId IN (${idsPlaceholder})`);
                await db.run(`DELETE FROM article_tag_rels WHERE articleId IN (${idsPlaceholder})`);
                await db.run(`DELETE FROM article_group_rels WHERE articleId IN (${idsPlaceholder})`);
                await db.run(`DELETE FROM article_article_rels WHERE articleId IN (${idsPlaceholder}) OR relatedArticleId IN (${idsPlaceholder})`);
                
                // Remove articles
                await db.run(`DELETE FROM articles WHERE id IN (${idsPlaceholder})`);
            }
            
            // Remove unselected categories
            await db.run(`DELETE FROM categories WHERE id NOT IN (${categoryIds})`);
        }

        // 2. Handle notes and quotes (annotations)
        if (!options.includeNotes || !options.includeQuotes) {
            if (!options.includeNotes && !options.includeQuotes) {
                // Remove all annotations
                await db.run('DELETE FROM annotations');
            } else if (!options.includeNotes) {
                // Clear notes but keep quotes
                await db.run('UPDATE annotations SET note = NULL');
            } else if (!options.includeQuotes) {
                // Clear quotes but keep notes
                await db.run('UPDATE annotations SET quote = NULL');
            }
        }

        // 3. Handle tags
        if (!options.includeTags) {
            await db.run('DELETE FROM article_tag_rels');
            await db.run('DELETE FROM tags');
        }

        // 4. Handle groups
        if (!options.includeGroups) {
            await db.run('DELETE FROM article_group_rels');
            await db.run('DELETE FROM groups');
        }

        // 5. Handle related articles
        if (!options.includeRelatedArticles) {
            await db.run('DELETE FROM article_article_rels');
        }

        // 6. Handle rich edits
        if (!options.includeRichEdits) {
            // For articles with explanationJson
            const articlesWithExplanationJson = await db.all('SELECT id, explanationJson FROM articles WHERE explanationJson IS NOT NULL');
            for (const article of articlesWithExplanationJson) {
                if (article.explanationJson) {
                    const stripped = stripRichFormattingKeepMedia(article.explanationJson);
                    if (stripped) {
                        await db.run('UPDATE articles SET explanationJson = ? WHERE id = ?', [JSON.stringify(stripped), article.id]);
                    } else {
                        await db.run('UPDATE articles SET explanationJson = NULL WHERE id = ?', [article.id]);
                    }
                }
            }
            
            // For articles with textJson
            const articlesWithTextJson = await db.all('SELECT id, textJson FROM articles WHERE textJson IS NOT NULL');
            for (const article of articlesWithTextJson) {
                if (article.textJson) {
                    const stripped = stripRichFormattingKeepMedia(article.textJson);
                    if (stripped) {
                        await db.run('UPDATE articles SET textJson = ? WHERE id = ?', [JSON.stringify(stripped), article.id]);
                    } else {
                        await db.run('UPDATE articles SET textJson = NULL WHERE id = ?', [article.id]);
                    }
                }
            }
            
            // For comments with textJson
            const commentsWithTextJson = await db.all('SELECT id, textJson FROM comments WHERE textJson IS NOT NULL');
            for (const comment of commentsWithTextJson) {
                if (comment.textJson) {
                    const stripped = stripRichFormattingKeepMedia(comment.textJson);
                    if (stripped) {
                        await db.run('UPDATE comments SET textJson = ? WHERE id = ?', [JSON.stringify(stripped), comment.id]);
                    } else {
                        await db.run('UPDATE comments SET textJson = NULL WHERE id = ?', [comment.id]);
                    }
                }
            }
        }

        // 7. Clean up orphaned tags (tags not associated with any article)
        await db.run(`
            DELETE FROM tags 
            WHERE id NOT IN (
                SELECT DISTINCT tagId FROM article_tag_rels
            )
        `);

        // 8. Clean up orphaned groups
        await db.run(`
            DELETE FROM groups 
            WHERE id NOT IN (
                SELECT DISTINCT groupId FROM article_group_rels
            )
        `);

        await db.run('COMMIT');
        
        // Vacuum to reclaim space
        await db.run('VACUUM');
        
    } catch (err) {
        await db.run('ROLLBACK');
        throw err;
    } finally {
        await db.close();
    }
}

async function copyReferencedMedia(dbPath, exportDir) {
    const db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    try {
        const sourceDir = path.dirname(config.contentDbPath);
        
        // Get all image paths
        const images = await db.all('SELECT path FROM images');
        for (const img of images) {
            if (img.path) {
                const sourcePath = path.join(sourceDir, 'images', path.basename(img.path));
                const targetPath = path.join(exportDir, 'images', path.basename(img.path));
                if (await fs.pathExists(sourcePath)) {
                    await fs.copy(sourcePath, targetPath);
                }
            }
        }
        
        // Get all audio paths
        const audios = await db.all('SELECT path FROM audios');
        for (const audio of audios) {
            if (audio.path) {
                const sourcePath = path.join(sourceDir, 'audios', path.basename(audio.path));
                const targetPath = path.join(exportDir, 'audios', path.basename(audio.path));
                if (await fs.pathExists(sourcePath)) {
                    await fs.copy(sourcePath, targetPath);
                }
            }
        }
        
        // Get all video paths
        const videos = await db.all('SELECT path FROM videos');
        for (const video of videos) {
            if (video.path) {
                const sourcePath = path.join(sourceDir, 'videos', path.basename(video.path));
                const targetPath = path.join(exportDir, 'videos', path.basename(video.path));
                if (await fs.pathExists(sourcePath)) {
                    await fs.copy(sourcePath, targetPath);
                }
            }
        }
        
    } finally {
        await db.close();
    }
}

const dbService = {
    initService,
};

export default dbService;
