import React, { useContext } from 'react';
import { BoldIcon, ItalicIcon, UnderlineIcon } from '@heroicons/react/24/outline';
import FormatButton from '../../../common/FormatButton';
import { ReadContext } from '../../../../store/read-context';

const InlineToolbar = () => {

    const { toggleStyle } = useContext(ReadContext);

    const handleToggleStyle = (event, style) => {
        event.preventDefault();
        toggleStyle(style);
    }

    return (
        <div className='flex flex-wrap gap-1 p-2'>
            <FormatButton onMouseDown={(e) => handleToggleStyle(e, 'BOLD')}><BoldIcon className='w-4 h-4' /></FormatButton>
            <FormatButton onMouseDown={(e) => handleToggleStyle(e, 'ITALIC')}><ItalicIcon className='w-4 h-4' /></FormatButton>
            <FormatButton onMouseDown={(e) => handleToggleStyle(e, 'UNDERLINE')}><UnderlineIcon className='w-4 h-4' /></FormatButton>
            <FormatButton onMouseDown={(e) => handleToggleStyle(e, 'HIGHLIGHT')}><span className='bg-yellow-600 w-4 h-4'></span></FormatButton>
        </div>
    );
};

export default InlineToolbar;