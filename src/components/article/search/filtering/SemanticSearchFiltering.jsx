import React, { useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppContext } from '../../../../store/app-context';
import { DBContext } from '../../../../store/db-context';
import { aiSearchApi, aiVectorApi } from '../../../../backend-adapter/BackendAdapter';
import FormatButton from '../../../common/FormatButton';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import { MagnifyingGlassIcon } from '@heroicons/react/24/solid';

const SemanticSearchFiltering = () => {
    const { t } = useTranslation();
    const { openArticleInNewTab } = useContext(AppContext);
    const { getCategoryById } = useContext(DBContext);

    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState(null);
    const [hasSearched, setHasSearched] = useState(false);

    const handleSearch = async () => {
        if (!query.trim()) return;

        setIsSearching(true);
        setError(null);
        setHasSearched(true);

        try {
            const response = await aiSearchApi.semantic(query, { limit: 10, minSimilarity: 0.3 });
            
            if (response.success) {
                setResults(response.results || []);
                if (response.message) {
                    setError(response.message);
                }
            } else {
                setError(response.error || t('ai.searchFailed'));
                setResults([]);
            }
        } catch (err) {
            console.error('Semantic search error:', err);
            setError(t('ai.searchFailed'));
            setResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const handleArticleClick = (articleId) => {
        openArticleInNewTab(articleId);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString();
    };

    const clearResults = () => {
        setQuery('');
        setResults([]);
        setHasSearched(false);
        setError(null);
    };

    return (
        <div className='p-1 flex flex-col overflow-auto max-h-96' style={{ color: 'var(--text-primary)' }}>
            {/* Search Input */}
            <div className="flex flex-wrap mb-3">
                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className='flex-1 p-2 rounded'
                    style={{
                        border: '1px solid var(--border-secondary)',
                        backgroundColor: 'var(--bg-primary)',
                        color: 'var(--text-primary)'
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder={t('ai.enterSemanticQuery')}
                    disabled={isSearching}
                />
                <div className='flex flex-shrink-0 ml-1'>
                    <FormatButton onClick={handleSearch} disabled={isSearching || !query.trim()}>
                        {isSearching ? (
                            <CircularProgress size={20} sx={{ color: 'var(--text-primary)' }} />
                        ) : (
                            <MagnifyingGlassIcon className="w-5 h-5" />
                        )}
                    </FormatButton>
                </div>
            </div>

            {/* Description */}
            <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
                {t('ai.semanticSearchDescription')}
            </p>

            {/* Error/Info Message */}
            {error && (
                <Alert severity="info" sx={{ mb: 2, fontSize: '0.875rem' }}>
                    {error}
                </Alert>
            )}

            {/* Results */}
            {hasSearched && !isSearching && results.length === 0 && !error && (
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {t('no results found')}
                </p>
            )}

            {results.length > 0 && (
                <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                            {t('ai.resultsFound', { count: results.length })}
                        </span>
                        <button
                            onClick={clearResults}
                            className="text-sm underline cursor-pointer"
                            style={{ color: 'var(--text-secondary)' }}
                        >
                            {t('ai.clearResults')}
                        </button>
                    </div>
                    
                    <ul className="flex flex-col gap-1">
                        {results.map((result, index) => {
                            const category = getCategoryById(result.categoryId);
                            
                            return (
                                <li 
                                    key={result.articleId}
                                    onClick={() => handleArticleClick(result.articleId)}
                                    className="p-2 rounded cursor-pointer hover:opacity-80 transition-opacity"
                                    style={{ 
                                        backgroundColor: 'var(--bg-tertiary)',
                                        borderLeft: category?.color ? `4px solid ${category.color}` : '4px solid var(--border-secondary)'
                                    }}
                                >
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                                                {result.title || t('untitled')}
                                            </h4>
                                            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                                {formatDate(result.date)}
                                            </p>
                                        </div>
                                        <div 
                                            className="flex-shrink-0 px-2 py-1 rounded text-xs font-medium"
                                            style={{ 
                                                backgroundColor: result.similarityPercent >= 70 ? 'var(--success-bg)' : 
                                                               result.similarityPercent >= 50 ? 'var(--warning-bg)' : 'var(--bg-secondary)',
                                                color: result.similarityPercent >= 70 ? 'var(--success-text)' : 
                                                       result.similarityPercent >= 50 ? 'var(--warning-text)' : 'var(--text-secondary)'
                                            }}
                                        >
                                            {result.similarityPercent}%
                                        </div>
                                    </div>
                                    {result.matchedChunk && (
                                        <p 
                                            className="text-xs mt-1 line-clamp-2"
                                            style={{ color: 'var(--text-secondary)' }}
                                        >
                                            "...{result.matchedChunk.substring(0, 150)}..."
                                        </p>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default SemanticSearchFiltering;
