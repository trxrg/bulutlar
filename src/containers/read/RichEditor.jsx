import React, { useState, useEffect } from 'react';
import { Editor, EditorState, RichUtils, CompositeDecorator, Modifier, SelectionState, convertToRaw, convertFromRaw } from 'draft-js';
import { stateToHTML } from 'draft-js-export-html';
import { stateFromHTML } from 'draft-js-import-html';
import AddLinkModal from '../../components/AddLinkModal';
import '../../styles.css'


const RichEditor = React.forwardRef(({ htmlContent, rawContent, handleContentChange }, ref) => {

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

    // const [editorState, setEditorState] = useState(() => createEditorStateFromHTML(htmlContent));
    const [editorState, setEditorState] = useState(rawContent ? EditorState.createWithContent(convertFromRaw(rawContent), decorator) : createEditorStateFromHTML(htmlContent));
    const [isLinkModalOpen, setLinkModalOpen] = useState(false);
    const [showContextMenu, setShowContextMenu] = useState(false);
    const [contextMenuPosition, setContextMenuPosition] = useState({ x: 10, y: 10 });

    const [htmlContentState, setHtmlContentState] = useState(htmlContent);
    const [rawContentState, setRawContentState] = useState(rawContent);

    useEffect(() => {
        setHtmlContentState(stateToHTML(editorState.getCurrentContent()));
        setRawContentState(convertToRaw(editorState.getCurrentContent()));
    }, [editorState]);

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
        // logSelectionContent();

        console.log('raw content');
        console.log(convertToRaw(editorState.getCurrentContent()));

        setEditorState((prevState) => {
            const newEditorState = EditorState.forceSelection(RichUtils.toggleInlineStyle(prevState, style), prevState.getSelection());
            handleContentChange(stateToHTML(newEditorState.getCurrentContent()), convertToRaw(newEditorState.getCurrentContent()));
            return newEditorState;
        }
        );

        // editorRef.current.focus();
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

    const toggleBold = () => {
        toggleInlineStyle('BOLD');
    }

    const toggleUnderline = () => {
        toggleInlineStyle('UNDERLINE');
    }

    const toggleHighlight = () => {
        toggleInlineStyle('HIGHLIGHT');
    }

    const convertToHTMLContent = () => {
        const currentContent = editorState.getCurrentContent();
        const html = stateToHTML(currentContent);
        console.log(html); // You can use this HTML content as needed (e.g., save to database, display, etc.)
    };

    const getHtmlContent = () => {
        return htmlContentState;
    }

    const getRawContent = () => {
        return rawContentState;
    }

    React.useImperativeHandle(ref, () => ({
        addLink,
        toggleBold,
        toggleUnderline,
        toggleHighlight,
        getHtmlContent,
        getRawContent
    }));

    const handleKeyCommand = (command) => {
        console.log('in handle key command')
        setShowContextMenu(false);
        const newState = RichUtils.handleKeyCommand(editorState, command);
        if (newState) {
            setEditorState(newState);
            return 'handled';
        }
        return 'not-handled';
    };

    const handleEditorChange = (newEditorState) => {
        setEditorState(newEditorState);
        // setShowContextMenu(false);
    };

    const handleEditorClick = () => {
        setShowContextMenu(false);
    }

    return (
        <div className="mx-auto max-w-3xl">
            <div onClick={handleEditorClick} className="caret-transparent relative">
                {showContextMenu && (
                    <div className="context-menu" style={{ top: contextMenuPosition.y, left: contextMenuPosition.x }}>
                        <button onClick={handleRemoveLink} className='hover:bg-red-300'>Remove Link</button>
                    </div>
                )}
                <Editor
                    editorState={editorState}
                    onChange={handleEditorChange}
                    handleKeyCommand={handleKeyCommand} // what is the purpose of this
                    handleBeforeInput={() => 'handled'}
                    handleReturn={() => 'handled'}
                    handlePastedText={() => 'handled'}
                    readOnly={false}
                    customDecorators={[decorator]}
                    customStyleMap={styleMap}
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

export default RichEditor;
