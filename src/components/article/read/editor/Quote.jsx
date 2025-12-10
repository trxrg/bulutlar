import React, { useState, useContext, useRef, useEffect } from 'react';
import { AppContext } from '../../../../store/app-context';
import { ReadContext } from '../../../../store/read-context';
import { DBContext } from '../../../../store/db-context';
import ContextMenu from '../../../common/ContextMenu';
import ActionButton from '../../../common/ActionButton';
import toastr from 'toastr';
import { annotationApi } from '../../../../backend-adapter/BackendAdapter';

const Quote = (props) => {
    const contentState = props.contentState;
    const blockKey = props.blockKey;
    const entityKey = props.entityKey;
    const onDelete = props.onDelete;
    const children = props.children;
    const start = props.start;
    const end = props.end;

    const { translate: t } = useContext(AppContext);
    const { fetchAllAnnotations } = useContext(DBContext);

    const [contextMenuIsOpen, setContextMenuIsOpen] = useState(false);
    const [contextMenuPosition, setContextMenuPosition] = useState({ x: 10, y: 10 });
    const [annotationId, setAnnotationId] = useState(null);

    const linkRef = useRef(null);

    const handleRightClick = (e) => {
        e.preventDefault();
        setContextMenuPosition({ x: e.clientX, y: e.clientY });
        setContextMenuIsOpen(true);
    };

    const handleRemoveQuote = async () => {
        try {
            onDelete(blockKey, { start, end });
            setContextMenuIsOpen(false);            
        } catch (error) {
            console.error('Error deleting quote from editor:', error);
            toastr.error(t('error deleting quote'));
        }

        try {
            await annotationApi.deleteById(annotationId);
            await fetchAllAnnotations();
        } catch (error) {
            console.error('Error deleting quote from db:', error);
        }
    };

    useEffect(() => {
        const { annotationId } = contentState.getEntity(entityKey).getData();
        setAnnotationId(annotationId);
    }, []);

    return (
        <>
            <div className='inline relative' ref={linkRef}>
                <span className="quote" onContextMenu={handleRightClick}>
                    {children}
                </span>
                <ContextMenu isOpen={contextMenuIsOpen}
                    onClose={() => setContextMenuIsOpen(false)}
                    position={{ top: contextMenuPosition.y, left: contextMenuPosition.x }}>
                    <div className='flex flex-col'>
                        <ActionButton color={'red'} onClick={handleRemoveQuote}>
                            {t('remove quote')}
                        </ActionButton>
                    </div>
                </ContextMenu>
            </div>
        </>
    );
};

export default Quote;