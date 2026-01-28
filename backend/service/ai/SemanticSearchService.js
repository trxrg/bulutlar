import { ipcMain } from 'electron';
import log from 'electron-log';
import VectorService from './VectorService.js';

/**
 * Initialize the Semantic Search Service
 */
function initService() {
    ipcMain.handle('ai/search/semantic', async (event, query, options) => await semanticSearch(query, options));
    ipcMain.handle('ai/search/getSearchStatus', async () => await getSearchStatus());
    
    log.info('SemanticSearchService initialized');
}

/**
 * Perform semantic search with article enrichment
 */
async function semanticSearch(query, options = {}) {
    const {
        limit = 10,
        minSimilarity = 0.3,
        includeChunkText = true
    } = options;
    
    try {
        // Check if we have any indexed articles
        const status = await VectorService.getVectorStatus();
        if (status.indexedArticles === 0) {
            return {
                success: true,
                results: [],
                message: 'No articles indexed. Please rebuild the index in AI Settings.'
            };
        }
        
        // Perform vector search
        const searchResult = await VectorService.semanticSearch(query, limit * 2); // Get more results to filter
        
        if (!searchResult.success) {
            return searchResult;
        }
        
        // Filter by minimum similarity
        const filteredResults = searchResult.results
            .filter(r => r.similarity >= minSimilarity)
            .slice(0, limit);
        
        // Enrich results with article data
        const { default: ArticleService } = await import('../ArticleService.js');
        
        const enrichedResults = await Promise.all(
            filteredResults.map(async (result) => {
                try {
                    const article = await ArticleService.getArticleById(result.articleId);
                    
                    if (!article || article.error) {
                        return null;
                    }
                    
                    return {
                        articleId: result.articleId,
                        title: article.title,
                        date: article.date,
                        similarity: result.similarity,
                        similarityPercent: Math.round(result.similarity * 100),
                        matchedChunk: includeChunkText ? result.chunkText : undefined,
                        // Include some article metadata
                        categoryId: article.categoryId,
                        ownerId: article.ownerId,
                        isStarred: article.isStarred,
                        isRead: article.isRead
                    };
                } catch (error) {
                    log.error(`Failed to enrich search result for article ${result.articleId}:`, error);
                    return null;
                }
            })
        );
        
        // Filter out failed enrichments
        const validResults = enrichedResults.filter(r => r !== null);
        
        return {
            success: true,
            results: validResults,
            query,
            totalFound: validResults.length
        };
    } catch (error) {
        log.error('Semantic search failed:', error);
        return {
            success: false,
            error: error.message,
            results: []
        };
    }
}

/**
 * Get search service status
 */
async function getSearchStatus() {
    try {
        const vectorStatus = await VectorService.getVectorStatus();
        
        return {
            isReady: vectorStatus.indexedArticles > 0,
            indexedArticles: vectorStatus.indexedArticles,
            embeddingModelLoaded: vectorStatus.embeddingModelLoaded,
            embeddingModelLoading: vectorStatus.embeddingModelLoading
        };
    } catch (error) {
        log.error('Failed to get search status:', error);
        return {
            isReady: false,
            indexedArticles: 0,
            embeddingModelLoaded: false,
            embeddingModelLoading: false,
            error: error.message
        };
    }
}

const SemanticSearchService = {
    initService,
    semanticSearch,
    getSearchStatus
};

export default SemanticSearchService;
