import React, { useState, useContext } from 'react';
import { AppContext } from '../../../../store/app-context';
import { ReadContext } from '../../../../store/read-context';
import ContextMenu from '../../../common/ContextMenu';
import ActionButton from '../../../common/ActionButton';

const Link = ({ contentState, blockKey, entityKey, onDelete, children }) => {

    const { translate: t } = useContext(AppContext);
    const { editable } = useContext(ReadContext);

    const [contextMenuIsOpen, setContextMenuIsOpen] = useState(false);
    const [contextMenuPosition, setContextMenuPosition] = useState({ x: 10, y: 10 });

    const { url } = contentState.getEntity(entityKey).getData();

    const handleRightClick = (e) => {
        e.preventDefault();

        if (!editable) return;

        const grandParentRect = e.currentTarget.getBoundingClientRect();

        const posx = e.clientX - grandParentRect.left;
        const posy = e.clientY - grandParentRect.top;

        console.log('right click posx: ' + posx + ' posy: ' + posy);

        setContextMenuIsOpen(true);
        setContextMenuPosition({ x: posx, y: posy });
    }

    const handleRemoveLink = () => {
        // onDelete();
        console.log('link remove clicked');
    }

    const onClick = () => {
        console.log('heyy, link clicked url: ' + url);
    };

    const onContextMenu = (e) => {
        console.log('link context menu');
        handleRightClick(e, blockKey, entityKey);
    };

    return (
        <a className='relative'>
            <span className="link" onClick={onClick} onContextMenu={onContextMenu}>
                {children}
            </span>
            <ContextMenu isOpen={contextMenuIsOpen} onClose={() => setContextMenuIsOpen(false)} position={{ top: contextMenuPosition.y, left: contextMenuPosition.x }}>
                <div className='flex flex-col'>
                    <ActionButton color={'red'} onClick={handleRemoveLink} className='hover:bg-red-300'>Remove Link</ActionButton>
                </div>
            </ContextMenu>
        </a>
    );
};

export default Link;