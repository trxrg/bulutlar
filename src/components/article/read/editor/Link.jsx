import React, { useState, useContext } from 'react';
import { AppContext } from '../../../../store/app-context';
import ContextMenu from '../../../common/ContextMenu';
import ActionButton from '../../../common/ActionButton';

const Link = (props) => {

    const contentState = props.contentState;
    const blockKey = props.blockKey;
    const entityKey = props.entityKey;
    const onDelete = props.onDelete;
    const children = props.children;
    const start = props.start;
    const end = props.end;

    const { translate: t, handleAddTab } = useContext(AppContext);

    const [contextMenuIsOpen, setContextMenuIsOpen] = useState(false);
    const [contextMenuPosition, setContextMenuPosition] = useState({ x: 10, y: 10 });
    

    const handleClick = (e) => {
        e.preventDefault();

        const { url } = contentState.getEntity(entityKey).getData();

        console.log('Link clicked:', url);

        try {
            if (url.startsWith('article:'))
                handleAddTab(e, parseInt(url.substring(8)));    
        } catch (error) {
            console.error('Error handling link click:', error);
        }        
        // handle other types of links here
    };

    const handleRightClick = (e) => {
        e.preventDefault();

        const grandParentRect = e.currentTarget.getBoundingClientRect();

        const posx = e.clientX - grandParentRect.left;
        const posy = e.clientY - grandParentRect.top;

        setContextMenuIsOpen(true);
        setContextMenuPosition({ x: posx, y: posy });
    }

    const handleRemoveLink = () => {
        onDelete(blockKey, { start, end });
        setContextMenuIsOpen(false);
    }

    return (
        <a className='relative'>
            <span className="link" onClick={handleClick} onContextMenu={handleRightClick}>
                {children}
            </span>
            <ContextMenu isOpen={contextMenuIsOpen}
                onClose={() => setContextMenuIsOpen(false)}
                position={{ top: contextMenuPosition.y, left: contextMenuPosition.x }}>
                <div className='flex flex-col'>
                    <ActionButton color={'red'} onClick={handleRemoveLink}
                        className='hover:bg-red-300'>{t('remove link')}
                    </ActionButton>
                </div>
            </ContextMenu>
        </a>
    );
};

export default Link;