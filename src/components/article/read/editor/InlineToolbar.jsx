import React, { useContext } from 'react';
import { BoldIcon, ItalicIcon, UnderlineIcon, LinkIcon,
     ArrowUpIcon, ArrowDownIcon, BookmarkIcon  } from '@heroicons/react/24/outline';
import FormatButton from '../../../common/FormatButton';
import { ReadContext } from '../../../../store/read-context';
import { AppContext } from '../../../../store/app-context';

const InlineToolbar = () => {

    const { toggleStyle, setAddLinkModalOpen, addQuote } = useContext(ReadContext);
    const { translate: t } = useContext(AppContext);

    const handleToggleStyle = (event, style) => {
        event.preventDefault();
        toggleStyle(style);
    }

    const handleAddQuote = (e) => {
        e.preventDefault();
        addQuote();
    }


    return (
        <>
            <div className='flex flex-wrap gap-1 p-2'>
                <FormatButton onMouseDown={(e) => handleToggleStyle(e, 'BOLD')}><BoldIcon className='w-4 h-4' /></FormatButton>
                <FormatButton onMouseDown={(e) => handleToggleStyle(e, 'HIGHLIGHT')} title={t('highlight')}><span className='w-4 h-4' style={{ backgroundColor: 'var(--highlight-bg)' }}></span></FormatButton>
                <FormatButton onMouseDown={(e) => handleToggleStyle(e, 'HIGHLIGHT_GREEN')} title={t('highlight green')}><span className='w-4 h-4' style={{ backgroundColor: 'var(--highlight-green-bg)' }}></span></FormatButton>
                <FormatButton onMouseDown={(e) => handleToggleStyle(e, 'HIGHLIGHT_BLUE')} title={t('highlight blue')}><span className='w-4 h-4' style={{ backgroundColor: 'var(--highlight-blue-bg)' }}></span></FormatButton>
                <FormatButton onMouseDown={(e) => handleToggleStyle(e, 'HIGHLIGHT_PINK')} title={t('highlight pink')}><span className='w-4 h-4' style={{ backgroundColor: 'var(--highlight-pink-bg)' }}></span></FormatButton>
                <FormatButton onClick={(e) => setAddLinkModalOpen(true)} title={t('add link')}><LinkIcon className="w-6 h-6" /></FormatButton>
                <FormatButton onMouseDown={handleAddQuote} title={t('add quote')}><BookmarkIcon className="w-6 h-6" /></FormatButton>
                <FormatButton onMouseDown={(e) => handleToggleStyle(e, 'ITALIC')}><ItalicIcon className='w-4 h-4' /></FormatButton>
                <FormatButton onMouseDown={(e) => handleToggleStyle(e, 'UNDERLINE')}><UnderlineIcon className='w-4 h-4' /></FormatButton>
                <FormatButton onMouseDown={(e) => handleToggleStyle(e, 'SUPERSCRIPT')} title={t('superscript')}><ArrowUpIcon className='w-4 h-4' /></FormatButton>
                <FormatButton onMouseDown={(e) => handleToggleStyle(e, 'SUBSCRIPT')} title={t('subscript')}><ArrowDownIcon className='w-4 h-4' /></FormatButton>
            </div>           
        </>
    );
};

export default InlineToolbar;