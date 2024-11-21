import React, { useState, useEffect, useRef, useContext } from 'react';
import { Editor, EditorState, RichUtils, AtomicBlockUtils, CompositeDecorator, Modifier, SelectionState, convertToRaw, convertFromRaw, getDefaultKeyBinding, KeyBindingUtil } from 'draft-js';
import { stateToHTML } from 'draft-js-export-html';
import { stateFromHTML } from 'draft-js-import-html';
import AddLinkModal from '../../../common/AddLinkModal';
import { imageApi } from '../../../../backend-adapter/BackendAdapter';
import { AppContext } from '../../../../store/app-context';
import ContextMenu from '../../../common/ContextMenu';
import ActionButton from '../../../common/ActionButton';


import Image from './Image';
import '../../../../styles.css'

const RichEditor = React.forwardRef(({ name, htmlContent, rawContent, handleContentChange, editable }, ref) => {

    const [rightClickedBlockKey, setRightClickedBlockKey] = useState();
    const [rightClickedEntityKey, setRightClickedEntityKey] = useState();

    const [contextMenuIsOpen, setContextMenuIsOpen] = useState(false);
    const [contextMenuPosition, setContextMenuPosition] = useState({ x: 10, y: 10 });

    const editorRef = useRef(null);

    const { translate: t } = useContext(AppContext);

    const styleMap = {
        'HIGHLIGHT': {
            backgroundColor: 'rgba(240, 240, 120, 1.0)'
        },
    };

    const Link = ({ contentState, blockKey, entityKey, children }) => {

        const { url } = contentState.getEntity(entityKey).getData();
        const onClick = () => {
            console.log('link clicked url: ' + url);
        };

        const onContextMenu = (e) => {
            handleRightClick(e, blockKey, entityKey);
        };

        return (
            <span className="link" onClick={onClick} onContextMenu={onContextMenu}>
                {children}
            </span>
        );
    };

    function findLinkEntities(contentBlock, callback, contentState) {
        contentBlock.findEntityRanges((character) => {
            const entityKey = character.getEntity();
            return (
                entityKey !== null &&
                contentState.getEntity(entityKey).getType() === 'MYLINK'
            );
        }, callback);
    }

    const getImages = (editorState) => {
        const contentState = editorState.getCurrentContent();
        const blockMap = contentState.getBlockMap();
        const images = [];

        blockMap.forEach(block => {
            block.findEntityRanges(character => {
                const entityKey = character.getEntity();
                if (entityKey !== null) {
                    const entity = contentState.getEntity(entityKey);
                    if (entity.getType() === 'IMAGE') {
                        images.push(entity.getData());
                    }
                }
            });
        });
        return images;
    };

    const decorator = new CompositeDecorator([
        {
            strategy: findLinkEntities,
            component: Link,
        },
    ]);

    const createEditorStateFromHTML = (html) => {
        if (!html) return EditorState.createEmpty();

        const contentState = stateFromHTML(html);

        return EditorState.createWithContent(contentState, decorator);
    };

    const [editorState, setEditorState] = useState(rawContent ? EditorState.createWithContent(convertFromRaw(rawContent), decorator) : createEditorStateFromHTML(htmlContent));
    const [isLinkModalOpen, setLinkModalOpen] = useState(false);
    const [showContextMenu, setShowContextMenu] = useState(false);

    const handleRightClick = (e, blockKey, entityKey) => {
        e.preventDefault(); // Prevent default context menu        

        const grandParentRect = e.currentTarget.parentElement.getBoundingClientRect();

        const posx = e.clientX - grandParentRect.left;
        const posy = e.clientY - grandParentRect.top;

        setRightClickedBlockKey(blockKey);
        setRightClickedEntityKey(entityKey);
        setShowContextMenu(true);
        setContextMenuPosition({ left: posx, top: posy });
    };

    const handleRemoveLink = (e) => {
        e.preventDefault();

        const contentState = editorState.getCurrentContent();
        const block = contentState.getBlockForKey(rightClickedBlockKey);

        // Retrieve the entity range within the block
        let entityRange;
        block.findEntityRanges(
            character => {
                const entity = character.getEntity();
                return entity !== null && entity === rightClickedEntityKey;
            },
            (start, end) => {
                entityRange = { start, end };
            }
        );

        if (entityRange) {
            // Create selection state for the entity range
            const selection = SelectionState.createEmpty(rightClickedBlockKey).merge({
                anchorOffset: entityRange.start,
                focusOffset: entityRange.end,
            });

            // Remove the link entity from the content state
            const newContentState = Modifier.applyEntity(contentState, selection, null);

            // Update editor state with the new content state
            const newEditorState = EditorState.push(
                editorState,
                newContentState,
                'apply-entity'
            );

            setEditorState(newEditorState);
            setShowContextMenu(false); // Hide context menu after removing link
        }
    };

    const handleSelect = (e) => {
        const selection = window.getSelection();
        if (selection.rangeCount > 0 && !selection.isCollapsed) {
            const range = selection.getRangeAt(0).getBoundingClientRect();
            // const editorBounds = editorRef.current.getParentElement().getBoundingClientRect();
            const editorBounds = e.currentTarget.getBoundingClientRect();
            console.log('range: ', range.top, range.left);
            console.log('editorBounds: ', editorBounds.top, editorBounds.left);
            const top = range.top - editorBounds.top - 40;
            const left = range.left - editorBounds.left;
            console.log('top: ', top, 'left: ', left);
            setContextMenuPosition({
                top: top,
                left: left
            });
            setContextMenuIsOpen(true);
        } else {
            setContextMenuIsOpen(false);
        }
    };

    const toggleBlockType = (blockType) => {
        setEditorState(RichUtils.toggleBlockType(editorState, blockType));
    };

    const toggleInlineStyle = (style) => {
        setEditorState((prevState) => {
            const newEditorState = EditorState.forceSelection(RichUtils.toggleInlineStyle(prevState, style), prevState.getSelection());
            handleContentChange(stateToHTML(newEditorState.getCurrentContent()), convertToRaw(newEditorState.getCurrentContent()));
            return newEditorState;
        }
        );
    };

    const addLink = (url) => {
        const contentState = editorState.getCurrentContent();
        const contentStateWithEntity = contentState.createEntity('MYLINK', 'MUTABLE', { url });
        const entityKey = contentStateWithEntity.getLastCreatedEntityKey();

        // Apply entity to the selected text
        const newEditorState = RichUtils.toggleLink(
            editorState,
            editorState.getSelection(),
            entityKey
        );

        setEditorState(EditorState.forceSelection(newEditorState, editorState.getSelection()));
    }

    const addImage = (image) => {
        const contentState = editorState.getCurrentContent();
        const contentStateWithEntity = contentState.createEntity('IMAGE', 'IMMUTABLE', image);
        const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
        const newEditorState = EditorState.set(editorState, { currentContent: contentStateWithEntity });
        setEditorState(AtomicBlockUtils.insertAtomicBlock(newEditorState, entityKey, ' '));
    };

    const getContent = () => {
        const originalEditorState = rawContent ? EditorState.createWithContent(convertFromRaw(rawContent), decorator) : createEditorStateFromHTML(htmlContent);
        const currentImageIds = getImages(editorState).map(image => image.id);
        const originalImageIds = getImages(originalEditorState).map(image => image.id);

        // find images that are present in the originaleditorstate but not in the current editorState
        // delete them from the db and the fs as they will be removed from the editor content
        const imagesToDelete = originalImageIds.filter(id => !currentImageIds.includes(id));
        imagesToDelete.forEach(imageId => imageApi.deleteById(imageId));

        return { html: stateToHTML(editorState.getCurrentContent()), json: convertToRaw(editorState.getCurrentContent()) };
    }

    const resetContent = () => {
        const originalEditorState = rawContent ? EditorState.createWithContent(convertFromRaw(rawContent), decorator) : createEditorStateFromHTML(htmlContent);
        const currentImageIds = getImages(editorState).map(image => image.id);
        const originalImageIds = getImages(originalEditorState).map(image => image.id);

        // find images that are present in the current editorstate but not in the originalEditorState
        // delete them from the db and the fs as they will be removed from the editor content
        const imagesToDelete = currentImageIds.filter(id => !originalImageIds.includes(id));
        imagesToDelete.forEach(imageId => imageApi.deleteById(imageId));

        setEditorState(originalEditorState);
    }

    React.useImperativeHandle(ref, () => ({
        addLink,
        addImage,
        getContent,
        resetContent,
        toggleInlineStyle,
        toggleBlockType,
    }));

    const handleEditorChange = (newEditorState) => {
        setEditorState(newEditorState);
        // setShowContextMenu(false);
    };

    const handleEditorClick = () => {
        setShowContextMenu(false);
    }

    const blockRendererFn = (contentBlock) => {
        if (contentBlock.getType() === 'atomic') {
            const contentState = editorState.getCurrentContent();
            const entityKey = contentBlock.getEntityAt(0);
            if (entityKey) {
                const entity = contentState.getEntity(entityKey);
                const entityType = entity.getType();

                if (entityType === 'IMAGE') {
                    return {
                        component: Image,
                        editable: false,
                        props: {
                            block: contentBlock,
                            contentState,
                            onDelete: () => deleteAtomicBlock(contentBlock.getKey()),
                        }
                    };
                } else if (entityType === 'VIDEO') {
                    // for future developments
                    // return {
                    //     component: VideoComponent,
                    //     editable: false,
                    // };
                }
            }
        }
        return null;
    };

    const keyBindingFn = (e) => {
        const selection = editorState.getSelection();
        const contentState = editorState.getCurrentContent();
        const startKey = selection.getStartKey();
        const endKey = selection.getEndKey();
        const startBlock = contentState.getBlockForKey(startKey);
        const endBlock = contentState.getBlockForKey(endKey);

        let containsAtomicBlock = false;

        if (!selection.isCollapsed()) {
            let block = startBlock;

            while (true) {
                if (!block)
                    break;

                if (block.getType() === 'atomic') {
                    containsAtomicBlock = true;
                    break;
                }
                if (block.getKey() === endBlock.getKey()) {
                    break;
                }
                block = contentState.getBlockAfter(block.getKey());
            }

        } else if (e.keyCode === 8 || e.keyCode === 46) { // Backspace or Delete
            const blockBefore = contentState.getBlockBefore(startKey);
            const blockAfter = contentState.getBlockAfter(startKey);

            const offset = selection.getStartOffset();
            const isAtStartOfBlock = offset === 0;
            const isAtEndOfBlock = offset === startBlock.getLength();

            if ((e.keyCode === 8 && isAtStartOfBlock && blockBefore && blockBefore.getType() === 'atomic') ||
                (e.keyCode === 46 && isAtEndOfBlock && blockAfter && blockAfter.getType() === 'atomic')) {
                containsAtomicBlock = true;
            }
        }

        if (containsAtomicBlock) {
            console.log('contains atomic block');
            return 'handled';
        }

        // if (KeyBindingUtil.hasCommandModifier(e) && (e.keyCode === 90 || e.keyCode === 89)) {

        //     console.log('undo/redo');
        //     console.log('editable: ', editable);
        //     if (!editable)
        //         return 'handled';
        // }

        return getDefaultKeyBinding(e);
    };

    const deleteAtomicBlock = (blockKey) => {
        const contentState = editorState.getCurrentContent();
        const blockMap = contentState.getBlockMap();
        const block = contentState.getBlockForKey(blockKey);

        // Save the current selection state
        const currentSelection = editorState.getSelection();

        // Create a selection state that includes the entire block
        const selectionState = SelectionState.createEmpty(blockKey).merge({
            anchorOffset: 0,
            focusOffset: block.getLength(),
            focusKey: blockKey,
            anchorKey: blockKey,
        });

        // Remove the block
        const newBlockMap = blockMap.delete(blockKey);
        const newContentState = contentState.merge({
            blockMap: newBlockMap,
            selectionAfter: selectionState,
        });

        // Push the new content state to the editor state
        const newEditorState = EditorState.push(
            editorState,
            newContentState,
            'remove-range'
        );

        // Restore the saved selection state
        const finalEditorState = EditorState.forceSelection(
            newEditorState,
            currentSelection
        );

        // Update the editor state
        setEditorState(finalEditorState);
    };

    return (
        <div className='relative z-0'>
            <div onClick={handleEditorClick} className={(editable ? 'border-2 border-stone-300 bg-white ' : 'caret-transparent ') + ' min-w-full z-0 flex'} onMouseUp={handleSelect}>
                {showContextMenu && (
                    <div className="context-menu" style={{ top: contextMenuPosition.y, left: contextMenuPosition.x }}>
                        <button onClick={handleRemoveLink} className='hover:bg-red-300'>Remove Link</button>
                    </div>
                )}
                <Editor
                    editorState={editorState}
                    onChange={handleEditorChange}
                    handleKeyCommand={editable ? undefined : () => 'handled'} // backspace enter etc.
                    keyBindingFn={editable ? keyBindingFn : () => 'handled'}
                    handleBeforeInput={editable ? undefined : () => 'handled'}
                    handleReturn={editable ? undefined : () => 'handled'}
                    handlePastedText={editable ? undefined : () => 'handled'}
                    readOnly={false}
                    customDecorators={[decorator]}
                    customStyleMap={styleMap}
                    handleDrop={editable ? undefined : () => 'handled'}
                    blockRendererFn={blockRendererFn}
                    ref={editorRef}
                // className='z-0'
                />
            </div>
            <ContextMenu isOpen={contextMenuIsOpen} onClose={() => setContextMenuIsOpen(false)} position={contextMenuPosition}>
                <div className='flex flex-col'>
                    <ActionButton color='red'>example</ActionButton>
                </div>
            </ContextMenu>

            {/* <AddLinkModal
                isOpen={isLinkModalOpen}
                onClose={() => setLinkModalOpen(false)}
                onAddLink={addLink}
            /> */}


        </div>

    );
});

export default RichEditor;
