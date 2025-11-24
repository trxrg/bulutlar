import React, { useContext, useState } from 'react';
import { DBContext } from '../../store/db-context';
import { AppContext } from '../../store/app-context';
import { normalizeText } from '../../utils/textUtils.js';
import AnnotationModal from './AnnotationModal';
import PickAndViewArticleModal from '../article/modals/PickAndViewArticleModal';

const AnnotationScreen = () => {

    const [filterTerm, setFilterTerm] = useState('');

    const [annotationModalOpen, setAnnotationModalOpen] = useState(false);
    const [annotationForModal, setAnnotationForModal] = useState(null);
    
    const [articleModalOpen, setArticleModalOpen] = useState(false);
    const [viewedArticleId, setViewedArticleId] = useState(null);
    
    const { allAnnotations, getArticleById } = useContext(DBContext);
    const { translate: t } = useContext(AppContext);

    const [sortOrder, setSortOrder] = useState('asc');
    const [sortBy, setSortBy] = useState('title');

    const handleOpenArticle = (article) => {
        setViewedArticleId(article.id);
        setArticleModalOpen(true);
    }

    const handleNoteClicked = (annotation) => {
        setAnnotationModalOpen(true);
        setAnnotationForModal(annotation);
    }

    const handleSort = (criteria) => {
        setSortBy(criteria);
        setSortOrder((prevOrder) => (prevOrder === 'asc' ? 'desc' : 'asc'));
    };

    const filteredAnnotations = React.useMemo(() => {
        return allAnnotations.filter(ann => ann.note && ann.note.length > 0).filter(annotation => normalizeText(annotation.note).includes(normalizeText(filterTerm)));
    }, [allAnnotations, filterTerm]);

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
            } else if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
                const dateA = new Date(a[sortBy]);
                const dateB = new Date(b[sortBy]);
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
                    placeholder={t('filter notes')}
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
                        <th className="py-2 px-4" style={{ borderBottom: '1px solid var(--border-secondary)', color: 'var(--text-primary)' }}>{t('note')}</th>
                        <th className="py-2 px-4 cursor-pointer" style={{ borderBottom: '1px solid var(--border-secondary)', color: 'var(--text-primary)' }} onClick={() => handleSort('title')}>
                            {t('article')} {getSortIndicator('title')}
                        </th>
                        <th className="py-2 px-4 cursor-pointer" style={{ borderBottom: '1px solid var(--border-secondary)', color: 'var(--text-primary)' }} onClick={() => handleSort('createdAt')}>
                            {t('created_at')} {getSortIndicator('createdAt')}
                        </th>
                        <th className="py-2 px-4 cursor-pointer" style={{ borderBottom: '1px solid var(--border-secondary)', color: 'var(--text-primary)' }} onClick={() => handleSort('updatedAt')}>
                            {t('updated_at')} {getSortIndicator('updatedAt')}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {sortedAnnotations.map((annotation, index) => {
                        const article = getArticleById(annotation.articleId);

                        return (<tr key={annotation.id}>
                            <td className='text-center' style={{ borderBottom: '1px solid var(--border-secondary)', color: 'var(--text-primary)' }}>
                                <h2>{index + 1}</h2>
                            </td>
                            <td style={{ borderBottom: '1px solid var(--border-secondary)' }}>
                                <div className='rounded-md p-1 m-2 hover:underline cursor-pointer' style={{ 
                                    whiteSpace: 'pre-line',
                                    border: '2px solid var(--border-secondary)',
                                    backgroundColor: 'var(--bg-secondary)',
                                    color: 'var(--text-primary)'
                                }} onClick={() => handleNoteClicked(annotation)}>
                                    {annotation.note}
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
                            <td className='text-center' style={{ borderBottom: '1px solid var(--border-secondary)' }}>
                                <h2 style={{ color: 'var(--text-primary)' }}>{new Date(annotation.updatedAt).toLocaleDateString(t('locale'))}</h2>
                            </td>
                        </tr>
                        )
                    })}
                </tbody>
            </table>
            <AnnotationModal isOpen={annotationModalOpen} onRequestClose={() => setAnnotationModalOpen(false)} annotationId={annotationForModal?.id} articleId={annotationForModal?.articleId} />
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

export default AnnotationScreen;