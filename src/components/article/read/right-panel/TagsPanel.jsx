import React, { useContext, useState } from 'react';
import TagList2 from '../../../tag/TagList2';
import { PlusIcon } from '@heroicons/react/24/outline';
import CollapsiblePanel from '../../../common/CollapsiblePanel';
import { AppContext } from '../../../../store/app-context';

const TagsPanel = ({ isCollapsed, onToggleCollapse }) => {
    const { translate: t, setActiveScreen } = useContext(AppContext);
    const [adding, setAdding] = useState(false);

    const handleTitleClick = () => {
        setActiveScreen('tags');
    }

    const headerButtons = [
        {
            onClick: () => setAdding(prev => !prev),
            title: t('add tag'),
            icon: <PlusIcon className="w-5 h-5" />
        }
    ];

    return (
        <CollapsiblePanel
            isCollapsed={isCollapsed}
            onToggleCollapse={onToggleCollapse}
            title={t('tags')}
            onTitleClick={handleTitleClick}
            headerButtons={headerButtons}
        >
            <div className='flex'>
                <TagList2 showInput={adding} />
            </div>
        </CollapsiblePanel>
    );
};

export default TagsPanel;