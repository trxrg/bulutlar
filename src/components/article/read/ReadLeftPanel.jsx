import React, { useContext, useState, useEffect } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import BodyWithFixedHeader from '../../common/BodyWithFixedHeader';
import FormatButton from '../../common/FormatButton';
import { AppContext } from '../../../store/app-context';
import { DBContext } from '../../../store/db-context';
import { ReadContext } from '../../../store/read-context';
import AnnotationCard from '../../annotation/AnnotationCard';

const ReadLeftPanel = () => {

    const { translate: t, setActiveScreen } = useContext(AppContext);
    const { getAnnotationById, allAnnotations } = useContext(DBContext);
    const { article, setAnnotationModalOpen, setAnnotationIdForModal } = useContext(ReadContext);
    const [filteredAnnotations, setFilteredAnnotations] = useState([]);

    const handleAnnotationCardClick = (annotation) => {
        setAnnotationIdForModal(annotation.id);
        setAnnotationModalOpen(true);
    }

    const handleAddAnnotation = () => {
        setAnnotationIdForModal(null);
        setAnnotationModalOpen(true);
    }

    const handleNotesClick = () => {
        setActiveScreen('annotations');
    }

    useEffect(() => {
        setFilteredAnnotations(allAnnotations.filter(ann => {const annotation=getAnnotationById(ann.id); return annotation.note && annotation.note.length > 0}));
    }, [allAnnotations]);

    return (
        <div className='h-full'>
            <BodyWithFixedHeader >
                <div className='flex flex-wrap justify-between p-2 shadow-lg bg-white'>
                    <h2 className='ml-2 text-xl font-semibold text-gray-800 hover:underline cursor-pointer' onClick={handleNotesClick}>{t('notes')}</h2>
                    <FormatButton onClick={handleAddAnnotation}><PlusIcon className="w-5 h-5" /></FormatButton>
                </div>
                {article.annotations && filteredAnnotations.length > 0?
                    <div className='flex flex-col gap-2 p-2'>
                    {filteredAnnotations.map((ann) => <AnnotationCard key={ann.id}  annotation={getAnnotationById(ann.id)} onClick={handleAnnotationCardClick}/>)}
                </div> :
                <div className='flex justify-center p-2 h-full'>
                    <p>{t('no notes')}</p>
                </div>}
            </BodyWithFixedHeader>
        </div>
    );
};

export default ReadLeftPanel;