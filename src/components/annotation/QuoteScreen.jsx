import React, { useContext, useState } from 'react';
import { DBContext } from '../../store/db-context';
import { AppContext } from '../../store/app-context';
import ActionButton from '../common/ActionButton';
import { annotationApi } from '../../backend-adapter/BackendAdapter';

const QuoteScreen = () => {

    const [filterTerm, setFilterTerm] = useState('');

    const { allAnnotations, getArticleById, fetchAllAnnotations } = useContext(DBContext);
    const { translate: t, handleAddTab, setActiveScreen, normalizeText } = useContext(AppContext);

    const handleOpenArticle = (article) => {
        handleAddTab(null, article.id);
        setActiveScreen('tabs');
    }

    const filteredAnnotations = React.useMemo(() => {
        return allAnnotations.filter(ann => ann.quote && ann.quote.length > 0).filter(annotation => normalizeText(annotation.quote).includes(normalizeText(filterTerm)));
    }, [allAnnotations, filterTerm]);

    const handleDeleteAnnotation = async (id) => {
        await annotationApi.deleteById(id);
        fetchAllAnnotations();
    }

    return (
        <div className="container h-full overflow-y-auto mx-auto p-4">
            <div className="mb-2">
                <input
                    type="text"
                    placeholder={t('filter quotes')}
                    value={filterTerm}
                    onChange={(e) => setFilterTerm(e.target.value)}
                    className="border p-2 rounded w-full"
                />
            </div>
            <table className="min-w-full bg-white">
                <thead>
                    <tr>
                        <th className="py-2 px-4 border-b"></th>
                        <th className="py-2 px-4 border-b">{t('quote')}</th>
                        <th className="py-2 px-4 border-b">{t('article')}</th>
                        <th className="py-2 px-4 border-b"></th>
                    </tr>
                </thead>
                <tbody>
                    {filteredAnnotations.map((annotation, index) => {
                        const article = getArticleById(annotation.articleId);

                        return (<tr key={annotation.id} className="hover:bg-gray-100 group">
                            <td className='border-b text-center'>
                                <h2>{index + 1}</h2>
                            </td>
                            <td className='border-b'>
                                <div className='border border-2 rounded-md p-1 m-2' style={{ whiteSpace: 'pre-line' }}>
                                    {annotation.quote}
                                </div>
                            </td>
                            <td className='border-b text-center'>
                                {article ? (
                                    <h2 className='cursor-pointer hover:underline' onClick={() => handleOpenArticle(article)}>{article.title}</h2>
                                ) : (
                                    <h2>{t('article_not_found')}</h2>
                                )}
                            </td>
                            <td className="py-2 px-4 border-b text-center">
                                <div className="flex justify-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <ActionButton color='red' onClick={() => handleDeleteAnnotation(annotation.id)}>{t('delete')}</ActionButton>
                                </div>
                            </td>
                        </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default QuoteScreen;