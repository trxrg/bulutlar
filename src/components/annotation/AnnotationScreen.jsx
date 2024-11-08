import React, { useContext, useState } from 'react';
import { DBContext } from '../../store/db-context';
import { AppContext } from '../../store/app-context';
import AnnotationModal from './AnnotationModal';

const AnnotationScreen = () => {
    const [annotationModalOpen, setAnnotationModalOpen] = useState(false);
    const [annotationForModal, setAnnotationForModal] = useState(null);
    const { allAnnotations, getArticleById } = useContext(DBContext);
    const { translate: t } = useContext(AppContext);

    const handleOpenArticle = (article) => {
        console.log('not implemented');
    }

    const handleNoteClicked = (annotation) => {
        setAnnotationModalOpen(true);
        setAnnotationForModal(annotation);
    }

    return (
        <div className="container flex flex-col h-full mx-auto p-4">
            <div className='flex-1 overflow-y-auto'>
                <table className="min-w-full bg-white">
                    <thead>
                        <tr>
                            <th className="py-2 px-4 border-b">{t('note')}</th>
                            <th className="py-2 px-4 border-b">{t('quote')}</th>
                            <th className="py-2 px-4 border-b">{t('article')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {allAnnotations.map(annotation => {
                            const article = getArticleById(annotation.articleId);

                            return (<tr key={annotation.id}>
                                <td className='border-b'>
                                    <div className='border hover:underline cursor-pointer' onClick={() => handleNoteClicked(annotation)} style={{ whiteSpace: 'pre-line' }}>
                                        {annotation.note}
                                    </div>
                                </td>
                                <td className='border-b'>
                                    <h2>{annotation.quote}</h2>
                                </td>
                                <td className='border-b'>
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
            </div>
            <AnnotationModal isOpen={annotationModalOpen} onRequestClose={() => setAnnotationModalOpen(false)} annotation={annotationForModal} articleId={annotationForModal?.articleId} />
        </div>
    );
};

export default AnnotationScreen;