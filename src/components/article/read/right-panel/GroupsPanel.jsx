import React, { useContext, useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import CollapsiblePanel from '../../../common/CollapsiblePanel';
import { AppContext } from '../../../../store/app-context';
import { ReadContext } from '../../../../store/read-context';
import { DBContext } from '../../../../store/db-context';
import { articleApi } from '../../../../backend-adapter/BackendAdapter';
import GroupCard from './GroupCard';
import GroupModal from '../../../group/GroupModal';

const GroupsPanel = ({ isCollapsed, onToggleCollapse }) => {
    const { translate: t, setActiveScreen } = useContext(AppContext);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { article } = useContext(ReadContext);
    const { fetchArticleById, fetchAllGroups } = useContext(DBContext);

    const handleTitleClick = () => {
        setActiveScreen('groups');
    }

    const addArticleToGroup = async (groupName) => {
        await articleApi.addToGroup(article.id, groupName);
        fetchArticleById(article.id);
        fetchAllGroups();
    }

    const headerButtons = [
        {
            onClick: () => setIsModalOpen(true),
            title: t('add to group'),
            icon: <PlusIcon className="w-5 h-5" />
        }
    ];

    return (
        <>
            <CollapsiblePanel
                isCollapsed={isCollapsed}
                onToggleCollapse={onToggleCollapse}
                title={t('groups')}
                onTitleClick={handleTitleClick}
                headerButtons={headerButtons}
            >
                {article.groups.length > 0 ?
                    <div className='flex flex-col gap-2 p-2'>
                        {article.groups.map((group) => <GroupCard key={group.id} groupId={group.id} />)}
                    </div>
                    :
                    <div className='flex justify-center p-2 h-full'>
                        <p style={{ color: 'var(--text-secondary)' }}>{t('no groups')}</p>
                    </div>}
            </CollapsiblePanel>
            <GroupModal isOpen={isModalOpen} onRequestClose={() => setIsModalOpen(false)} onConfirm={addArticleToGroup}/>
        </>
    );
};

export default GroupsPanel;