import React, { useContext, useState } from 'react';
import { DBContext } from '../../store/db-context';
import { AppContext } from '../../store/app-context';
import AnnotationModal from './AnnotationModal';

const AnnotationScreen = () => {

    const [filterTerm, setFilterTerm] = useState('');

    const [annotationModalOpen, setAnnotationModalOpen] = useState(false);
    const [annotationForModal, setAnnotationForModal] = useState(null);
    const { allAnnotations, getArticleById } = useContext(DBContext);
    const { translate: t, handleAddTab, setActiveScreen, normalizeText } = useContext(AppContext);

    const [sortOrder, setSortOrder] = useState('asc');
    const [sortBy, setSortBy] = useState('title');

    const handleOpenArticle = (article) => {
        handleAddTab(null, article.id);
        setActiveScreen('tabs');
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
        <div className="container h-full overflow-y-auto mx-auto p-4">
            <div className="mb-2">
                <input
                    type="text"
                    placeholder={t('filter notes')}
                    value={filterTerm}
                    onChange={(e) => setFilterTerm(e.target.value)}
                    className="border border-black p-2 rounded w-full"
                />
            </div>
            <table className="min-w-full bg-white">
                <thead>
                    <tr>
                        <th className="py-2 px-4 border-b"></th>
                        <th className="py-2 px-4 border-b">{t('note')}</th>
                        <th className="py-2 px-4 border-b cursor-pointer" onClick={() => handleSort('title')}>
                            {t('article')} {getSortIndicator('title')}
                        </th>
                        <th className="py-2 px-4 border-b cursor-pointer" onClick={() => handleSort('createdAt')}>
                            {t('created_at')} {getSortIndicator('createdAt')}
                        </th>
                        <th className="py-2 px-4 border-b cursor-pointer" onClick={() => handleSort('updatedAt')}>
                            {t('updated_at')} {getSortIndicator('updatedAt')}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {sortedAnnotations.map((annotation, index) => {
                        const article = getArticleById(annotation.articleId);

                        return (<tr key={annotation.id}>
                            <td className='border-b text-center'>
                                <h2>{index + 1}</h2>
                            </td>
                            <td className='border-b'>
                                <div className='border border-2 rounded-md p-1 m-2 hover:underline cursor-pointer' onClick={() => handleNoteClicked(annotation)} style={{ whiteSpace: 'pre-line' }}>
                                    {annotation.note}
                                </div>
                            </td>
                            <td className='border-b text-center'>
                                {article ? (
                                    <h2 className='cursor-pointer hover:underline' onClick={() => handleOpenArticle(article)}>{article.title}</h2>
                                ) : (
                                    <h2>{t('article_not_found')}</h2>
                                )}
                            </td>
                            <td className='border-b text-center'>
                                <h2>{new Date(annotation.createdAt).toLocaleDateString(t('locale'))}</h2>
                            </td>
                            <td className='border-b text-center'>
                                <h2>{new Date(annotation.updatedAt).toLocaleDateString(t('locale'))}</h2>
                            </td>
                        </tr>
                        )
                    })}
                </tbody>
            </table>
            <AnnotationModal isOpen={annotationModalOpen} onRequestClose={() => setAnnotationModalOpen(false)} annotationId={annotationForModal?.id} articleId={annotationForModal?.articleId} />
        </div>
    );
};

export default AnnotationScreen;