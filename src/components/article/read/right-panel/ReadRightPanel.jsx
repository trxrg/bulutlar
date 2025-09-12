import React from 'react';
import TagsPanel from './TagsPanel';
import GroupsPanel from './GroupsPanel';
import RelatedArticlesPanel from './RelatedArticlesPanel';

const ReadRightPanel = () => {
    return (
        <div className='flex flex-col h-full min-w-full'>
            <div className='flex-1 min-w-full overflow-y-auto'>
                <RelatedArticlesPanel />
            </div>
            <div className='flex-1 min-w-full overflow-y-auto' style={{ borderTop: '4px solid var(--border-primary)' }}>
                <TagsPanel />
            </div>
            <div className='flex-1 min-w-full overflow-y-auto' style={{ borderTop: '4px solid var(--border-primary)' }}>
                <GroupsPanel />
            </div>
        </div>
    );
};

export default ReadRightPanel;