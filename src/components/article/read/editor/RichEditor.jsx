import React, { useState, useRef, useContext, useEffect } from 'react';
import {
    Editor, EditorState, RichUtils, AtomicBlockUtils,
    CompositeDecorator, Modifier, SelectionState, convertToRaw,
    convertFromRaw, getDefaultKeyBinding
} from 'draft-js';
import { stateToHTML } from 'draft-js-export-html';
import { stateFromHTML } from 'draft-js-import-html';
import { imageApi, articleApi } from '../../../../backend-adapter/BackendAdapter';
import { ReadContext } from '../../../../store/read-context';
import { AppContext } from '../../../../store/app-context';
import { DBContext } from '../../../../store/db-context';
import Link from './Link';
import Quote from './Quote';
import Image from './Image';
import toastr from 'toastr';
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

const withCustomProps = (Component, customProps) => (props) => (customProps && props) ? (
    <Component {...props} {...customProps} />
) : '';

const createEditorStateFromHTMLAndDecorator = (html, decorator) => {
    if (!html) return EditorState.createEmpty();
    return EditorState.createWithContent(stateFromHTML(html), decorator);
};

const Highlight = (props) => {
    return (
        <span style={{ backgroundColor: '#809671' }}>
            {props.children}
        </span>
    );
};

const RichEditor = React.forwardRef(({ prompt, htmlContent, rawContent, handleContentChange, editable }, ref) => {

    const { setContextMenuIsOpen, setContextMenuPosition, searchTerm, articleId } = useContext(ReadContext);
    const { normalizeText, translate: t } = useContext(AppContext);
    const { fetchAllAnnotations, fetchArticleById } = useContext(DBContext);

    const decorator = new CompositeDecorator([
        {
            strategy: findLinkEntities,
            component: withCustomProps(Link, { onDelete: handleRemoveLink }),
        },
        {
            strategy: findQuoteEntities,
            component: withCustomProps(Quote, { onDelete: handleRemoveQuote }),
        },
        {
            strategy: (contentBlock, callback, contentState) => {
                if (searchTerm) {
                    const normalizedSearchTerm = normalizeText(searchTerm);
                    const regex = new RegExp(normalizedSearchTerm, 'gi');
                    findWithRegex(regex, contentBlock, callback);
                }
            },
            component: Highlight
        },
    ]);

    const [editorState, setEditorState] = useState(rawContent
        ? EditorState.createWithContent(convertFromRaw(rawContent), decorator)
        : createEditorStateFromHTMLAndDecorator(htmlContent, decorator));
    // const [contextMenuIsOpen, setContextMenuIsOpen] = useState(false);
    // const [contextMenuPosition, setContextMenuPosition] = useState({ x: 10, y: 10 });

    const [addedImageIdsWhileEditing, setAddedImageIdsWhileEditing] = useState([]);
    const [deletedImageIdsWhileEditing, setDeletedImageIdsWhileEditing] = useState([]);

    const editorStateRef = useRef(editorState);
    const editorRef = useRef();


    const persist = (newEditorState) => {
        handleContentChange(stateToHTML(newEditorState.getCurrentContent()), convertToRaw(newEditorState.getCurrentContent()));
    };

    function findWithRegex(regex, contentBlock, callback) {
        const text = normalizeText(contentBlock.getText());
        let matchArr, start;
        while ((matchArr = regex.exec(text)) !== null) {
            start = matchArr.index;
            callback(start, start + matchArr[0].length);
        }
    }

    useEffect(() => {
        const contentState = editorState.getCurrentContent();
        const newEditorState = EditorState.createWithContent(contentState, decorator);
        setEditorState(newEditorState);
    }, [searchTerm]);

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

    // ================================ QUOTES ================================
    const getSelectedText = () => {
        const contentState = editorState.getCurrentContent();
        const selectionState = editorState.getSelection();
        const startKey = selectionState.getStartKey();
        const endKey = selectionState.getEndKey();
        const startOffset = selectionState.getStartOffset();
        const endOffset = selectionState.getEndOffset();
        const rawContent = convertToRaw(contentState);
        let selectedText = '';
    
        rawContent.blocks.forEach(block => {
            if (block.key === startKey && block.key === endKey) {
                selectedText = block.text.slice(startOffset, endOffset);
            } else if (block.key === startKey) {
                selectedText = block.text.slice(startOffset) + '\n';
            } else if (block.key === endKey) {
                selectedText += block.text.slice(0, endOffset);
            } else if (selectionState.hasEdgeWithin(block.key, 0, block.text.length)) {
                selectedText += block.text + '\n';
            }
        });
    
        return selectedText;
    };

    const addQuote = async () => {
        if (editorState.getSelection().isCollapsed())
            return;

        const selectedText = getSelectedText();

        if (!selectedText || !selectedText.trim()) return;

        let annotation = {
            note: '', quote: selectedText
        };

        try {
            annotation = await articleApi.addAnnotation(articleId, annotation)

            await fetchAllAnnotations();
            await fetchArticleById(articleId);
            toastr.success(t('quote added'));

        } catch (e) {
            toastr.error(e.message, t('error adding quote'));
            return;
        };

        if (!annotation || !annotation.id ) {
            toastr.error(t('error adding quote'));
            return;
        }

        const contentState = editorState.getCurrentContent();
        const contentStateWithEntity = contentState.createEntity('MYQUOTE', 'MUTABLE', { annotationId: annotation.id });
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

    function findQuoteEntities(contentBlock, callback, contentState) {
        contentBlock.findEntityRanges((character) => {
            const entityKey = character.getEntity();
            return (
                entityKey !== null &&
                contentState.getEntity(entityKey).getType() === 'MYQUOTE'
            );
        }, callback);
    }

    function handleRemoveQuote(blockKey, entityRange) {
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

    // ================================ END OF QUOTES ================================

    // ================================ IMAGES ================================

    const addImage = (image) => {
        setEditorState(editorState => {
            const contentState = editorState.getCurrentContent();
            const contentStateWithEntity = contentState.createEntity('IMAGE', 'IMMUTABLE', image);
            const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
            const newEditorState = EditorState.set(editorState, { currentContent: contentStateWithEntity });
            setAddedImageIdsWhileEditing(addedImageIdsWhileEditing => [...addedImageIdsWhileEditing, image.id]);
            return AtomicBlockUtils.insertAtomicBlock(newEditorState, entityKey, ' ');
        });
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

    const deleteAtomicBlock = (blockKey, imageId) => {
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

        setDeletedImageIdsWhileEditing(deletedImageIdsWhileEditing => [...deletedImageIdsWhileEditing, imageId]);

        // Update the editor state
        setEditorState(finalEditorState);
    };

    // ================================ END OF IMAGES ================================

    const handleMouseUp = (e) => {
        const selection = window.getSelection();
        if (selection.rangeCount > 0 && !selection.isCollapsed) {
            const editorBounds = e.currentTarget.parentElement.parentElement.parentElement.parentElement.parentElement.getBoundingClientRect();
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
        // const currentImageIds = getImages(editorState).map(image => image.id);
        // const originalImageIds = getImages(originalEditorState).map(image => image.id);

        // // find images that are present in the originaleditorstate but not in the current editorState
        // // delete them from the db and the fs as they will be removed from the editor content
        // const imagesToDelete = originalImageIds.filter(id => !currentImageIds.includes(id));
        // imagesToDelete.forEach(imageId => imageApi.deleteById(imageId));

        // delete images (from db) that are deleted while editing
        deletedImageIdsWhileEditing.forEach(imageId => imageApi.deleteById(imageId));
        setAddedImageIdsWhileEditing([]);
        setDeletedImageIdsWhileEditing([]);

        return { html: stateToHTML(editorState.getCurrentContent()), json: convertToRaw(editorState.getCurrentContent()) };
    }

    const resetContent = () => {
        const originalEditorState = rawContent ? EditorState.createWithContent(convertFromRaw(rawContent), decorator) : createEditorStateFromHTMLAndDecorator(htmlContent, decorator);
        // const currentImageIds = getImages(editorState).map(image => image.id);
        // const originalImageIds = getImages(originalEditorState).map(image => image.id);

        // // find images that are present in the current editorstate but not in the originalEditorState
        // // delete them from the db and the fs as they will be removed from the editor content
        // const imagesToDelete = currentImageIds.filter(id => !originalImageIds.includes(id));
        // imagesToDelete.forEach(imageId => imageApi.deleteById(imageId));

        // delete images (from db) that are added while editing
        addedImageIdsWhileEditing.forEach(imageId => imageApi.deleteById(imageId));
        setAddedImageIdsWhileEditing([]);
        setDeletedImageIdsWhileEditing([]);

        setEditorState(originalEditorState);
    }

    React.useImperativeHandle(ref, () => ({
        addLink,
        addQuote,
        addImage,
        getContent,
        resetContent,
        toggleInlineStyle,
        toggleBlockType,
    }));

    const handleEditorChange = (newEditorState) => {
        editorStateRef.current = newEditorState;
        // setEditorState(!newEditorState.getSelection().getHasFocus()
        //     ? EditorState.moveFocusToEnd(newEditorState)
        //     : newEditorState
        // );

        // setEditorState(!newEditorState.getSelection().getHasFocus()
        //     ? EditorState.moveSelectionToEnd(newEditorState)
        //     : newEditorState
        // );

        setEditorState(newEditorState);
        // setEditorState(EditorState.forceSelection(newEditorState, editorState.getSelection()));
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
                            onDelete: (imageId) => deleteAtomicBlock(contentBlock.getKey(), imageId),
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

        if (!editable && !((e.metaKey || e.ctrlKey) && e.key === 'c')) return 'handled';

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
            <div className={(editable ? 'border-2 border-stone-300' : 'caret-transparent') + ' overflow-y-auto max-w-6xl w-full'} ref={editorRef}>
                {editorState.getCurrentContent().hasText() || !editable ? null : (
                    <div className="absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center pointer-events-none">
                        <span className="text-gray-400">{prompt}</span>
                    </div>
                )}
                <Editor
                    editorState={editorState}
                    onChange={handleEditorChange}
                    handleKeyCommand={editable ? undefined : () => 'handled'} // backspace enter etc.
                    keyBindingFn={keyBindingFn}
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
            {/* <ContextMenu isOpen={contextMenuIsOpen} onClose={() => setContextMenuIsOpen(false)} position={contextMenuPosition}>
                <InlineToolbar />
            </ContextMenu> */}
        </div>
    );
});

export default RichEditor;
