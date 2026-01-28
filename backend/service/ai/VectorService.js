import { ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';
import { config } from '../../config.js';
import { ensureFolderExists } from '../../fsOps.js';
import log from 'electron-log';
import { 
    AVAILABLE_EMBEDDING_MODELS, 
    DEFAULT_EMBEDDING_MODEL_ID, 
    getEmbeddingModelById,
    getDefaultEmbeddingModel 
} from './embeddingModels.js';

// Dynamic imports for native modules
let Database;
let pipeline;
let env;
let electronStore;

// Embedding model state
let embeddingModel = null;
let embeddingModelLoading = false;
let currentEmbeddingModelId = null;
let vectorDb = null;

// Constants
const CHUNK_SIZE = 100; // words per chunk
const CHUNK_OVERLAP = 25; // words overlap between chunks
const EMBEDDING_MODEL_SETTING_KEY = 'embeddingModelId';
const CHUNK_CONFIG_VERSION = `${CHUNK_SIZE}_${CHUNK_OVERLAP}`; // Track chunk configuration

/**
 * Get the electron-store instance (lazy load)
 */
async function getStore() {
    if (!electronStore) {
        const Store = (await import('electron-store')).default;
        electronStore = new Store();
    }
    return electronStore;
}

/**
 * Get the currently selected embedding model ID from settings
 */
async function getSelectedEmbeddingModelId() {
    try {
        const store = await getStore();
        const modelId = store.get(EMBEDDING_MODEL_SETTING_KEY);
        if (modelId && getEmbeddingModelById(modelId)) {
            return modelId;
        }
        return DEFAULT_EMBEDDING_MODEL_ID;
    } catch (error) {
        log.error('Failed to get selected embedding model ID:', error);
        return DEFAULT_EMBEDDING_MODEL_ID;
    }
}

/**
 * Set the selected embedding model ID in settings
 */
async function setSelectedEmbeddingModelId(modelId) {
    try {
        if (!getEmbeddingModelById(modelId)) {
            throw new Error(`Invalid embedding model ID: ${modelId}`);
        }
        const store = await getStore();
        store.set(EMBEDDING_MODEL_SETTING_KEY, modelId);
        log.info('Embedding model preference saved:', modelId);
        return { success: true };
    } catch (error) {
        log.error('Failed to set embedding model ID:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get current embedding model configuration
 */
async function getCurrentEmbeddingModelConfig() {
    const modelId = await getSelectedEmbeddingModelId();
    return getEmbeddingModelById(modelId) || getDefaultEmbeddingModel();
}

/**
 * Initialize the Vector Service
 */
function initService() {
    ipcMain.handle('ai/vector/getStatus', async () => await getVectorStatus());
    ipcMain.handle('ai/vector/indexArticle', async (event, articleId) => await indexArticle(articleId));
    ipcMain.handle('ai/vector/removeArticle', async (event, articleId) => await removeArticleFromIndex(articleId));
    ipcMain.handle('ai/vector/rebuildIndex', async () => await rebuildIndex());
    ipcMain.handle('ai/vector/search', async (event, query, limit) => await semanticSearch(query, limit));
    ipcMain.handle('ai/vector/getIndexedCount', async () => await getIndexedArticleCount());
    
    // Embedding model management
    ipcMain.handle('ai/vector/getAvailableEmbeddingModels', async () => AVAILABLE_EMBEDDING_MODELS);
    ipcMain.handle('ai/vector/getSelectedEmbeddingModel', async () => await getSelectedEmbeddingModelId());
    ipcMain.handle('ai/vector/setEmbeddingModel', async (event, modelId) => await setSelectedEmbeddingModelId(modelId));
    ipcMain.handle('ai/vector/clearAndRebuildIndex', async () => await clearAndRebuildIndex());
    
    log.info('VectorService initialized');
}

/**
 * Initialize vector database (lazy loading)
 */
async function initVectorDb() {
    if (vectorDb) return vectorDb;
    
    try {
        // Dynamic import of better-sqlite3
        if (!Database) {
            const betterSqlite3 = await import('better-sqlite3');
            Database = betterSqlite3.default;
        }
        
        const vectorsDbPath = config.vectorsDbPath;
        ensureFolderExists(path.dirname(vectorsDbPath));
        
        vectorDb = new Database(vectorsDbPath);
        
        // Create tables if they don't exist
        vectorDb.exec(`
            CREATE TABLE IF NOT EXISTS article_chunks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                article_id INTEGER NOT NULL,
                chunk_index INTEGER NOT NULL,
                chunk_text TEXT NOT NULL,
                embedding BLOB NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(article_id, chunk_index)
            );
            
            CREATE INDEX IF NOT EXISTS idx_article_chunks_article_id 
            ON article_chunks(article_id);
            
            CREATE TABLE IF NOT EXISTS indexing_status (
                article_id INTEGER PRIMARY KEY,
                indexed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                chunk_count INTEGER NOT NULL
            );
        `);
        
        log.info('Vector database initialized at:', vectorsDbPath);
        return vectorDb;
    } catch (error) {
        log.error('Failed to initialize vector database:', error);
        throw error;
    }
}

/**
 * Load the embedding model (lazy loading)
 * @param {boolean} forceReload - Force reload even if model is already loaded
 */
async function loadEmbeddingModel(forceReload = false) {
    const selectedModelId = await getSelectedEmbeddingModelId();
    
    // If model is already loaded with the same ID, return it
    if (embeddingModel && currentEmbeddingModelId === selectedModelId && !forceReload) {
        return embeddingModel;
    }
    
    if (embeddingModelLoading) {
        // Wait for model to finish loading
        while (embeddingModelLoading) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        // Check again after waiting
        if (embeddingModel && currentEmbeddingModelId === selectedModelId) {
            return embeddingModel;
        }
    }
    
    embeddingModelLoading = true;
    
    try {
        // Dynamic import of transformers
        if (!pipeline || !env) {
            const transformers = await import('@xenova/transformers');
            pipeline = transformers.pipeline;
            env = transformers.env;
        }
        
        // Configure cache directory
        const cachePath = config.embeddingCachePath;
        ensureFolderExists(cachePath);
        env.cacheDir = cachePath;
        env.allowLocalModels = true;
        env.allowRemoteModels = true;
        
        const modelConfig = getEmbeddingModelById(selectedModelId) || getDefaultEmbeddingModel();
        const modelName = modelConfig.model;
        
        log.info('Loading embedding model:', modelName);
        
        // Unload previous model if different
        if (embeddingModel && currentEmbeddingModelId !== selectedModelId) {
            embeddingModel = null;
            currentEmbeddingModelId = null;
        }
        
        embeddingModel = await pipeline('feature-extraction', modelName, {
            quantized: true, // Use quantized model for faster inference
        });
        
        currentEmbeddingModelId = selectedModelId;
        log.info('Embedding model loaded successfully:', modelName);
        return embeddingModel;
    } catch (error) {
        log.error('Failed to load embedding model:', error);
        throw error;
    } finally {
        embeddingModelLoading = false;
    }
}

/**
 * Generate embedding for text
 */
async function generateEmbedding(text) {
    const model = await loadEmbeddingModel();
    
    // Clean and truncate text if necessary (model has token limit)
    const cleanedText = text.trim().substring(0, 8000);
    
    const output = await model(cleanedText, {
        pooling: 'mean',
        normalize: true
    });
    
    // Convert to Float32Array for storage
    return new Float32Array(output.data);
}

/**
 * Convert Float32Array to Buffer for storage
 */
function embeddingToBuffer(embedding) {
    return Buffer.from(embedding.buffer);
}

/**
 * Convert Buffer back to Float32Array
 */
function bufferToEmbedding(buffer) {
    return new Float32Array(buffer.buffer, buffer.byteOffset, buffer.length / 4);
}

/**
 * Calculate cosine similarity between two embeddings
 */
function cosineSimilarity(a, b) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Split text into chunks with overlap
 */
function chunkText(text, chunkSize = CHUNK_SIZE, overlap = CHUNK_OVERLAP) {
    // Clean HTML and normalize whitespace
    const cleanText = text
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ')
        .trim();
    
    const words = cleanText.split(/\s+/).filter(w => w.length > 0);
    
    if (words.length === 0) return [];
    if (words.length <= chunkSize) return [cleanText];
    
    const chunks = [];
    let start = 0;
    
    while (start < words.length) {
        const end = Math.min(start + chunkSize, words.length);
        const chunk = words.slice(start, end).join(' ');
        chunks.push(chunk);
        
        start += chunkSize - overlap;
        if (start >= words.length - overlap) break;
    }
    
    return chunks;
}

/**
 * Index a single article
 */
async function indexArticle(articleId) {
    try {
        const db = await initVectorDb();
        
        // Import ArticleService dynamically to avoid circular dependency
        const { default: ArticleService } = await import('../ArticleService.js');
        const article = await ArticleService.getArticleById(articleId);
        
        if (!article || article.error) {
            log.warn(`Article ${articleId} not found for indexing`);
            return { success: false, error: 'Article not found' };
        }
        
        // Combine all text content
        let fullText = '';
        if (article.title) fullText += article.title + ' ';
        if (article.text) fullText += article.text + ' ';
        if (article.explanation) fullText += article.explanation + ' ';
        if (article.comments && article.comments[0] && article.comments[0].text) {
            fullText += article.comments[0].text;
        }
        
        // Remove existing chunks for this article
        db.prepare('DELETE FROM article_chunks WHERE article_id = ?').run(articleId);
        db.prepare('DELETE FROM indexing_status WHERE article_id = ?').run(articleId);
        
        // Split into chunks
        const chunks = chunkText(fullText);
        
        if (chunks.length === 0) {
            log.info(`Article ${articleId} has no text content to index`);
            return { success: true, chunksIndexed: 0 };
        }
        
        // Generate embeddings and store
        const insertStmt = db.prepare(`
            INSERT INTO article_chunks (article_id, chunk_index, chunk_text, embedding)
            VALUES (?, ?, ?, ?)
        `);
        
        const insertMany = db.transaction((chunks) => {
            for (let i = 0; i < chunks.length; i++) {
                const embedding = null; // Placeholder, we'll update below
                insertStmt.run(articleId, i, chunks[i], embedding);
            }
        });
        
        // Actually generate embeddings and insert
        for (let i = 0; i < chunks.length; i++) {
            const embedding = await generateEmbedding(chunks[i]);
            const embeddingBuffer = embeddingToBuffer(embedding);
            
            db.prepare(`
                INSERT OR REPLACE INTO article_chunks (article_id, chunk_index, chunk_text, embedding)
                VALUES (?, ?, ?, ?)
            `).run(articleId, i, chunks[i], embeddingBuffer);
        }
        
        // Update indexing status
        db.prepare(`
            INSERT OR REPLACE INTO indexing_status (article_id, indexed_at, chunk_count)
            VALUES (?, CURRENT_TIMESTAMP, ?)
        `).run(articleId, chunks.length);
        
        log.info(`Indexed article ${articleId}: ${chunks.length} chunks`);
        return { success: true, chunksIndexed: chunks.length };
    } catch (error) {
        log.error(`Failed to index article ${articleId}:`, error);
        return { success: false, error: error.message };
    }
}

/**
 * Remove article from index
 */
async function removeArticleFromIndex(articleId) {
    try {
        const db = await initVectorDb();
        db.prepare('DELETE FROM article_chunks WHERE article_id = ?').run(articleId);
        db.prepare('DELETE FROM indexing_status WHERE article_id = ?').run(articleId);
        log.info(`Removed article ${articleId} from index`);
        return { success: true };
    } catch (error) {
        log.error(`Failed to remove article ${articleId} from index:`, error);
        return { success: false, error: error.message };
    }
}

/**
 * Rebuild the entire index
 */
async function rebuildIndex(progressCallback = null) {
    try {
        const db = await initVectorDb();
        
        // Clear existing index
        db.exec('DELETE FROM article_chunks');
        db.exec('DELETE FROM indexing_status');
        
        // Store the model ID and chunk configuration used for indexing
        const selectedModelId = await getSelectedEmbeddingModelId();
        db.exec(`
            CREATE TABLE IF NOT EXISTS index_metadata (
                key TEXT PRIMARY KEY,
                value TEXT
            )
        `);
        db.prepare(`
            INSERT OR REPLACE INTO index_metadata (key, value)
            VALUES ('embedding_model_id', ?)
        `).run(selectedModelId);
        db.prepare(`
            INSERT OR REPLACE INTO index_metadata (key, value)
            VALUES ('chunk_config_version', ?)
        `).run(CHUNK_CONFIG_VERSION);
        
        log.info(`Index metadata: model=${selectedModelId}, chunk_config=${CHUNK_CONFIG_VERSION}`);
        
        // Import ArticleService
        const { default: ArticleService } = await import('../ArticleService.js');
        const articles = await ArticleService.getAllArticles();
        
        log.info(`Rebuilding index for ${articles.length} articles with model: ${selectedModelId}`);
        
        let indexed = 0;
        let failed = 0;
        
        for (const article of articles) {
            try {
                await indexArticle(article.id);
                indexed++;
                
                if (progressCallback) {
                    progressCallback({
                        current: indexed + failed,
                        total: articles.length,
                        indexed,
                        failed
                    });
                }
            } catch (error) {
                failed++;
                log.error(`Failed to index article ${article.id}:`, error);
            }
        }
        
        log.info(`Index rebuild complete: ${indexed} indexed, ${failed} failed`);
        return { success: true, indexed, failed, total: articles.length };
    } catch (error) {
        log.error('Failed to rebuild index:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Clear all embeddings and rebuild index with the currently selected model
 * This should be called when changing embedding models
 */
async function clearAndRebuildIndex() {
    try {
        log.info('Clearing and rebuilding index with new embedding model...');
        
        // Unload current embedding model to force reload with new model
        embeddingModel = null;
        currentEmbeddingModelId = null;
        
        // Rebuild will clear the database and reindex everything
        return await rebuildIndex();
    } catch (error) {
        log.error('Failed to clear and rebuild index:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get the model ID used for the current index
 */
async function getIndexedModelId() {
    try {
        const db = await initVectorDb();
        
        // Check if metadata table exists
        const tableExists = db.prepare(`
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='index_metadata'
        `).get();
        
        if (!tableExists) {
            return null;
        }
        
        const result = db.prepare(`
            SELECT value FROM index_metadata WHERE key = 'embedding_model_id'
        `).get();
        
        return result ? result.value : null;
    } catch (error) {
        log.error('Failed to get indexed model ID:', error);
        return null;
    }
}

/**
 * Get the chunk configuration version used for the current index
 */
async function getIndexedChunkConfigVersion() {
    try {
        const db = await initVectorDb();
        
        // Check if metadata table exists
        const tableExists = db.prepare(`
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='index_metadata'
        `).get();
        
        if (!tableExists) {
            return null;
        }
        
        const result = db.prepare(`
            SELECT value FROM index_metadata WHERE key = 'chunk_config_version'
        `).get();
        
        return result ? result.value : null;
    } catch (error) {
        log.error('Failed to get indexed chunk config version:', error);
        return null;
    }
}

/**
 * Semantic search
 */
async function semanticSearch(query, limit = 10) {
    try {
        const db = await initVectorDb();
        
        // Generate query embedding
        const queryEmbedding = await generateEmbedding(query);
        
        // Get all chunks with their embeddings
        const chunks = db.prepare(`
            SELECT id, article_id, chunk_index, chunk_text, embedding
            FROM article_chunks
        `).all();
        
        if (chunks.length === 0) {
            return { success: true, results: [] };
        }
        
        // Calculate similarity scores
        const results = chunks.map(chunk => {
            const embedding = bufferToEmbedding(chunk.embedding);
            const similarity = cosineSimilarity(queryEmbedding, embedding);
            return {
                articleId: chunk.article_id,
                chunkIndex: chunk.chunk_index,
                chunkText: chunk.chunk_text,
                similarity
            };
        });
        
        // Sort by similarity and take top results
        results.sort((a, b) => b.similarity - a.similarity);
        
        // Group by article and take best chunk per article
        const articleBestChunks = new Map();
        for (const result of results) {
            if (!articleBestChunks.has(result.articleId) || 
                articleBestChunks.get(result.articleId).similarity < result.similarity) {
                articleBestChunks.set(result.articleId, result);
            }
        }
        
        // Convert back to array and limit
        const uniqueResults = Array.from(articleBestChunks.values())
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, limit);
        
        return { success: true, results: uniqueResults };
    } catch (error) {
        log.error('Semantic search failed:', error);
        return { success: false, error: error.message, results: [] };
    }
}

/**
 * Get indexed article count
 */
async function getIndexedArticleCount() {
    try {
        const db = await initVectorDb();
        const result = db.prepare('SELECT COUNT(DISTINCT article_id) as count FROM article_chunks').get();
        return { success: true, count: result.count };
    } catch (error) {
        log.error('Failed to get indexed article count:', error);
        return { success: false, count: 0, error: error.message };
    }
}

/**
 * Get vector service status
 */
async function getVectorStatus() {
    try {
        const indexedCount = await getIndexedArticleCount();
        const selectedModelId = await getSelectedEmbeddingModelId();
        const selectedModelConfig = getEmbeddingModelById(selectedModelId) || getDefaultEmbeddingModel();
        const indexedModelId = await getIndexedModelId();
        const indexedChunkConfig = await getIndexedChunkConfigVersion();
        
        // Check if current index was built with a different model
        const modelMismatch = indexedModelId && indexedModelId !== selectedModelId;
        
        // Check if current index was built with different chunk configuration
        // If indexedChunkConfig is null (old index), consider it a mismatch if there are indexed articles
        const chunkConfigMismatch = indexedCount.count > 0 && 
            (indexedChunkConfig === null || indexedChunkConfig !== CHUNK_CONFIG_VERSION);
        
        return {
            embeddingModelLoaded: embeddingModel !== null,
            embeddingModelLoading,
            embeddingModelId: selectedModelId,
            embeddingModelName: selectedModelConfig.name,
            embeddingModelConfig: selectedModelConfig,
            indexedArticles: indexedCount.count || 0,
            vectorDbInitialized: vectorDb !== null,
            indexedModelId,
            modelMismatch,
            chunkConfigMismatch,
            currentChunkConfig: CHUNK_CONFIG_VERSION,
            indexedChunkConfig,
            requiresReindex: modelMismatch || chunkConfigMismatch
        };
    } catch (error) {
        log.error('Failed to get vector status:', error);
        const defaultModel = getDefaultEmbeddingModel();
        return {
            embeddingModelLoaded: false,
            embeddingModelLoading: false,
            embeddingModelId: DEFAULT_EMBEDDING_MODEL_ID,
            embeddingModelName: defaultModel.name,
            embeddingModelConfig: defaultModel,
            indexedArticles: 0,
            vectorDbInitialized: false,
            indexedModelId: null,
            modelMismatch: false,
            chunkConfigMismatch: false,
            currentChunkConfig: CHUNK_CONFIG_VERSION,
            indexedChunkConfig: null,
            requiresReindex: false,
            error: error.message
        };
    }
}

/**
 * Check if article is indexed
 */
async function isArticleIndexed(articleId) {
    try {
        const db = await initVectorDb();
        const result = db.prepare('SELECT 1 FROM indexing_status WHERE article_id = ?').get(articleId);
        return !!result;
    } catch (error) {
        return false;
    }
}

/**
 * Get chunks for article (used by RAG)
 */
async function getArticleChunks(articleId) {
    try {
        const db = await initVectorDb();
        return db.prepare(`
            SELECT chunk_index, chunk_text 
            FROM article_chunks 
            WHERE article_id = ? 
            ORDER BY chunk_index
        `).all(articleId);
    } catch (error) {
        log.error(`Failed to get chunks for article ${articleId}:`, error);
        return [];
    }
}

/**
 * Search for relevant chunks (used by RAG)
 */
async function searchRelevantChunks(query, limit = 5) {
    try {
        const db = await initVectorDb();
        
        // Generate query embedding
        const queryEmbedding = await generateEmbedding(query);
        
        // Get all chunks
        const chunks = db.prepare(`
            SELECT id, article_id, chunk_index, chunk_text, embedding
            FROM article_chunks
        `).all();
        
        if (chunks.length === 0) {
            return [];
        }
        
        // Calculate similarity and sort
        const results = chunks.map(chunk => {
            const embedding = bufferToEmbedding(chunk.embedding);
            const similarity = cosineSimilarity(queryEmbedding, embedding);
            return {
                articleId: chunk.article_id,
                chunkIndex: chunk.chunk_index,
                chunkText: chunk.chunk_text,
                similarity
            };
        });
        
        results.sort((a, b) => b.similarity - a.similarity);
        
        return results.slice(0, limit);
    } catch (error) {
        log.error('Failed to search relevant chunks:', error);
        return [];
    }
}

const VectorService = {
    initService,
    indexArticle,
    removeArticleFromIndex,
    rebuildIndex,
    semanticSearch,
    getIndexedArticleCount,
    getVectorStatus,
    isArticleIndexed,
    getArticleChunks,
    searchRelevantChunks,
    generateEmbedding,
    loadEmbeddingModel,
    // Embedding model management
    getSelectedEmbeddingModelId,
    setSelectedEmbeddingModelId,
    clearAndRebuildIndex,
    getAvailableEmbeddingModels: () => AVAILABLE_EMBEDDING_MODELS
};

export default VectorService;
