/**
 * Normalizes a string to be safe as a filename on both Windows and macOS.
 * Replaces or removes invalid characters: \\ / : * ? " < > |
 * Trims leading/trailing spaces and dots. Returns fallback if result is empty.
 * @param {string} name - Raw name (e.g. article title or document title)
 * @param {string} fallback - Value to return if name is empty after normalization
 * @returns {string} Safe filename (no extension)
 */
export function normalizeFilename(name, fallback = 'document') {
    if (name == null || typeof name !== 'string') return fallback;
    // Windows: \ / : * ? " < > |  ;  macOS: / : (and NUL)
    const invalid = /[\\/:*?"<>|\x00-\x1f]+/g;
    let normalized = name.trim().replace(invalid, ' ').replace(/\s+/g, ' ').trim();
    // Remove leading/trailing dots and spaces (e.g. ". " or " .")
    normalized = normalized.replace(/^[\s.]*|[\s.]*$/g, '');
    return normalized.length ? normalized : fallback;
}

// Helper function to ensure proper UTF-8 encoding
export const ensureUTF8 = (text) => {
    if (!text) return '';
    // Ensure the text is properly encoded as UTF-8
    try {
        // Convert to Buffer and back to ensure proper encoding
        return Buffer.from(text, 'utf8').toString('utf8');
    } catch (error) {
        console.warn('Error encoding text to UTF-8:', error);
        return text;
    }
};

// Helper function to determine which entities are needed based on export options
export function getEntityResolutionOptions(options) {
    return {
        includeAnnotations: options.notes || false,
        includeTags: options.tags || false,
        includeCollections: options.collections || false,
        includeRelatedArticles: options.relatedArticles || false,
        includeCategory: true, // Always include category for article info
        includeOwner: true // Always include owner for article info
    };
}

// Helper function to build article info parts for display
export function buildArticleInfoParts(article, category, owner, translations) {
    const articleInfoParts = [];
    
    if (owner) {
        articleInfoParts.push(owner.name);
    }
    if (category) {
        articleInfoParts.push(category.name);
    }
    if (!article.isDateUncertain && article.date) {
        articleInfoParts.push(new Date(article.date).toLocaleDateString('tr'));
        articleInfoParts.push(`(${article.number})`);
        
        // Day of week (translated)
        const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayKey = weekdays[new Date(article.date).getDay()];
        const dayOfWeek = translations?.[dayKey] || dayKey;
        articleInfoParts.push(dayOfWeek);
        
        if (article.date2) {
            articleInfoParts.push(new Date(article.date2).toLocaleDateString('tr'));
            articleInfoParts.push(`(${article.number2})`);
        }
    }
    
    // Read time if available
    if (article.field1 && article.field1.trim() !== '') {
        const readTime = parseInt(article.field1, 10);
        if (!isNaN(readTime) && readTime > 0) {
            articleInfoParts.push(`${readTime} ${readTime === 1 ? (translations?.minRead || 'min read') : (translations?.minsRead || 'mins read')}`);
        }
    }
    
    return articleInfoParts;
}
