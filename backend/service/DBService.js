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
        
        // Strip all highlight styles from inline styles in all blocks
        const highlightStyles = ['HIGHLIGHT', 'HIGHLIGHT_GREEN', 'HIGHLIGHT_BLUE', 'HIGHLIGHT_PINK'];
        const strippedBlocks = content.blocks.map(block => {
            // Keep atomic blocks (images, audio, video) as-is
            if (block.type === 'atomic') {
                return block;
            }
            
            // For text blocks, remove all highlight styles from inline styles
            const filteredInlineStyles = (block.inlineStyleRanges || []).filter(
                style => !highlightStyles.includes(style.style)
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

function remapMediaIdsInDraftJson(jsonString, mediaIdMaps, mediaPathMaps) {
    try {
        const content = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
        if (!content || !content.entityMap) return null;

        let changed = false;
        const updatedEntityMap = { ...content.entityMap };

        // Map entity type to the path map key
        const typeToPathMapKey = { IMAGE: 'images', AUDIO: 'audios', VIDEO: 'videos' };

        for (const [key, entity] of Object.entries(updatedEntityMap)) {
            if (entity && entity.data && entity.data.id !== undefined) {
                const idMap = mediaIdMaps[entity.type];
                if (idMap && idMap[entity.data.id] !== undefined) {
                    const newData = {
                        ...entity.data,
                        id: idMap[entity.data.id]
                    };
                    // Also remap path if path maps are provided
                    if (mediaPathMaps && entity.data.path) {
                        const pathMapKey = typeToPathMapKey[entity.type];
                        if (pathMapKey && mediaPathMaps[pathMapKey] && mediaPathMaps[pathMapKey][entity.data.path]) {
                            newData.path = mediaPathMaps[pathMapKey][entity.data.path];
                        }
                    }
                    updatedEntityMap[key] = {
                        ...entity,
                        data: newData
                    };
                    changed = true;
                }
            }
        }

        if (!changed) return null;

        return JSON.stringify({
            ...content,
            entityMap: updatedEntityMap
        });
    } catch (error) {
        console.error('Error remapping media IDs in Draft.js JSON:', error);
        return null;
    }
}

function initService() {
    ipcMain.handle('DB/handleExport', () => handleExport());
    ipcMain.handle('DB/handleAdvancedExport', (event, options) => handleAdvancedExport(options));
    ipcMain.handle('DB/handleImport', async () => handleImport());
    ipcMain.handle('DB/handleMergeImport', async () => handleMergeImport());
    ipcMain.handle('DB/handleShareArticles', (event, articleIds, options) => handleShareArticles(articleIds, options));
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
        
        // Restart sequelize with retry logic
        let retries = 3;
        let lastError;
        while (retries > 0) {
            try {
                await startSequelize();
                console.info('Database connection verified after import');
                break;
            } catch (err) {
                lastError = err;
                retries--;
                if (retries === 0) {
                    console.error('Failed to restart database after all retries');
                    throw err;
                }
                console.warn(`Database connection failed, retrying... (${retries} attempts left)`);
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
        
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

async function handleShareArticles(articleIds, options = {}) {
    if (!articleIds || articleIds.length === 0) {
        throw new Error('No article IDs provided for sharing');
    }

    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory'],
    });

    if (result.canceled) {
        console.info('Share articles cancelled');
        return;
    }

    const dateTime = new Date().toISOString().replace(/[:.]/g, '-');
    const exportDir = path.join(result.filePaths[0], `data-share-${dateTime}`);

    try {
        // Create export directory structure
        await fs.ensureDir(exportDir);
        await fs.ensureDir(path.join(exportDir, 'images'));
        await fs.ensureDir(path.join(exportDir, 'audios'));
        await fs.ensureDir(path.join(exportDir, 'videos'));

        // Copy the entire database first
        const sourceDbPath = config.contentDbPath;
        const targetDbPath = path.join(exportDir, 'content.db');
        await fs.copy(sourceDbPath, targetDbPath);

        // Modify the copied database to keep only selected articles and apply options
        await trimDatabaseToArticles(targetDbPath, articleIds, options);

        // Copy only the media files that are still referenced
        await copyReferencedMedia(targetDbPath, exportDir);

        console.info(`Share articles export completed to ${exportDir}. Articles: ${articleIds.length}`);
        return exportDir;
    } catch (err) {
        console.error('Error in DBService handleShareArticles ', err);
        throw err;
    }
}

async function trimDatabaseToArticles(dbPath, articleIds, options = {}) {
    const db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    try {
        await db.run('BEGIN TRANSACTION');

        const idsPlaceholder = articleIds.join(',');

        // Get articles that should be REMOVED (not in the selected list)
        const articlesToRemove = await db.all(
            `SELECT id FROM articles WHERE id NOT IN (${idsPlaceholder})`
        );
        const articleIdsToRemove = articlesToRemove.map(a => a.id);

        if (articleIdsToRemove.length > 0) {
            const removeIdsPlaceholder = articleIdsToRemove.join(',');

            // Remove associated data for unwanted articles
            await db.run(`DELETE FROM comments WHERE articleId IN (${removeIdsPlaceholder})`);
            await db.run(`DELETE FROM annotations WHERE articleId IN (${removeIdsPlaceholder})`);
            await db.run(`DELETE FROM images WHERE articleId IN (${removeIdsPlaceholder})`);
            await db.run(`DELETE FROM audios WHERE articleId IN (${removeIdsPlaceholder})`);
            await db.run(`DELETE FROM videos WHERE articleId IN (${removeIdsPlaceholder})`);
            await db.run(`DELETE FROM article_tag_rels WHERE articleId IN (${removeIdsPlaceholder})`);
            await db.run(`DELETE FROM article_group_rels WHERE articleId IN (${removeIdsPlaceholder})`);
            await db.run(`DELETE FROM article_article_rels WHERE articleId IN (${removeIdsPlaceholder}) OR relatedArticleId IN (${removeIdsPlaceholder})`);

            // Remove the unwanted articles themselves
            await db.run(`DELETE FROM articles WHERE id IN (${removeIdsPlaceholder})`);
        }

        // Apply export options to remaining articles

        // Always strip rich text formatting (highlights, links, etc.) as they are personal edits
        const articlesForStripping = await db.all('SELECT id, explanationJson, textJson FROM articles');
        for (const article of articlesForStripping) {
            if (article.explanationJson) {
                const stripped = stripRichFormattingKeepMedia(article.explanationJson);
                if (stripped) {
                    await db.run('UPDATE articles SET explanationJson = ? WHERE id = ?', [JSON.stringify(stripped), article.id]);
                }
            }
            if (article.textJson) {
                const stripped = stripRichFormattingKeepMedia(article.textJson);
                if (stripped) {
                    await db.run('UPDATE articles SET textJson = ? WHERE id = ?', [JSON.stringify(stripped), article.id]);
                }
            }
        }
        const commentsForStripping = await db.all('SELECT id, textJson FROM comments WHERE textJson IS NOT NULL');
        for (const comment of commentsForStripping) {
            if (comment.textJson) {
                const stripped = stripRichFormattingKeepMedia(comment.textJson);
                if (stripped) {
                    await db.run('UPDATE comments SET textJson = ? WHERE id = ?', [JSON.stringify(stripped), comment.id]);
                }
            }
        }

        // Handle explanation option
        if (options.explanation === false) {
            await db.run('UPDATE articles SET explanation = NULL, explanationJson = NULL');
        }

        // Handle mainText option
        if (options.mainText === false) {
            await db.run('UPDATE articles SET text = NULL, textJson = NULL');
        }

        // Handle comment option
        if (options.comment === false) {
            await db.run('DELETE FROM comments');
        }

        // Handle images option (also covers audios/videos since they are all media)
        if (options.images === false) {
            await db.run('DELETE FROM images');
            await db.run('DELETE FROM audios');
            await db.run('DELETE FROM videos');
            // Strip media entities from remaining JSON fields
            const articles = await db.all('SELECT id, explanationJson, textJson FROM articles');
            for (const article of articles) {
                if (article.explanationJson) {
                    const stripped = stripRichFormattingKeepMedia(article.explanationJson);
                    // Since we're removing media, clear out the media entities too
                    if (stripped) {
                        stripped.entityMap = {};
                        stripped.blocks = stripped.blocks.filter(b => b.type !== 'atomic');
                        await db.run('UPDATE articles SET explanationJson = ? WHERE id = ?', [JSON.stringify(stripped), article.id]);
                    }
                }
                if (article.textJson) {
                    const stripped = stripRichFormattingKeepMedia(article.textJson);
                    if (stripped) {
                        stripped.entityMap = {};
                        stripped.blocks = stripped.blocks.filter(b => b.type !== 'atomic');
                        await db.run('UPDATE articles SET textJson = ? WHERE id = ?', [JSON.stringify(stripped), article.id]);
                    }
                }
            }
        }

        // Handle notes option (annotations)
        if (options.notes === false) {
            await db.run('DELETE FROM annotations');
        }

        // Handle tags option
        if (options.tags === false) {
            await db.run('DELETE FROM article_tag_rels');
            await db.run('DELETE FROM tags');
        }

        // Handle relatedArticles option
        if (options.relatedArticles === false) {
            await db.run('DELETE FROM article_article_rels');
        }

        // Handle collections (groups) option
        if (options.collections === false) {
            await db.run('DELETE FROM article_group_rels');
            await db.run('DELETE FROM groups');
        }

        // Clean up orphaned owners (owners not associated with any remaining article or comment)
        await db.run(`
            DELETE FROM owners 
            WHERE id NOT IN (
                SELECT DISTINCT ownerId FROM articles WHERE ownerId IS NOT NULL
                UNION
                SELECT DISTINCT ownerId FROM comments WHERE ownerId IS NOT NULL
            )
        `);

        // Clean up orphaned categories
        await db.run(`
            DELETE FROM categories 
            WHERE id NOT IN (
                SELECT DISTINCT categoryId FROM articles WHERE categoryId IS NOT NULL
            )
        `);

        // Clean up orphaned tags
        await db.run(`
            DELETE FROM tags 
            WHERE id NOT IN (
                SELECT DISTINCT tagId FROM article_tag_rels
            )
        `);

        // Clean up orphaned groups
        await db.run(`
            DELETE FROM groups 
            WHERE id NOT IN (
                SELECT DISTINCT groupId FROM article_group_rels
            )
        `);

        // Clean up lookups (not needed for sharing)
        await db.run('DELETE FROM lookups');

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

async function handleMergeImport() {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory'],
    });

    if (result.canceled) {
        console.info('Merge import cancelled');
        return;
    }

    const sourceDir = result.filePaths[0];
    const sourceDbPath = path.join(sourceDir, 'content.db');

    // Validate source directory
    if (!await fs.pathExists(sourceDbPath)) {
        throw new Error('Selected folder does not contain a content.db file');
    }

    console.info('Merge importing database from ', sourceDir);

    try {
        // Backup current db before merging
        await handleBackup();

        // Stop Sequelize to release DB lock
        await stopSequelize();

        // Open source DB (read-only)
        const sourceDb = await open({
            filename: sourceDbPath,
            driver: sqlite3.Database
        });

        // Open active DB for writing
        const activeDb = await open({
            filename: config.contentDbPath,
            driver: sqlite3.Database
        });

        // Track old path -> new path for media files so each import gets unique filenames
        const mediaFileCopyMap = { images: {}, audios: {}, videos: {} };

        try {
            // Read all source data into memory
            const sourceOwners = await sourceDb.all('SELECT * FROM owners');
            const sourceCategories = await sourceDb.all('SELECT * FROM categories');
            const sourceTags = await sourceDb.all('SELECT * FROM tags');
            const sourceGroups = await sourceDb.all('SELECT * FROM groups');
            const sourceArticles = await sourceDb.all('SELECT * FROM articles');
            const sourceComments = await sourceDb.all('SELECT * FROM comments');
            const sourceImages = await sourceDb.all('SELECT * FROM images');
            const sourceAudios = await sourceDb.all('SELECT * FROM audios');
            const sourceVideos = await sourceDb.all('SELECT * FROM videos');
            const sourceAnnotations = await sourceDb.all('SELECT * FROM annotations');
            const sourceArticleTagRels = await sourceDb.all('SELECT * FROM article_tag_rels');
            const sourceArticleGroupRels = await sourceDb.all('SELECT * FROM article_group_rels');
            const sourceArticleArticleRels = await sourceDb.all('SELECT * FROM article_article_rels');

            // ID mapping tables: sourceId -> targetId
            const ownerIdMap = {};
            const categoryIdMap = {};
            const tagIdMap = {};
            const groupIdMap = {};
            const articleIdMap = {};
            const commentIdMap = {};
            const imageIdMap = {};
            const audioIdMap = {};
            const videoIdMap = {};

            await activeDb.run('BEGIN TRANSACTION');

            // --- 1. Owners (dedup by name) ---
            const existingOwners = await activeDb.all('SELECT id, name FROM owners');
            const existingOwnersByName = {};
            for (const o of existingOwners) {
                existingOwnersByName[o.name] = o.id;
            }
            for (const owner of sourceOwners) {
                if (owner.name && existingOwnersByName[owner.name] !== undefined) {
                    ownerIdMap[owner.id] = existingOwnersByName[owner.name];
                } else {
                    const result = await activeDb.run(
                        'INSERT INTO owners (name, ordering, field1, field2, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
                        [owner.name, owner.ordering, owner.field1, owner.field2, owner.createdAt, owner.updatedAt]
                    );
                    ownerIdMap[owner.id] = result.lastID;
                    if (owner.name) {
                        existingOwnersByName[owner.name] = result.lastID;
                    }
                }
            }

            // --- 2. Categories (dedup by name) ---
            const existingCategories = await activeDb.all('SELECT id, name FROM categories');
            const existingCategoriesByName = {};
            for (const c of existingCategories) {
                existingCategoriesByName[c.name] = c.id;
            }
            for (const cat of sourceCategories) {
                if (cat.name && existingCategoriesByName[cat.name] !== undefined) {
                    categoryIdMap[cat.id] = existingCategoriesByName[cat.name];
                } else {
                    const result = await activeDb.run(
                        'INSERT INTO categories (name, color, ordering, field1, field2, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
                        [cat.name, cat.color, cat.ordering, cat.field1, cat.field2, cat.createdAt, cat.updatedAt]
                    );
                    categoryIdMap[cat.id] = result.lastID;
                    if (cat.name) {
                        existingCategoriesByName[cat.name] = result.lastID;
                    }
                }
            }

            // --- 3. Tags (dedup by name, unique constraint) ---
            const existingTags = await activeDb.all('SELECT id, name FROM tags');
            const existingTagsByName = {};
            for (const t of existingTags) {
                existingTagsByName[t.name] = t.id;
            }
            for (const tag of sourceTags) {
                if (tag.name && existingTagsByName[tag.name] !== undefined) {
                    tagIdMap[tag.id] = existingTagsByName[tag.name];
                } else {
                    const result = await activeDb.run(
                        'INSERT INTO tags (name, ordering, field1, field2, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
                        [tag.name, tag.ordering, tag.field1, tag.field2, tag.createdAt, tag.updatedAt]
                    );
                    tagIdMap[tag.id] = result.lastID;
                    if (tag.name) {
                        existingTagsByName[tag.name] = result.lastID;
                    }
                }
            }

            // --- 4. Groups (dedup by name, unique constraint) ---
            const existingGroups = await activeDb.all('SELECT id, name FROM groups');
            const existingGroupsByName = {};
            for (const g of existingGroups) {
                existingGroupsByName[g.name] = g.id;
            }
            for (const group of sourceGroups) {
                if (group.name && existingGroupsByName[group.name] !== undefined) {
                    groupIdMap[group.id] = existingGroupsByName[group.name];
                } else {
                    const result = await activeDb.run(
                        'INSERT INTO groups (name, ordering, field1, field2, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
                        [group.name, group.ordering, group.field1, group.field2, group.createdAt, group.updatedAt]
                    );
                    groupIdMap[group.id] = result.lastID;
                    if (group.name) {
                        existingGroupsByName[group.name] = result.lastID;
                    }
                }
            }

            // --- 5. Articles (always insert new, remap ownerId & categoryId) ---
            for (const article of sourceArticles) {
                const newOwnerId = article.ownerId ? ownerIdMap[article.ownerId] || null : null;
                const newCategoryId = article.categoryId ? categoryIdMap[article.categoryId] || null : null;
                const result = await activeDb.run(
                    `INSERT INTO articles (title, date, number, date2, number2, ordering, explanation, explanationJson,
                        text, textJson, code, isEditable, isDateUncertain, isStarred, isPublished, isDeleted, isArchived,
                        isDraft, isHidden, isProtected, isFeatured, isPinned, isPrivate, isRead,
                        field1, field2, field3, ownerId, categoryId, createdAt, updatedAt)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [article.title, article.date, article.number, article.date2, article.number2,
                        article.ordering, article.explanation, article.explanationJson,
                        article.text, article.textJson, article.code,
                        article.isEditable, article.isDateUncertain, article.isStarred, article.isPublished,
                        article.isDeleted, article.isArchived, article.isDraft, article.isHidden,
                        article.isProtected, article.isFeatured, article.isPinned, article.isPrivate, article.isRead,
                        article.field1, article.field2, article.field3,
                        newOwnerId, newCategoryId,
                        article.createdAt, article.updatedAt]
                );
                articleIdMap[article.id] = result.lastID;
            }

            // --- 6. Comments (remap articleId & ownerId, track id mapping) ---
            for (const comment of sourceComments) {
                const newArticleId = comment.articleId ? articleIdMap[comment.articleId] || null : null;
                const newOwnerId = comment.ownerId ? ownerIdMap[comment.ownerId] || null : null;
                const cmtResult = await activeDb.run(
                    `INSERT INTO comments (date, text, textJson, ordering, field1, field2, articleId, ownerId, createdAt, updatedAt)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [comment.date, comment.text, comment.textJson, comment.ordering,
                        comment.field1, comment.field2, newArticleId, newOwnerId,
                        comment.createdAt, comment.updatedAt]
                );
                commentIdMap[comment.id] = cmtResult.lastID;
            }

            // --- 7. Images (remap articleId, track id mapping, generate unique path) ---
            for (const image of sourceImages) {
                const newArticleId = image.articleId ? articleIdMap[image.articleId] || null : null;
                const newPath = image.name + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
                if (image.path) {
                    mediaFileCopyMap.images[image.path] = newPath;
                }
                const imgResult = await activeDb.run(
                    `INSERT INTO images (name, type, path, size, description, ordering, field1, field2, articleId, createdAt, updatedAt)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [image.name, image.type, newPath, image.size, image.description,
                        image.ordering, image.field1, image.field2, newArticleId,
                        image.createdAt, image.updatedAt]
                );
                imageIdMap[image.id] = imgResult.lastID;
            }

            // --- 8. Audios (remap articleId, track id mapping, generate unique path) ---
            for (const audio of sourceAudios) {
                const newArticleId = audio.articleId ? articleIdMap[audio.articleId] || null : null;
                const newPath = audio.name + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
                if (audio.path) {
                    mediaFileCopyMap.audios[audio.path] = newPath;
                }
                const audResult = await activeDb.run(
                    `INSERT INTO audios (name, type, path, size, description, duration, ordering, field1, field2, articleId, createdAt, updatedAt)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [audio.name, audio.type, newPath, audio.size, audio.description,
                        audio.duration, audio.ordering, audio.field1, audio.field2, newArticleId,
                        audio.createdAt, audio.updatedAt]
                );
                audioIdMap[audio.id] = audResult.lastID;
            }

            // --- 9. Videos (remap articleId, track id mapping, generate unique path) ---
            for (const video of sourceVideos) {
                const newArticleId = video.articleId ? articleIdMap[video.articleId] || null : null;
                const newPath = video.name + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
                if (video.path) {
                    mediaFileCopyMap.videos[video.path] = newPath;
                }
                const vidResult = await activeDb.run(
                    `INSERT INTO videos (name, type, path, size, description, duration, width, height, ordering, field1, field2, articleId, createdAt, updatedAt)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [video.name, video.type, newPath, video.size, video.description,
                        video.duration, video.width, video.height, video.ordering,
                        video.field1, video.field2, newArticleId,
                        video.createdAt, video.updatedAt]
                );
                videoIdMap[video.id] = vidResult.lastID;
            }

            // --- 10. Annotations (remap articleId) ---
            for (const annotation of sourceAnnotations) {
                const newArticleId = annotation.articleId ? articleIdMap[annotation.articleId] || null : null;
                await activeDb.run(
                    `INSERT INTO annotations (quote, note, ordering, field1, field2, articleId, createdAt, updatedAt)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [annotation.quote, annotation.note, annotation.ordering,
                        annotation.field1, annotation.field2, newArticleId,
                        annotation.createdAt, annotation.updatedAt]
                );
            }

            // --- 11. article_tag_rels (remap articleId & tagId) ---
            for (const rel of sourceArticleTagRels) {
                const newArticleId = rel.articleId ? articleIdMap[rel.articleId] : null;
                const newTagId = rel.tagId ? tagIdMap[rel.tagId] : null;
                if (newArticleId && newTagId) {
                    // Check for duplicate before inserting
                    const existing = await activeDb.get(
                        'SELECT 1 FROM article_tag_rels WHERE articleId = ? AND tagId = ?',
                        [newArticleId, newTagId]
                    );
                    if (!existing) {
                        await activeDb.run(
                            'INSERT INTO article_tag_rels (articleId, tagId, tagOrdering, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)',
                            [newArticleId, newTagId, rel.tagOrdering, rel.createdAt, rel.updatedAt]
                        );
                    }
                }
            }

            // --- 12. article_group_rels (remap articleId & groupId) ---
            for (const rel of sourceArticleGroupRels) {
                const newArticleId = rel.articleId ? articleIdMap[rel.articleId] : null;
                const newGroupId = rel.groupId ? groupIdMap[rel.groupId] : null;
                if (newArticleId && newGroupId) {
                    const existing = await activeDb.get(
                        'SELECT 1 FROM article_group_rels WHERE articleId = ? AND groupId = ?',
                        [newArticleId, newGroupId]
                    );
                    if (!existing) {
                        await activeDb.run(
                            'INSERT INTO article_group_rels (articleId, groupId, groupOrdering, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)',
                            [newArticleId, newGroupId, rel.groupOrdering, rel.createdAt, rel.updatedAt]
                        );
                    }
                }
            }

            // --- 13. article_article_rels (remap articleId & relatedArticleId) ---
            for (const rel of sourceArticleArticleRels) {
                const newArticleId = rel.articleId ? articleIdMap[rel.articleId] : null;
                const newRelatedArticleId = rel.relatedArticleId ? articleIdMap[rel.relatedArticleId] : null;
                if (newArticleId && newRelatedArticleId) {
                    const existing = await activeDb.get(
                        'SELECT 1 FROM article_article_rels WHERE articleId = ? AND relatedArticleId = ?',
                        [newArticleId, newRelatedArticleId]
                    );
                    if (!existing) {
                        await activeDb.run(
                            'INSERT INTO article_article_rels (articleId, relatedArticleId, relatedArticleOrdering, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)',
                            [newArticleId, newRelatedArticleId, rel.relatedArticleOrdering, rel.createdAt, rel.updatedAt]
                        );
                    }
                }
            }

            // --- 14. Update media IDs and paths in Draft.js JSON content ---
            // The explanationJson and textJson fields contain Draft.js entityMap entries
            // with IMAGE/AUDIO/VIDEO entities that reference media records by their `id` and `path` fields.
            // Since media records got new IDs and paths, we need to update those references.
            const mediaIdMaps = { IMAGE: imageIdMap, AUDIO: audioIdMap, VIDEO: videoIdMap };

            for (const sourceArticle of sourceArticles) {
                const newArticleId = articleIdMap[sourceArticle.id];

                // Update explanationJson
                if (sourceArticle.explanationJson) {
                    const updatedJson = remapMediaIdsInDraftJson(sourceArticle.explanationJson, mediaIdMaps, mediaFileCopyMap);
                    if (updatedJson) {
                        await activeDb.run(
                            'UPDATE articles SET explanationJson = ? WHERE id = ?',
                            [updatedJson, newArticleId]
                        );
                    }
                }

                // Update textJson
                if (sourceArticle.textJson) {
                    const updatedJson = remapMediaIdsInDraftJson(sourceArticle.textJson, mediaIdMaps, mediaFileCopyMap);
                    if (updatedJson) {
                        await activeDb.run(
                            'UPDATE articles SET textJson = ? WHERE id = ?',
                            [updatedJson, newArticleId]
                        );
                    }
                }
            }

            // Also update comment textJson fields
            for (const sourceComment of sourceComments) {
                if (sourceComment.textJson) {
                    const newCommentId = commentIdMap[sourceComment.id];
                    if (newCommentId) {
                        const updatedJson = remapMediaIdsInDraftJson(sourceComment.textJson, mediaIdMaps, mediaFileCopyMap);
                        if (updatedJson) {
                            await activeDb.run(
                                'UPDATE comments SET textJson = ? WHERE id = ?',
                                [updatedJson, newCommentId]
                            );
                        }
                    }
                }
            }

            await activeDb.run('COMMIT');

            console.info(`Merge import DB operations completed. Articles imported: ${sourceArticles.length}`);

        } catch (err) {
            try { await activeDb.run('ROLLBACK'); } catch (rollbackErr) { console.error('Rollback failed:', rollbackErr); }
            throw err;
        } finally {
            await sourceDb.close();
            await activeDb.close();
        }

        // Copy media files with new unique names (outside transaction - file system operations)
        const activeDir = path.dirname(config.contentDbPath);
        await copyMediaFilesWithRename(sourceDir, activeDir, 'images', mediaFileCopyMap.images);
        await copyMediaFilesWithRename(sourceDir, activeDir, 'audios', mediaFileCopyMap.audios);
        await copyMediaFilesWithRename(sourceDir, activeDir, 'videos', mediaFileCopyMap.videos);

        // Restart Sequelize
        let retries = 3;
        while (retries > 0) {
            try {
                await startSequelize();
                console.info('Database connection verified after merge import');
                break;
            } catch (err) {
                retries--;
                if (retries === 0) {
                    console.error('Failed to restart database after all retries');
                    throw err;
                }
                console.warn(`Database connection failed, retrying... (${retries} attempts left)`);
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        console.info(`Merge import completed from ${sourceDir}`);
        return sourceDir;

    } catch (err) {
        console.error('Error in DBService handleMergeImport ', err);
        throw err;
    }
}

async function copyMediaFiles(sourceDir, activeDir, mediaType) {
    const sourceMediaDir = path.join(sourceDir, mediaType);
    const targetMediaDir = path.join(activeDir, mediaType);

    if (!await fs.pathExists(sourceMediaDir)) {
        return;
    }

    await fs.ensureDir(targetMediaDir);

    const files = await fs.readdir(sourceMediaDir);
    for (const file of files) {
        const sourcePath = path.join(sourceMediaDir, file);
        const targetPath = path.join(targetMediaDir, file);
        // Skip if file already exists (same filename = same file from shared export)
        if (!await fs.pathExists(targetPath)) {
            const stat = await fs.stat(sourcePath);
            if (stat.isFile()) {
                await fs.copy(sourcePath, targetPath);
            }
        }
    }
}

async function copyMediaFilesWithRename(sourceDir, activeDir, mediaType, pathMap) {
    const sourceMediaDir = path.join(sourceDir, mediaType);
    const targetMediaDir = path.join(activeDir, mediaType);

    if (!await fs.pathExists(sourceMediaDir)) {
        return;
    }

    await fs.ensureDir(targetMediaDir);

    for (const [oldPath, newPath] of Object.entries(pathMap)) {
        const sourcePath = path.join(sourceMediaDir, path.basename(oldPath));
        const targetPath = path.join(targetMediaDir, newPath);
        if (await fs.pathExists(sourcePath)) {
            await fs.copy(sourcePath, targetPath);
        }
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
