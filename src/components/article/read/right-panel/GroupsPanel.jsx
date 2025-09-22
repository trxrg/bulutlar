import React, { useContext, useState, useEffect } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import CollapsiblePanel from '../../../common/CollapsiblePanel';
import { AppContext } from '../../../../store/app-context';
import { ReadContext } from '../../../../store/read-context';
import { DBContext } from '../../../../store/db-context';
import { articleApi, groupApi } from '../../../../backend-adapter/BackendAdapter';
import GroupCard from './GroupCard';
import GroupModal from '../../../group/GroupModal';
import toastr from 'toastr';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

const GroupsPanel = ({ isCollapsed, onToggleCollapse }) => {
    const { translate: t, setActiveScreen } = useContext(AppContext);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [localGroups, setLocalGroups] = useState([]);
    const { article } = useContext(ReadContext);
    const { fetchArticleById, fetchAllGroups } = useContext(DBContext);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Sync local state with article's groups
    useEffect(() => {
        setLocalGroups(article.groups || []);
    }, [article.groups]);

    const handleTitleClick = () => {
        setActiveScreen('groups');
    }

    const addArticleToGroup = async (groupName) => {
        await articleApi.addToGroup(article.id, groupName);
        fetchArticleById(article.id);
        fetchAllGroups();
    }

    const handleDragEnd = async (event) => {
        const { active, over } = event;

        // Check if over exists and is different from active
        if (over && active.id !== over.id) {
            const oldIndex = localGroups.findIndex(group => group.id === active.id);
            const newIndex = localGroups.findIndex(group => group.id === over.id);

            // Make sure both indices are valid
            if (oldIndex !== -1 && newIndex !== -1) {
                const newOrder = arrayMove(localGroups, oldIndex, newIndex);
                
                // Update local state immediately for smooth UI
                setLocalGroups(newOrder);

                // Update ordering in database
                try {
                    const orderings = newOrder.map((group, index) => ({
                        groupId: group.id,
                        ordering: index
                    }));
                    await groupApi.updateOrderings(orderings);
                } catch (error) {
                    console.error('Error updating group orderings:', error);
                    toastr.error(t('error updating order'));
                    // Revert local state on error
                    await fetchArticleById(article.id);
                }
            }
        }
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
                {localGroups.length > 0 ?
                    <div className="flex flex-col gap-2 p-2 h-full overflow-y-auto overflow-x-hidden">
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext items={localGroups.map(group => group.id).filter(id => id)} strategy={verticalListSortingStrategy}>
                                {localGroups.map((group) => (
                                    <GroupCard 
                                        key={group.id} 
                                        groupId={group.id} 
                                    />
                                ))}
                            </SortableContext>
                        </DndContext>
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