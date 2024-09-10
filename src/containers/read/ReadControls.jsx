import React, { useState, useContext } from 'react';
import AddLinkModal from '../../components/AddLinkModal.jsx';

import { LinkIcon } from '@heroicons/react/24/outline';
import { ReadContext } from '../../store/read-context.jsx';

const ReadControls = () => {

    const { increaseFontSize, decreaseFontSize, toggleStyle } = useContext(ReadContext);

    const [isLinkModalOpen, setLinkModalOpen] = useState(false);

    const handleToggleStyle = (event, style) => {
        event.preventDefault();
        toggleStyle(style);
    }

    return (
        <div className='overflow-auto bg-stone-50'>
            <div className='p-2'>
                <button onClick={decreaseFontSize} className="bg-blue-500 hover:bg-blue-700 text-white py-2 px-2 mx-1 rounded focus:outline-none focus:shadow-outline">
                    A-
                </button>
                <button onMouseDown={increaseFontSize} className="bg-blue-500 hover:bg-blue-700 text-white py-2 px-2 mx-1 rounded focus:outline-none focus:shadow-outline">
                    A+
                </button>
                <button onMouseDown={(e) => handleToggleStyle(e, 'BOLD')} className="bg-blue-500 hover:bg-blue-700 text-white py-2 px-2 mx-1 rounded focus:outline-none focus:shadow-outline">
                    <strong>B</strong>
                </button>
                <button onMouseDown={(e) => handleToggleStyle(e, 'UNDERLINE')} className="bg-blue-500 hover:bg-blue-700 text-white py-2 px-2 mx-1 rounded focus:outline-none focus:shadow-outline">
                    <u>U</u>
                </button>
                <button onMouseDown={(e) => handleToggleStyle(e, 'HIGHLIGHT')} className="bg-blue-500 hover:bg-blue-700 text-white py-2 px-2 mx-1 rounded focus:outline-none focus:shadow-outline">
                    <u>H</u>
                </button>
                <button onClick={() => setLinkModalOpen(true)} className="bg-blue-500 hover:bg-blue-700 text-white py-2 px-2 mx-1 rounded focus:outline-none focus:shadow-outline">
                    <LinkIcon className="w-4 h-4" />
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
