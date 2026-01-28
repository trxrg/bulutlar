import VectorService from './VectorService.js';
import AIModelService from './AIModelService.js';
import SemanticSearchService from './SemanticSearchService.js';
import RAGService from './RAGService.js';

/**
 * Initialize all AI services
 */
function initAIServices() {
    VectorService.initService();
    AIModelService.initService();
    SemanticSearchService.initService();
    RAGService.initService();
    
    console.info('All AI services initialized');
}

export {
    initAIServices,
    VectorService,
    AIModelService,
    SemanticSearchService,
    RAGService
};
