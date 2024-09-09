import React, { useState, useContext } from 'react';
import AddLinkModal from '../../components/AddLinkModal.jsx';

import { LinkIcon } from '@heroicons/react/24/outline';

const ReadControls = ({ functions }) => {
    
    const [isLinkModalOpen, setLinkModalOpen] = useState(false);

    return (
        <div className='overflow-auto bg-stone-50'>
            <div className='p-2'>
                <button onClick={() => setLinkModalOpen(true)} className="bg-blue-500 hover:bg-blue-700 text-white py-2 px-2 mx-1 rounded focus:outline-none focus:shadow-outline">
                    <LinkIcon className="w-4 h-4" />
                </button>
                <button onClick={functions.toggleBold} className="bg-blue-500 hover:bg-blue-700 text-white py-2 px-2 mx-1 rounded focus:outline-none focus:shadow-outline">
                    <strong>B</strong>
                </button>
                <button onClick={functions.toggleUnderline} className="bg-blue-500 hover:bg-blue-700 text-white py-2 px-2 mx- rounded focus:outline-none focus:shadow-outline">
                    <u>U</u>
                </button>
            </div>
            <AddLinkModal
                isOpen={isLinkModalOpen}
                onClose={() => setLinkModalOpen(false)}
                onAddLink={functions.addLink}
            />
        </div>
    );
};

export default ReadControls;
