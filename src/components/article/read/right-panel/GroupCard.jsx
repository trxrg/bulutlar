import React, { useState, useContext } from 'react';
import { DBContext } from '../../../../store/db-context';
import { AppContext } from '../../../../store/app-context';
import { ReadContext } from '../../../../store/read-context';
import { articleApi } from '../../../../backend-adapter/BackendAdapter';
import ContextMenu from '../../../common/ContextMenu';
import ActionButton from '../../../common/ActionButton';

const GroupCard = ({ groupId }) => {

    const { getGroupById, fetchArticleById } = useContext(DBContext);
    const { translate: t } = useContext(AppContext);
    const { article } = useContext(ReadContext);
    const [contextMenuIsOpen, setContextMenuIsOpen] = useState(false);
    const [contextMenuPosition, setContextMenuPosition] = useState({ x: 10, y: 10 });
    const group = getGroupById(groupId);

    const handleRightClick = (e) => {
        e.preventDefault();
        const grandParentRect = e.currentTarget.getBoundingClientRect();
        const posx = e.clientX - grandParentRect.left;
        const posy = e.clientY - grandParentRect.top;
        setContextMenuIsOpen(true);
        setContextMenuPosition({ x: posx, y: posy });
    }

    const handleRemove = async () => {
        await articleApi.removeFromGroup(article.id, groupId);
        fetchArticleById(article.id);
    }

    return (
        <div className='relative' onContextMenu={handleRightClick}>
            <div className='rounded-md bg-gray-100 hover:bg-white border-2
        active:bg-gray-300 active:shadow-none shadow-xl cursor-pointer flex flex-row w-full overflow-hidden'>
                <h2 className="text-xl text-gray-700 hover:text-gray-600 break-words p-2">{group.name}</h2>
            </div>
            <ContextMenu isOpen={contextMenuIsOpen} onClose={() => setContextMenuIsOpen(false)} position={{ top: contextMenuPosition.y, left: contextMenuPosition.x }}>
                <div className='flex flex-col'>
                    <ActionButton onClick={handleRemove} color='red'>{t('remove')}</ActionButton>
                </div>
            </ContextMenu>
        </div>
    );
};

export default GroupCard;
