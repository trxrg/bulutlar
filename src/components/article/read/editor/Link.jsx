import React, { useState, useContext } from 'react';
import { AppContext } from '../../../../store/app-context';
import { ReadContext } from '../../../../store/read-context';
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
    const { editable } = useContext(ReadContext);

    const [contextMenuIsOpen, setContextMenuIsOpen] = useState(false);
    const [contextMenuPosition, setContextMenuPosition] = useState({ x: 10, y: 10 });

    const { url } = contentState.getEntity(entityKey).getData();

    const handleClick = (e) => {
        e.preventDefault();


        console.log('heyy, link clicked url: ' + url);
    };

    const handleRightClick = (e) => {
        e.preventDefault();

        if (!editable) return;

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