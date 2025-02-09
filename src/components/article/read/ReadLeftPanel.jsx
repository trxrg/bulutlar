import React, { useState, useContext } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import BodyWithFixedHeader from '../../common/BodyWithFixedHeader';
import FormatButton from '../../common/FormatButton';
import AnnotationModal from '../../annotation/AnnotationModal';
import { AppContext } from '../../../store/app-context';
import { DBContext } from '../../../store/db-context';
import { ReadContext } from '../../../store/read-context';
import AnnotationCard from '../../annotation/AnnotationCard';

const ReadLeftPanel = () => {

    const [isAnnotationModalOpen, setAnnotationModalOpen] = useState(false);
    const [annotationForModal, setAnnotationForModal] = useState(null);
    const { translate: t, setActiveScreen } = useContext(AppContext);
    const { getAnnotationById } = useContext(DBContext);
    const { article } = useContext(ReadContext);

    const handleAnnotationCardClick = (annotation) => {
        setAnnotationForModal(annotation);
        setAnnotationModalOpen(true);
    }

    const handleAddAnnotation = () => {
        setAnnotationForModal(null);
        setAnnotationModalOpen(true);
    }

    const handleNotesClick = () => {
        setActiveScreen('annotations');
    }

    return (
        <div className='h-full'>
            <BodyWithFixedHeader >
                <div className='flex flex-wrap justify-between p-2 shadow-lg bg-white'>
                    <h2 className='ml-2 text-xl font-semibold text-gray-800 hover:underline cursor-pointer' onClick={handleNotesClick}>{t('notes')}</h2>
                    <FormatButton onClick={handleAddAnnotation}><PlusIcon className="w-4 h-4" /></FormatButton>
                </div>
                {article.annotations && article.annotations.length > 0?
                    <div className='flex flex-col gap-2 p-2'>
                    {article.annotations.map((ann) => <AnnotationCard key={ann.id}  annotation={getAnnotationById(ann.id)} onClick={handleAnnotationCardClick}/>)}
                </div> :
                <div className='flex justify-center p-2 h-full'>
                    <p>{t('no notes')}</p>
                </div>}
            </BodyWithFixedHeader>
            <AnnotationModal isOpen={isAnnotationModalOpen} onRequestClose={() => setAnnotationModalOpen(false)} annotation={annotationForModal} articleId={article.id}/>
        </div>
    );
};

export default ReadLeftPanel;