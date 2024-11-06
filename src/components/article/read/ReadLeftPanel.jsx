import React from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import BodyWithFixedHeader from '../../common/BodyWithFixedHeader';
import FormatButton from '../../common/FormatButton';

const ReadLeftPanel = () => {
    return (
        <BodyWithFixedHeader >
            <div className='flex flex-wrap justify-between p-2 shadow-lg'>
                <h2>Notes</h2>
                <FormatButton><PlusIcon className="w-4 h-4" /></FormatButton>
            </div>
            <div>

            </div>
        </BodyWithFixedHeader>
    );
};

export default ReadLeftPanel;