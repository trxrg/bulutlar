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

    console.log('htmlContent prop:')
    console.log(htmlContent)

    const [editorState, setEditorState] = useState(() => createEditorStateFromHTML(htmlContent));
    const [isLinkModalOpen, setLinkModalOpen] = useState(false);

    // Function to log the content of the current selection
    const logSelectionContent = () => {
        const selectionState = editorState.getSelection();
        const currentContent = editorState.getCurrentContent();
        const startKey = selectionState.getStartKey();
        const endKey = selectionState.getEndKey();
        const startOffset = selectionState.getStartOffset();
        const endOffset = selectionState.getEndOffset();

        // Retrieve text within the selection range
        let selectedText = '';
        if (startKey === endKey) {
            // If startKey and endKey are the same, selection is within the same block
            const blockText = currentContent.getBlockForKey(startKey).getText();
            selectedText = blockText.slice(startOffset, endOffset);
        } else {
            // Selection spans multiple blocks
            const startBlockText = currentContent.getBlockForKey(startKey).getText();
            const endBlockText = currentContent.getBlockForKey(endKey).getText();

            // Combine text from multiple blocks
            selectedText += startBlockText.slice(startOffset) + '\n'; // Append text from start block
            for (let blockKey = startKey; blockKey !== endKey; blockKey = currentContent.getKeyAfter(blockKey)) {
                const blockText = currentContent.getBlockForKey(blockKey).getText();
                selectedText += blockText + '\n'; // Append full text of blocks in between
            }
            selectedText += endBlockText.slice(0, endOffset); // Append text from end block
        }

        console.log('Selected Text:', selectedText);
    };

    const toggleInlineStyle = (style) => {
        // logSelectionContent();
        setEditorState((prevState) => RichUtils.toggleInlineStyle(prevState, style));
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
                    onChange={(newState) => setEditorState(newState)}
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
