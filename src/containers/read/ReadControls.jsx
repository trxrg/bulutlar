import React, { useState, useContext } from 'react';
import AddLinkModal from '../../components/AddLinkModal.jsx';
import { LinkIcon, PencilIcon } from '@heroicons/react/24/outline';
import { ReadContext } from '../../store/read-context.jsx';
import FormatButton from '../../components/FormatButton.jsx';

const ReadControls = () => {

    const { increaseFontSize, decreaseFontSize, toggleStyle } = useContext(ReadContext);

    const [isLinkModalOpen, setLinkModalOpen] = useState(false);

    const handleToggleStyle = (event, style) => {
        event.preventDefault();
        toggleStyle(style);
    }

    return (
        <div className='overflow-auto flex justify-between bg-stone-50'>
            <div className='p-2 select-none flex space-x-2'>
                <FormatButton onClick={decreaseFontSize}>A-</FormatButton>
                <FormatButton onClick={increaseFontSize}>A+</FormatButton>
                <FormatButton onClick={(e) => handleToggleStyle(e, 'BOLD')}><strong>B</strong></FormatButton>
                <FormatButton onClick={(e) => handleToggleStyle(e, 'UNDERLINE')}><u>U</u></FormatButton>
                <FormatButton onClick={(e) => handleToggleStyle(e, 'HIGHLIGHT')}><span className='bg-yellow-100'>H</span></FormatButton>
                <FormatButton onClick={() => setLinkModalOpen(true)}><LinkIcon className="w-5 h-5" /></FormatButton>
            </div>
            <FormatButton 
            // onClick={() => handleEditClicked(article)} 
            ><PencilIcon className="w-4 h-4" /></FormatButton>
            
            <AddLinkModal
                isOpen={isLinkModalOpen}
                onClose={() => setLinkModalOpen(false)}
            />
        </div>
    );
};

export default ReadControls;
