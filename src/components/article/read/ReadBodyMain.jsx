import React from 'react';
import ReadControls from './ReadControls';
import ReadContent from './ReadContent';

const ReadBodyMain = () => {
    return (
        <div className='flex flex-col h-full'>
            <div className='p-6 flex-shrink-0 border-b shadow-lg bg-stone-100'>
                <ReadControls />
            </div>
            <div className='flex-1 overflow-y-auto bg-stone-50'>
                <ReadContent />
            </div>
        </div>
    );
};

export default ReadBodyMain;