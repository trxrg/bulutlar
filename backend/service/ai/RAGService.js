import { ipcMain } from 'electron';
import log from 'electron-log';
import VectorService from './VectorService.js';
import AIModelService from './AIModelService.js';

// Constants
const MAX_CONTEXT_CHUNKS = 5;
const MAX_CONTEXT_LENGTH = 4000; // characters

/**
 * Initialize the RAG (Retrieval-Augmented Generation) Service
 */
function initService() {
    ipcMain.handle('ai/rag/askQuestion', async (event, question, options) => await askQuestion(question, options));
    ipcMain.handle('ai/rag/getStatus', async () => await getRAGStatus());
    
    log.info('RAGService initialized');
}

/**
 * Ask a question and get an answer based on article content
 */
async function askQuestion(question, options = {}) {
    const {
        maxChunks = MAX_CONTEXT_CHUNKS,
        maxContextLength = MAX_CONTEXT_LENGTH,
        minSimilarity = 0.25,
        includeSourceInfo = true
    } = options;
    
    try {
        // Check if model is loaded
        const modelStatus = await AIModelService.getModelStatus();
        if (!modelStatus.isModelLoaded) {
            return {
                success: false,
                error: 'No AI model loaded. Please load a model in AI Settings first.',
                answer: null,
                sources: []
            };
        }
        
        // Check if we have indexed articles
        const vectorStatus = await VectorService.getVectorStatus();
        if (vectorStatus.indexedArticles === 0) {
            return {
                success: false,
                error: 'No articles indexed. Please rebuild the index in AI Settings.',
                answer: null,
                sources: []
            };
        }
        
        log.info('Processing question:', question);
        
        // Find relevant chunks
        const relevantChunks = await VectorService.searchRelevantChunks(question, maxChunks * 2);
        
        // Filter by minimum similarity
        const filteredChunks = relevantChunks.filter(c => c.similarity >= minSimilarity);
        
        if (filteredChunks.length === 0) {
            return {
                success: true,
                answer: "I couldn't find any relevant information in your articles to answer this question.",
                sources: [],
                noContext: true
            };
        }
        
        // Build context from chunks, respecting length limit
        let context = '';
        const usedChunks = [];
        const usedArticleIds = new Set();
        
        for (const chunk of filteredChunks) {
            if (usedChunks.length >= maxChunks) break;
            if (context.length + chunk.chunkText.length > maxContextLength) continue;
            
            context += chunk.chunkText + '\n\n';
            usedChunks.push(chunk);
            usedArticleIds.add(chunk.articleId);
        }
        
        // Get article information for sources
        const { default: ArticleService } = await import('../ArticleService.js');
        const sources = [];
        
        for (const articleId of usedArticleIds) {
            try {
                const article = await ArticleService.getArticleById(articleId);
                if (article && !article.error) {
                    sources.push({
                        articleId: article.id,
                        title: article.title,
                        date: article.date
                    });
                }
            } catch (e) {
                // Skip failed article lookups
            }
        }
        
        // Build the prompt
        const systemPrompt = buildSystemPrompt();
        const userPrompt = buildUserPrompt(question, context);
        
        log.info(`Generating answer with ${usedChunks.length} context chunks from ${sources.length} articles`);
        
        // Generate response
        const response = await AIModelService.generateResponse(userPrompt, systemPrompt);
        
        if (!response.success) {
            return {
                success: false,
                error: response.error,
                answer: null,
                sources: []
            };
        }
        
        // Clean up the response
        const answer = cleanResponse(response.response);
        
        return {
            success: true,
            answer,
            sources: includeSourceInfo ? sources : [],
            chunksUsed: usedChunks.length,
            question
        };
    } catch (error) {
        log.error('Question answering failed:', error);
        return {
            success: false,
            error: error.message,
            answer: null,
            sources: []
        };
    }
}

/**
 * Build the system prompt for the LLM
 */
function buildSystemPrompt() {
    return `You are a helpful assistant that answers questions based ONLY on the provided context from the user's personal notes and articles. 

Important instructions:
- Answer ONLY based on the information in the provided context
- If the context doesn't contain enough information to answer the question, say so clearly
- Be concise and direct in your answers
- If you quote from the context, indicate that you are doing so
- Do not make up information or use external knowledge
- Keep your response focused on the question asked`;
}

/**
 * Build the user prompt with context
 */
function buildUserPrompt(question, context) {
    return `Based on the following excerpts from my notes and articles, please answer my question.

CONTEXT FROM MY NOTES:
---
${context.trim()}
---

QUESTION: ${question}

Please provide a helpful answer based only on the context above.`;
}

/**
 * Clean up the LLM response
 */
function cleanResponse(response) {
    if (!response) return '';
    
    // Remove common artifacts
    let cleaned = response
        .replace(/^(Assistant:|AI:|Answer:|Response:)\s*/i, '')
        .replace(/^\n+/, '')
        .replace(/\n+$/, '')
        .trim();
    
    return cleaned;
}

/**
 * Get RAG service status
 */
async function getRAGStatus() {
    try {
        const modelStatus = await AIModelService.getModelStatus();
        const vectorStatus = await VectorService.getVectorStatus();
        
        const isReady = modelStatus.isModelLoaded && vectorStatus.indexedArticles > 0;
        
        return {
            isReady,
            modelLoaded: modelStatus.isModelLoaded,
            modelLoading: modelStatus.isModelLoading,
            loadedModelName: modelStatus.loadedModelName,
            indexedArticles: vectorStatus.indexedArticles,
            embeddingModelLoaded: vectorStatus.embeddingModelLoaded,
            issues: getStatusIssues(modelStatus, vectorStatus)
        };
    } catch (error) {
        log.error('Failed to get RAG status:', error);
        return {
            isReady: false,
            modelLoaded: false,
            indexedArticles: 0,
            error: error.message,
            issues: ['Failed to check status']
        };
    }
}

/**
 * Get list of issues preventing RAG from working
 */
function getStatusIssues(modelStatus, vectorStatus) {
    const issues = [];
    
    if (!modelStatus.isModelLoaded) {
        issues.push('No AI model loaded');
    }
    
    if (vectorStatus.indexedArticles === 0) {
        issues.push('No articles indexed');
    }
    
    return issues;
}

const RAGService = {
    initService,
    askQuestion,
    getRAGStatus
};

export default RAGService;
