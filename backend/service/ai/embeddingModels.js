/**
 * Available Embedding Models for Semantic Search
 * 
 * Different models produce different dimension vectors.
 * Vectors from different models cannot be mixed - must regenerate all when switching.
 * Models auto-download on first use via @xenova/transformers.
 */

export const AVAILABLE_EMBEDDING_MODELS = [
    {
        id: "all-MiniLM-L6-v2",
        name: "English Only (Fast)",
        description: "Best for English content. Smallest and fastest.",
        languages: ["English"],
        size: "80 MB",
        dimensions: 384,
        model: "Xenova/all-MiniLM-L6-v2"
    },
    {
        id: "multilingual-e5-small",
        name: "Multilingual (Recommended)",
        description: "Good quality for Turkish, English, and 100+ languages.",
        languages: ["Turkish", "English", "100+ more"],
        size: "120 MB",
        dimensions: 384,
        model: "Xenova/multilingual-e5-small"
    },
    {
        id: "bge-m3",
        name: "Multilingual (Best Quality)",
        description: "Highest quality multilingual embeddings. Larger size.",
        languages: ["Turkish", "English", "100+ more"],
        size: "570 MB",
        dimensions: 1024,
        model: "Xenova/bge-m3"
    }
];

export const DEFAULT_EMBEDDING_MODEL_ID = "multilingual-e5-small";

/**
 * Get embedding model configuration by ID
 * @param {string} modelId - The model ID
 * @returns {object|null} - The model configuration or null if not found
 */
export function getEmbeddingModelById(modelId) {
    return AVAILABLE_EMBEDDING_MODELS.find(m => m.id === modelId) || null;
}

/**
 * Get the default embedding model configuration
 * @returns {object} - The default model configuration
 */
export function getDefaultEmbeddingModel() {
    return getEmbeddingModelById(DEFAULT_EMBEDDING_MODEL_ID);
}
