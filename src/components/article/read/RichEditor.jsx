import React, { useState } from 'react';
import { Editor, EditorState, RichUtils, CompositeDecorator, Modifier, SelectionState, convertToRaw, convertFromRaw } from 'draft-js';
import { stateToHTML } from 'draft-js-export-html';
import { stateFromHTML } from 'draft-js-import-html';
import AddLinkModal from '../../common/AddLinkModal';
import '../../../styles.css'

const RichEditor = React.forwardRef(({ name, htmlContent, rawContent, handleContentChange, editable }, ref) => {

    const [rightClickedBlockKey, setRightClickedBlockKey] = useState();
    const [rightClickedEntityKey, setRightClickedEntityKey] = useState();

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

    const decorator = new CompositeDecorator([
        {
            strategy: findLinkEntities,
            component: Link,
        }
    ]);

    const createEditorStateFromHTML = (html) => {
        if (!html) return EditorState.createEmpty();

        const contentState = stateFromHTML(html);

        return EditorState.createWithContent(contentState, decorator);
    };

    const [editorState, setEditorState] = useState(rawContent ? EditorState.createWithContent(convertFromRaw(rawContent), decorator) : createEditorStateFromHTML(htmlContent));
    const [isLinkModalOpen, setLinkModalOpen] = useState(false);
    const [showContextMenu, setShowContextMenu] = useState(false);
    const [contextMenuPosition, setContextMenuPosition] = useState({ x: 10, y: 10 });

    const handleRightClick = (e, blockKey, entityKey) => {
        e.preventDefault(); // Prevent default context menu        

        const grandParentRect = e.currentTarget.parentElement.getBoundingClientRect();

        const posx = e.clientX - grandParentRect.left;
        const posy = e.clientY - grandParentRect.top;

        setRightClickedBlockKey(blockKey);
        setRightClickedEntityKey(entityKey);
        setShowContextMenu(true);
        setContextMenuPosition({ x: posx, y: posy });
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

    const getContent = () => ({html: stateToHTML(editorState.getCurrentContent()), json: convertToRaw(editorState.getCurrentContent())});
    const resetContent = () => (setEditorState(rawContent ? EditorState.createWithContent(convertFromRaw(rawContent), decorator) : createEditorStateFromHTML(htmlContent)));

    React.useImperativeHandle(ref, () => ({
        addLink,
        getContent,
        resetContent,
        toggleInlineStyle,
    }));

    const handleEditorChange = (newEditorState) => {
        setEditorState(newEditorState);
        // setShowContextMenu(false);
    };

    const handleEditorClick = () => {
        setShowContextMenu(false);
    }

    return (
        <div className="mx-auto flex justify-center w-full">
            <div onClick={handleEditorClick} className={(editable ? 'border-2 border-stone-300 bg-white ' : 'caret-transparent ') + 'relative w-full max-w-4xl'}>
                {showContextMenu && (
                    <div className="context-menu" style={{ top: contextMenuPosition.y, left: contextMenuPosition.x }}>
                        <button onClick={handleRemoveLink} className='hover:bg-red-300'>Remove Link</button>
                    </div>
                )}
                <Editor
                    editorState={editorState}
                    onChange={handleEditorChange}
                    handleKeyCommand={editable ? undefined : () => 'handled'} // backspace enter etc.
                    handleBeforeInput={editable ? undefined : () => 'handled'}
                    handleReturn={editable ? undefined : () => 'handled'}
                    handlePastedText={editable ? undefined : () => 'handled'}
                    readOnly={false}
                    customDecorators={[decorator]}
                    customStyleMap={styleMap}
                    handleDrop={editable ? undefined : () => 'handled'}
                />
            </div>

            <AddLinkModal
                isOpen={isLinkModalOpen}
                onClose={() => setLinkModalOpen(false)}
                onAddLink={addLink}
            />
        </div>
    );
});

export default RichEditor;
