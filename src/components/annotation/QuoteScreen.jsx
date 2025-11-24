import React, { useContext, useState } from 'react';
import { DBContext } from '../../store/db-context';
import { AppContext } from '../../store/app-context';
import { normalizeText } from '../../utils/textUtils.js';
import ActionButton from '../common/ActionButton';
import { annotationApi } from '../../backend-adapter/BackendAdapter';
import PickAndViewArticleModal from '../article/modals/PickAndViewArticleModal';

const QuoteScreen = () => {

    const [filterTerm, setFilterTerm] = useState('');
    const [sortOrder, setSortOrder] = useState('asc');
    const [sortBy, setSortBy] = useState('title');
    
    const [articleModalOpen, setArticleModalOpen] = useState(false);
    const [viewedArticleId, setViewedArticleId] = useState(null);

    const { allAnnotations, getArticleById, fetchAllAnnotations, fetchArticleById } = useContext(DBContext);
    const { translate: t } = useContext(AppContext);

    const handleOpenArticle = (article) => {
        setViewedArticleId(article.id);
        setArticleModalOpen(true);
    }

    const filteredAnnotations = React.useMemo(() => {
        return allAnnotations.filter(ann => ann.quote && ann.quote.length > 0).filter(annotation => normalizeText(annotation.quote).includes(normalizeText(filterTerm)));
    }, [allAnnotations, filterTerm]);

    const handleSort = (criteria) => {
        setSortBy(criteria);
        setSortOrder((prevOrder) => (prevOrder === 'asc' ? 'desc' : 'asc'));
    };

    const sortedAnnotations = React.useMemo(() => {
        const sorted = [...filteredAnnotations].sort((a, b) => {
            if (sortBy === 'title') {
                const articleA = getArticleById(a.articleId);
                const articleB = getArticleById(b.articleId);
                if (!articleA || !articleB) return 0;

                if (normalizeText(articleA.title) < normalizeText(articleB.title)) {
                    return sortOrder === 'asc' ? -1 : 1;
                }
                if (normalizeText(articleA.title) > normalizeText(articleB.title)) {
                    return sortOrder === 'asc' ? 1 : -1;
                }
            } else if (sortBy === 'date') {
                const dateA = new Date(a.createdAt);
                const dateB = new Date(b.createdAt);
                if (dateA < dateB) {
                    return sortOrder === 'asc' ? -1 : 1;
                }
                if (dateA > dateB) {
                    return sortOrder === 'asc' ? 1 : -1;
                }
            }
            return 0;
        });
        return sorted;
    }, [filteredAnnotations, sortOrder, sortBy, getArticleById]);

    const handleDeleteAnnotation = async (annotation) => {
        await annotationApi.deleteById(annotation.id);
        await fetchArticleById(annotation.articleId);
        fetchAllAnnotations();
    }

    const getSortIndicator = (key) => {
        if (sortBy === key) {
            return sortOrder === 'asc' ? ' ▲' : ' ▼';
        }
        return '';
    };

    return (
        <div className="container h-full overflow-y-auto mx-auto p-4" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
            <div className="mb-2">
                <input
                    type="text"
                    placeholder={t('filter quotes')}
                    value={filterTerm}
                    onChange={(e) => setFilterTerm(e.target.value)}
                    className="p-2 rounded w-full"
                    style={{
                        border: '1px solid var(--border-secondary)',
                        backgroundColor: 'var(--bg-primary)',
                        color: 'var(--text-primary)'
                    }}
                />
            </div>
            <table className="min-w-full" style={{ backgroundColor: 'var(--bg-primary)' }}>
                <thead>
                    <tr>
                        <th className="py-2 px-4" style={{ borderBottom: '1px solid var(--border-secondary)', color: 'var(--text-primary)' }}></th>
                        <th className="py-2 px-4" style={{ borderBottom: '1px solid var(--border-secondary)', color: 'var(--text-primary)' }}>{t('quote')}</th>
                        <th className="py-2 px-4 cursor-pointer" style={{ borderBottom: '1px solid var(--border-secondary)', color: 'var(--text-primary)' }} onClick={() => handleSort('title')}>
                            {t('article')} {getSortIndicator('title')}
                        </th>
                        <th className="py-2 px-4 cursor-pointer" style={{ borderBottom: '1px solid var(--border-secondary)', color: 'var(--text-primary)' }} onClick={() => handleSort('date')}>
                            {t('date')} {getSortIndicator('date')}
                        </th>
                        <th className="py-2 px-4" style={{ borderBottom: '1px solid var(--border-secondary)', color: 'var(--text-primary)' }}></th>
                    </tr>
                </thead>
                <tbody>
                    {sortedAnnotations.map((annotation, index) => {
                        const article = getArticleById(annotation.articleId);

                        return (<tr key={annotation.id} className="group table-row-hover">
                            <td className='text-center' style={{ borderBottom: '1px solid var(--border-secondary)', color: 'var(--text-primary)' }}>
                                <h2>{index + 1}</h2>
                            </td>
                            <td style={{ borderBottom: '1px solid var(--border-secondary)' }}>
                                <div className='rounded-md p-1 m-2' style={{ 
                                    whiteSpace: 'pre-line',
                                    border: '2px solid var(--border-secondary)',
                                    backgroundColor: 'var(--bg-secondary)',
                                    color: 'var(--text-primary)'
                                }}>
                                    {annotation.quote}
                                </div>
                            </td>
                            <td className='text-center' style={{ borderBottom: '1px solid var(--border-secondary)' }}>
                                {article ? (
                                    <h2 className='cursor-pointer hover:underline' style={{ color: 'var(--text-primary)' }} onClick={() => handleOpenArticle(article)}>{article.title}</h2>
                                ) : (
                                    <h2 style={{ color: 'var(--text-primary)' }}>{t('article_not_found')}</h2>
                                )}
                            </td>
                            <td className='text-center' style={{ borderBottom: '1px solid var(--border-secondary)' }}>
                                <h2 style={{ color: 'var(--text-primary)' }}>{new Date(annotation.createdAt).toLocaleDateString(t('locale'))}</h2>
                            </td>
                            <td className="py-2 px-4 text-center" style={{ borderBottom: '1px solid var(--border-secondary)' }}>
                                <div className="flex justify-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <ActionButton color='red' onClick={() => handleDeleteAnnotation(annotation)}>{t('delete')}</ActionButton>
                                </div>
                            </td>
                        </tr>
                        )
                    })}
                </tbody>
            </table>
            <PickAndViewArticleModal 
                isOpen={articleModalOpen} 
                onRequestClose={() => setArticleModalOpen(false)} 
                articleId={null}
                title={t('article')}
                showSelect={false}
                initialArticleId={viewedArticleId}
            />
        </div>
    );
};

export default QuoteScreen;