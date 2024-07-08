import React, { useState } from 'react';
import { Editor, EditorState, RichUtils, ContentState, convertFromHTML, CompositeDecorator, Modifier } from 'draft-js';
import { stateToHTML } from 'draft-js-export-html';
import AddLinkModal from './AddLinkModal';
import '../styles.css'

const Link = ({ contentState, entityKey, children }) => {
    const { url } = contentState.getEntity(entityKey).getData();
    const onClick = () => {
        console.log('link clicked url: ' + url);
    };

    return (
        <span className="link" onClick={onClick}>
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

// Function to convert HTML to Draft.js ContentState
const createEditorStateFromHTML = (html) => {
    if (!html) return EditorState.createEmpty(); // Handle case where html is empty

    const blocksFromHTML = convertFromHTML(html);
    const contentState = ContentState.createFromBlockArray(
        blocksFromHTML.contentBlocks,
        blocksFromHTML.entityMap
    );

    return EditorState.createWithContent(contentState, decorator);
};

const LimitedEditor = React.forwardRef(({ htmlContent }, ref) => {

    const [editorState, setEditorState] = useState(() => createEditorStateFromHTML(htmlContent));
    const [isLinkModalOpen, setLinkModalOpen] = useState(false);

    

    

    const toggleInlineStyle = (style) => {
        setEditorState(RichUtils.toggleInlineStyle(editorState, style));
    };


    const addLink = (url) => {
        let link = url;

        // Get the content that already present in editor to append new content into it 
        const currentContent = editorState.getCurrentContent();
        // Creating Link entity
        currentContent.createEntity('LINK', 'MUTABLE', {
            url: link,
            target: '_blank',
        });

        const entityKey = currentContent.getLastCreatedEntityKey();
        const selection = editorState.getSelection();
        const textWithEntity = Modifier.applyEntity(
            currentContent,
            selection,
            entityKey
        );

        const newState = EditorState.createWithContent(textWithEntity, decorator);
        setEditorState(newState);
    }

    React.useImperativeHandle(ref, () => ({
        addLink
    }));

    const convertToHTMLContent = () => {
        const currentContent = editorState.getCurrentContent();
        const html = stateToHTML(currentContent);
        console.log(html); // You can use this HTML content as needed (e.g., save to database, display, etc.)
    };

    // Functions to prevent modification of editor content
    const handleBeforeInput = () => 'handled';
    const handleReturn = () => 'handled';
    const handlePastedText = (text, html, editorState) => 'handled';
    const handleEditorChange = (newState) => {
        // prevents changes caused by drag/drop
        if (!editorState.getSelection().isCollapsed()) {
            setEditorState(editorState);
            return;
        }
        setEditorState(newState);
    };
    const handleKeyCommand = (command) => {
        const newState = RichUtils.handleKeyCommand(editorState, command);
        if (newState) {
            setEditorState(newState);
            return 'handled';
        }
        return 'not-handled';
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
                    onClick={convertToHTMLContent}
                >
                    Get HTML Content
                </button>
            </div>
            <div className="bg-white border border-gray-300 p-2 caret-transparent">
                <Editor
                    editorState={editorState}
                    onChange={handleEditorChange}
                    handleKeyCommand={handleKeyCommand}
                    handleBeforeInput={handleBeforeInput}
                    handleReturn={handleReturn}
                    handlePastedText={handlePastedText}
                    readOnly={false}
                    customDecorators={[decorator]}
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
