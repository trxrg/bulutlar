import React, { useState, useRef } from 'react';
import { Editor, EditorState, RichUtils, AtomicBlockUtils, CompositeDecorator, Modifier, SelectionState, convertToRaw, convertFromRaw, getDefaultKeyBinding } from 'draft-js';
import { stateToHTML } from 'draft-js-export-html';
import { stateFromHTML } from 'draft-js-import-html';
import { imageApi } from '../../../../backend-adapter/BackendAdapter';
import ContextMenu from '../../../common/ContextMenu';
import InlineToolbar from './InlineToolbar';
import Link from './Link';
import Image from './Image';
import '../../../../styles.css'
import 'draft-js/dist/Draft.css'; // necessary for list item styling etc.

const styleMap = {
    'HIGHLIGHT': {
        backgroundColor: 'rgba(240, 240, 120, 1.0)'
    },
    'SUPERSCRIPT': {
        verticalAlign: 'super',
        fontSize: 'medium',
    },
    'SUBSCRIPT': {
        verticalAlign: 'sub',
        fontSize: 'medium',
    },
};

const withCustomProps = (Component, customProps) => (props) => (
    <Component {...props} {...customProps} />
);

const createEditorStateFromHTMLAndDecorator = (html, decorator) => {
    if (!html) return EditorState.createEmpty();
    return EditorState.createWithContent(stateFromHTML(html), decorator);
};

const RichEditor = React.forwardRef(({ name, htmlContent, rawContent, handleContentChange, editable }, ref) => {

    const decorator = new CompositeDecorator([
        {
            strategy: findLinkEntities,
            component: withCustomProps(Link, { onDelete: handleRemoveLink }),
        },
    ]);

    const [editorState, setEditorState] = useState(rawContent
        ? EditorState.createWithContent(convertFromRaw(rawContent), decorator)
        : createEditorStateFromHTMLAndDecorator(htmlContent, decorator));
    const [contextMenuIsOpen, setContextMenuIsOpen] = useState(false);
    const [contextMenuPosition, setContextMenuPosition] = useState({ x: 10, y: 10 });

    const editorStateRef = useRef(editorState);
    const editorRef = useRef();

    const persist = (newEditorState) => {
        handleContentChange(stateToHTML(newEditorState.getCurrentContent()), convertToRaw(newEditorState.getCurrentContent()));
    };

    // ================================ LINKS ================================
    const addLink = (url) => {
        if (editorState.getSelection().isCollapsed())
            return;

        const contentState = editorState.getCurrentContent();
        const contentStateWithEntity = contentState.createEntity('MYLINK', 'MUTABLE', { url });
        const entityKey = contentStateWithEntity.getLastCreatedEntityKey();

        // Apply entity to the selected text
        const newEditorState = RichUtils.toggleLink(
            editorState,
            editorState.getSelection(),
            entityKey
        );

        setEditorState(newEditorState);
        persist(newEditorState);
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

    function handleRemoveLink(blockKey, entityRange) {
        const contentState = editorStateRef.current.getCurrentContent();

        if (entityRange) {
            // Create selection state for the entity range
            const selection = SelectionState.createEmpty(blockKey).merge({
                anchorOffset: entityRange.start,
                focusOffset: entityRange.end,
            });

            // Remove the link entity from the content state
            const newContentState = Modifier.applyEntity(contentState, selection, null);

            // Update editor state with the new content state
            const newEditorState = EditorState.push(
                editorStateRef.current,
                newContentState,
                'apply-entity'
            );

            setEditorState(newEditorState);
            persist(newEditorState);
        }
    };

    // ================================ END OF LINKS ================================

    // ================================ IMAGES ================================

    const addImage = (image) => {
        const contentState = editorState.getCurrentContent();
        const contentStateWithEntity = contentState.createEntity('IMAGE', 'IMMUTABLE', image);
        const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
        const newEditorState = EditorState.set(editorState, { currentContent: contentStateWithEntity });
        setEditorState(AtomicBlockUtils.insertAtomicBlock(newEditorState, entityKey, ' '));
    };

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

    const deleteAtomicBlock = (blockKey) => {
        const contentState = editorStateRef.current.getCurrentContent();
        const blockMap = contentState.getBlockMap();
        const block = contentState.getBlockForKey(blockKey);

        // Save the current selection state
        const currentSelection = editorStateRef.current.getSelection();

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
            editorStateRef.current,
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

    // ================================ END OF IMAGES ================================

    const handleMouseUp = (e) => {
        const selection = window.getSelection();
        if (selection.rangeCount > 0 && !selection.isCollapsed) {
            const editorBounds = e.currentTarget.getBoundingClientRect();
            // const range = selection.getRangeAt(0).getBoundingClientRect();
            // const top = Math.max(range.top - editorBounds.top - 60, 0);
            // const left = range.left - editorBounds.left;

            setContextMenuPosition({
                top: e.clientY - editorBounds.top,
                left: e.clientX - editorBounds.left,
            });
            setContextMenuIsOpen(true);
        } else {
            setContextMenuIsOpen(false);
        }
    };

    const toggleBlockType = (blockType) => setEditorState(RichUtils.toggleBlockType(editorState, blockType));

    const toggleInlineStyle = (style) => {
        setEditorState((prevState) => {
            const newEditorState = EditorState
                .forceSelection(RichUtils.toggleInlineStyle(prevState, style), prevState.getSelection());
            persist(newEditorState);
            return newEditorState;
        }
        );
    };

    const getContent = () => {
        const originalEditorState = rawContent ? EditorState.createWithContent(convertFromRaw(rawContent), decorator) : createEditorStateFromHTMLAndDecorator(htmlContent, decorator);
        const currentImageIds = getImages(editorState).map(image => image.id);
        const originalImageIds = getImages(originalEditorState).map(image => image.id);

        // find images that are present in the originaleditorstate but not in the current editorState
        // delete them from the db and the fs as they will be removed from the editor content
        const imagesToDelete = originalImageIds.filter(id => !currentImageIds.includes(id));
        imagesToDelete.forEach(imageId => imageApi.deleteById(imageId));

        return { html: stateToHTML(editorState.getCurrentContent()), json: convertToRaw(editorState.getCurrentContent()) };
    }

    const resetContent = () => {
        const originalEditorState = rawContent ? EditorState.createWithContent(convertFromRaw(rawContent), decorator) : createEditorStateFromHTMLAndDecorator(htmlContent, decorator);
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
        editorStateRef.current = newEditorState;
        setEditorState(!newEditorState.getSelection().getHasFocus()
            ? EditorState.moveFocusToEnd(newEditorState)
            : newEditorState
        );
        // setEditorState(newEditorState);
    };

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

        if (!editable) return 'handled';

        if (e.keyCode === 9 /* Tab */) {
            const maxDepth = 4; // Maximum depth of nested lists
            setEditorState(RichUtils.onTab(e, editorState, maxDepth));
            return 'handled';
        }

        const selection = editorStateRef.current.getSelection();
        const contentState = editorStateRef.current.getCurrentContent();
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

        return getDefaultKeyBinding(e);
    };

    return (
        <div className='relative flex justify-center cursor-text' onMouseUp={handleMouseUp}>
            <div className={(editable ? 'border-2 border-stone-300' : 'caret-transparent') + ' overflow-y-auto bg-white max-w-6xl w-full'} ref={editorRef}>
                {editorState.getCurrentContent().hasText() || !editable ? null : (
                    <div className="absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center pointer-events-none">
                        <span className="text-gray-400">Start typing your content here...</span>
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
                    // readOnly={false}
                    customDecorators={[decorator]}
                    customStyleMap={styleMap}
                    handleDrop={editable ? undefined : () => 'handled'}
                    blockRendererFn={blockRendererFn}
                />
            </div>
            <ContextMenu isOpen={contextMenuIsOpen} onClose={() => setContextMenuIsOpen(false)} position={contextMenuPosition}>
                <InlineToolbar />
            </ContextMenu>
        </div>
    );
});

export default RichEditor;
