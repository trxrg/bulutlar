import React, { useState } from 'react';
import TagsPanel from './TagsPanel';
import GroupsPanel from './GroupsPanel';
import RelatedArticlesPanel from './RelatedArticlesPanel';

const ReadRightPanel = () => {
    const [isTagsPanelCollapsed, setIsTagsPanelCollapsed] = useState(false);
    const [isGroupsPanelCollapsed, setIsGroupsPanelCollapsed] = useState(false);

    return (
        <div className='flex flex-col h-full min-w-full'>
            {/* Related Articles Panel - Always visible */}
            <div className='flex-1 min-w-full overflow-y-auto'>
                <RelatedArticlesPanel />
            </div>
            
            {/* Tags Panel - Collapsible */}
            <div className={`${isTagsPanelCollapsed ? 'flex-none' : 'flex-1'} min-w-full transition-all duration-300`} style={{ borderTop: '4px solid var(--border-primary)' }}>
                <TagsPanel 
                    isCollapsed={isTagsPanelCollapsed}
                    onToggleCollapse={() => setIsTagsPanelCollapsed(!isTagsPanelCollapsed)}
                />
            </div>
            
            {/* Groups Panel - Collapsible */}
            <div className={`${isGroupsPanelCollapsed ? 'flex-none' : 'flex-1'} min-w-full transition-all duration-300`} style={{ borderTop: '4px solid var(--border-primary)' }}>
                <GroupsPanel 
                    isCollapsed={isGroupsPanelCollapsed}
                    onToggleCollapse={() => setIsGroupsPanelCollapsed(!isGroupsPanelCollapsed)}
                />
            </div>
        </div>
    );
};

export default ReadRightPanel;