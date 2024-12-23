import React from 'react';
import TagsPanel from './TagsPanel';
import RelatedArticlesPanel from './RelatedArticlesPanel';

const ReadRightPanel = () => {
    return (
        <div className='flex flex-col justify-between h-full'>
            <RelatedArticlesPanel />
            <TagsPanel />
        </div>
    );
};

export default ReadRightPanel;