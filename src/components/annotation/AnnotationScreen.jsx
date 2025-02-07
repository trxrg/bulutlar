import React, { useContext, useState } from 'react';
import { DBContext } from '../../store/db-context';
import { AppContext } from '../../store/app-context';
import AnnotationModal from './AnnotationModal';

const AnnotationScreen = () => {

    const [filterTerm, setFilterTerm] = useState('');

    const [annotationModalOpen, setAnnotationModalOpen] = useState(false);
    const [annotationForModal, setAnnotationForModal] = useState(null);
    const { allAnnotations, getArticleById } = useContext(DBContext);
    const { translate: t, handleAddTab, setActiveScreen } = useContext(AppContext);

    const handleOpenArticle = (article) => {
        handleAddTab(null, article.id);
        setActiveScreen('tabs');
    }

    const handleNoteClicked = (annotation) => {
        setAnnotationModalOpen(true);
        setAnnotationForModal(annotation);
    }

    const filteredAnnotations = React.useMemo(() => {
        return allAnnotations.filter(annotation => normalizeText(annotation.note).includes(normalizeText(filterTerm)));
    }, [allAnnotations, filterTerm]);

    function normalizeText(text) {
        if (!text) return '';
        if (typeof text !== 'string') return text;
        const turkishMap = { 
            'ç': 'c', 'Ç': 'C', 
            'ğ': 'g', 'Ğ': 'G', 
            'ı': 'i', 'İ': 'I', 
            'ö': 'o', 'Ö': 'O', 
            'ş': 's', 'Ş': 'S', 
            'ü': 'u', 'Ü': 'U' 
        };
        const result = text.split('').map(char => turkishMap[char] || char).join('').toLowerCase();
        return result;
    };

    return (
        <div className="container h-full overflow-y-auto mx-auto p-4">
            <div className="mb-2">
                <input
                    type="text"
                    placeholder={t('filter notes')}
                    value={filterTerm}
                    onChange={(e) => setFilterTerm(e.target.value)}
                    className="border p-2 rounded w-full"
                />
            </div>
            <table className="min-w-full bg-white">
                <thead>
                    <tr>
                        <th className="py-2 px-4 border-b"></th>
                        <th className="py-2 px-4 border-b">{t('note')}</th>
                        {/* <th className="py-2 px-4 border-b">{t('quote')}</th> */}
                        <th className="py-2 px-4 border-b">{t('article')}</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredAnnotations.map((annotation, index) => {
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
                            {/* <td className='border-b text-center'>
                                    <h2>{annotation.quote}</h2>
                                </td> */}
                            <td className='border-b text-center'>
                                {article ? (
                                    <h2 className='cursor-pointer hover:underline' onClick={() => handleOpenArticle(article)}>{article.title}</h2>
                                ) : (
                                    <h2>{t('article_not_found')}</h2>
                                )}
                            </td>
                        </tr>
                        )
                    })}
                </tbody>
            </table>
            <AnnotationModal isOpen={annotationModalOpen} onRequestClose={() => setAnnotationModalOpen(false)} annotation={annotationForModal} articleId={annotationForModal?.articleId} />
        </div>
    );
};

export default AnnotationScreen;