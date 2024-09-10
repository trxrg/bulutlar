import React, { useState, useContext } from 'react';
import AddLinkModal from '../../components/AddLinkModal.jsx';

import { LinkIcon } from '@heroicons/react/24/outline';
import { ReadContext } from '../../store/read-context.jsx';

const ReadControls = () => {

    const { readBodyRef } = useContext(ReadContext);

    const [isLinkModalOpen, setLinkModalOpen] = useState(false);

    const handleMouseDown = (event, action) => {
        event.preventDefault();
        if (readBodyRef && readBodyRef.current)
            if (action === 'underline')
                readBodyRef.current.toggleUnderline();
            else if (action === 'bold')
                readBodyRef.current.toggleBold();
    }

    return (
        <div className='overflow-auto bg-stone-50'>
            <div className='p-2'>
                <button onClick={() => setLinkModalOpen(true)} className="bg-blue-500 hover:bg-blue-700 text-white py-2 px-2 mx-1 rounded focus:outline-none focus:shadow-outline">
                    <LinkIcon className="w-4 h-4" />
                </button>
                <button onMouseDown={(e) => handleMouseDown(e, 'bold')} className="bg-blue-500 hover:bg-blue-700 text-white py-2 px-2 mx-1 rounded focus:outline-none focus:shadow-outline">
                    <strong>B</strong>
                </button>
                <button onMouseDown={(e) => handleMouseDown(e, 'underline')} className="bg-blue-500 hover:bg-blue-700 text-white py-2 px-2 mx- rounded focus:outline-none focus:shadow-outline">
                    <u>U</u>
                </button>
            </div>
            <AddLinkModal
                isOpen={isLinkModalOpen}
                onClose={() => setLinkModalOpen(false)}
            />
        </div>
    );
};

export default ReadControls;
