import React from 'react';
import ReadControls from './ReadControls';
import ReadContent from './ReadContent';

const ReadBodyMain = () => {
    return (
        <div className='container flex flex-col h-full border border-blue-500'>
            <div className='p-6 flex-shrink-0'>
                <ReadControls />
            </div>
            <div className='flex-1 overflow-y-auto border border-red-500'>
                <ReadContent />
            </div>
        </div>
    );
};

export default ReadBodyMain;