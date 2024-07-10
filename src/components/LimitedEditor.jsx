import React, { useState } from 'react';
import { Editor, EditorState, RichUtils, CompositeDecorator, Modifier } from 'draft-js';
import { stateToHTML } from 'draft-js-export-html';
import { stateFromHTML } from 'draft-js-import-html';
import AddLinkModal from './AddLinkModal';
import '../styles.css'

const LimitedEditor = React.forwardRef(({ htmlContent }, ref) => {

    const handleRightClick = (e) => {
        console.log('handlecontextmenu');
        e.preventDefault(); // Prevent default context menu
        const selection = editorState.getSelection();
        const currentContent = editorState.getCurrentContent();
        const startKey = selection.getStartKey();
        const startOffset = selection.getStartOffset();
        const block = currentContent.getBlockForKey(startKey);
        const entityKey = block.getEntityAt(startOffset);

        setShowContextMenu(true);
        // setContextMenuPosition({ x: e.clientX, y: e.clientY });

        console.log(e.clientX)
        console.log(e.clientY)
        
        if (entityKey) {
            const entity = currentContent.getEntity(entityKey);
            if (entity && entity.getType() === 'LINK') {
                // Show custom context menu
                setShowContextMenu(true);
                setContextMenuPosition({ x: e.clientX, y: e.clientY });
            }
        }
    };

    const handleRemoveLink = () => {
        const selection = editorState.getSelection();
        if (!selection.isCollapsed()) {
            const contentState = editorState.getCurrentContent();
            const newContentState = Modifier.applyEntity(
                contentState,
                selection,
                null
            );

            const newEditorState = EditorState.push(
                editorState,
                newContentState,
                'apply-entity'
            );

            setEditorState(EditorState.forceSelection(newEditorState, newContentState.getSelectionAfter()));
            setShowContextMenu(false); // Hide context menu after removing link
        }
    };

    const Link = ({ contentState, entityKey, children }) => {
        const { url } = contentState.getEntity(entityKey).getData();
        const onClick = () => {
            console.log('link clicked url: ' + url);
        };

        const onContextMenu = (e) => {
            console.log('on context menu: ' + url);
            handleRightClick(e);
            console.log('offfff context menu: ' + url);
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
                contentState.getEntity(entityKey).getType() === 'LINK'
            );
        }, callback);
    }

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


    const [editorState, setEditorState] = useState(() => createEditorStateFromHTML(htmlContent));
    const [isLinkModalOpen, setLinkModalOpen] = useState(false);
    const [showContextMenu, setShowContextMenu] = useState(false);
    const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });



    const toggleInlineStyle = (style) => {
        // logSelectionContent();
        setEditorState((prevState) => EditorState.forceSelection(RichUtils.toggleInlineStyle(prevState, style), prevState.getSelection()));
        // editorRef.current.focus();
    };

    const addLink = (url) => {
        const contentState = editorState.getCurrentContent();
        const contentStateWithEntity = contentState.createEntity('LINK', 'MUTABLE', { url });
        const entityKey = contentStateWithEntity.getLastCreatedEntityKey();

        // Apply entity to the selected text
        const newEditorState = RichUtils.toggleLink(
            editorState,
            editorState.getSelection(),
            entityKey
        );

        setEditorState(EditorState.forceSelection(newEditorState, editorState.getSelection()));
    }

    const removeLink = () => {
        const newEditorState = removeLinkEntity(editorState);
        setEditorState(EditorState.forceSelection(newEditorState, newEditorState.getSelection()));
    };

    const removeLinkEntity = (editorState) => {
        const selection = editorState.getSelection();
        if (!selection.isCollapsed()) {
            const contentState = editorState.getCurrentContent();
            const blockKey = selection.getStartKey();
            const startOffset = selection.getStartOffset();
            const block = contentState.getBlockForKey(blockKey);
            const entityKey = block.getEntityAt(startOffset);

            if (entityKey) {
                // Apply null to remove the entity
                const newContentState = Modifier.applyEntity(
                    contentState,
                    selection,
                    null
                );

                // Create a new EditorState with the updated content state
                const newEditorState = EditorState.push(
                    editorState,
                    newContentState,
                    'apply-entity'
                );

                return EditorState.forceSelection(
                    newEditorState,
                    newContentState.getSelectionAfter()
                );
            }
        }

        return editorState;
    };

    const toggleBold = () => {
        toggleInlineStyle('BOLD');
    }

    const toggleUnderline = () => {
        toggleInlineStyle('UNDERLINE');
    }

    React.useImperativeHandle(ref, () => ({
        addLink,
        toggleBold,
        toggleUnderline
    }));

    const convertToHTMLContent = () => {
        const currentContent = editorState.getCurrentContent();
        const html = stateToHTML(currentContent);
        console.log(html); // You can use this HTML content as needed (e.g., save to database, display, etc.)
    };

    const handleKeyCommand = (command) => {
        const newState = RichUtils.handleKeyCommand(editorState, command);
        if (newState) {
            setEditorState(newState);
            return 'handled';
        }
        return 'not-handled';
    };

    const handleEditorChange = (newEditorState) => {
        setEditorState(newEditorState);
        setShowContextMenu(false); // Hide context menu on editor change
    };

    return (
        <div className="mx-auto max-w-3xl mt-6 p-6 border rounded-lg shadow-lg">
            <div className="mb-4 flex items-center">
                <button
                    className="mr-2 px-2 py-1 rounded-md bg-gray-200 hover:bg-gray-300 focus:outline-none"
                    onClick={() => toggleInlineStyle('BOLD')}
                >
                    Bold
                </button>
                <button
                    className="mr-2 px-2 py-1 rounded-md bg-gray-200 hover:bg-gray-300 focus:outline-none"
                    onClick={() => toggleInlineStyle('UNDERLINE')}
                >
                    Underline
                </button>
                {/* Font size and add link buttons */}
                <button
                    className="mr-2 px-2 py-1 rounded-md bg-gray-200 hover:bg-gray-300 focus:outline-none"
                    onClick={() => setLinkModalOpen(true)}
                >
                    Add Link
                </button>
                <button
                    className="mr-2 px-2 py-1 rounded-md bg-gray-200 hover:bg-gray-300 focus:outline-none"
                    onClick={() => removeLink()}
                >
                    Remove Link
                </button>
                <button
                    className="mr-2 px-2 py-1 rounded-md bg-gray-200 hover:bg-gray-300 focus:outline-none"
                    onClick={convertToHTMLContent}
                >
                    Get HTML Content
                </button>
                <button
                    className="mr-2 px-2 py-1 rounded-md bg-gray-200 hover:bg-gray-300 focus:outline-none"
                    onClick={handleRightClick}
                >
                    context menu
                </button>

            </div>
            <div className="bg-white border border-gray-300 p-2 caret-transparent editor-container">
                {showContextMenu && (
                    <div className="context-menu" style={{ top: contextMenuPosition.y, left: contextMenuPosition.x }}>
                        <button onClick={handleRemoveLink}>Remove Link</button>
                    </div>
                )}
                <Editor
                    editorState={editorState}
                    onChange={handleEditorChange}
                    // handleKeyCommand={handleKeyCommand} // what is the purpose of this
                    handleBeforeInput={() => 'handled'}
                    handleReturn={() => 'handled'}
                    handlePastedText={() => 'handled'}
                    readOnly={false}
                    customDecorators={[decorator]}
                    handleDrop={() => 'handled'}
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

export default LimitedEditor;
