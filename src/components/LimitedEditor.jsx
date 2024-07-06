import React, { useState, useRef } from 'react';
import { Editor, EditorState, RichUtils, ContentState, convertFromHTML, CompositeDecorator, convertToRaw, convertFromRaw, Modifier, SelectionState } from 'draft-js';
import { stateToHTML } from 'draft-js-export-html';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import '../styles.css';

// Function to convert HTML to Draft.js ContentState
const createEditorStateFromHTML = (html) => {
    if (!html) return EditorState.createEmpty(); // Handle case where html is empty

    const blocksFromHTML = convertFromHTML(html);
    const contentState = ContentState.createFromBlockArray(
        blocksFromHTML.contentBlocks,
        blocksFromHTML.entityMap
    );

    return EditorState.createWithContent(contentState);
};




// Modal component for adding links
const AddLinkModal = ({ isOpen, onClose, onAddLink }) => {
    const [linkUrl, setLinkUrl] = useState('');

    const handleAddLink = () => {
        onAddLink(linkUrl);
        setLinkUrl('');
        onClose();
    };

    return (
        <div className={`fixed z-10 inset-0 overflow-y-auto ${isOpen ? 'block' : 'hidden'}`}>
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                    <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                </div>
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start">
                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                <h3 className="text-lg leading-6 font-medium text-gray-900">Add Link</h3>
                                <div className="mt-2">
                                    <input
                                        type="text"
                                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                        placeholder="Enter URL"
                                        value={linkUrl}
                                        onChange={(e) => setLinkUrl(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <button
                            type="button"
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                            onClick={handleAddLink}
                        >
                            Add Link
                        </button>
                        <button
                            type="button"
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Main DraftEditor component
const LimitedEditor = ({ htmlContent }) => {

    console.log('htmlContent')
    console.log(htmlContent)

    // const [initialContent, setInitialContent] = useState('<p>hello world</p>');

    const [editorState, setEditorState] = useState(() => createEditorStateFromHTML(htmlContent));
    const [isLinkModalOpen, setLinkModalOpen] = useState(false);
    // const editorRef = useRef(null);

    const Link = ({ contentState, entityKey, children }) => {
        const { url } = contentState.getEntity(entityKey).getData();
        const onClick = () => {
            console.log('link clicked');
            // window.open(url, '_blank'); // Open link in a new tab
        };

        return (
            <span className="bg-red-800" onClick={onClick}>
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




    const handleKeyCommand = (command) => {
        const newState = RichUtils.handleKeyCommand(editorState, command);
        if (newState) {
            setEditorState(newState);
            return 'handled';
        }
        return 'not-handled';
    };

    const toggleInlineStyle = (style) => {
        setEditorState(RichUtils.toggleInlineStyle(editorState, style));
    };

    const toggleFontSize = (fontSize) => {
        // Implement font size toggle logic here if needed
    };

    const addLink = (url) => {
        // const contentState = editorState.getCurrentContent();
        // const contentStateWithEntity = contentState.createEntity('LINK', 'MUTABLE', { url });
        // const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
        // console.log('entitykey in addLink: ' + entityKey);
        // const newEditorState = EditorState.set(editorState, { currentContent: contentStateWithEntity });

        // setEditorState(RichUtils.toggleLink(
        //     newEditorState,
        //     newEditorState.getSelection(),
        //     entityKey
        // ));

        generateLink(url, 'displayText');

    }

    const generateLink = (hyperLink, linkDisplayText) => {
        let link = hyperLink;
        
        // if (!hyperlink.includes('http://')) {
        //     if (!hyperlink.includes('https://')) {
        //         link = http://${hyperLink}`;
        //     }
        // }
        
        // Get the content that already present in editor to append new content into it 
        const currentContent = editorState.getCurrentContent();
        // Creating Link entity
        currentContent.createEntity('LINK', 'MUTABLE', {
            url: link,
            target: '_blank',
        });

        const entityKey = currentContent.getLastCreatedEntityKey();
        // Get the selected text it'll used to override the text 
        const selection = editorState.getSelection();
        // Add new text or override the selection text that user selects 
        const textWithEntity = Modifier.replaceText(
            currentContent,
            selection,
            linkDisplayText,
            editorState.getCurrentInlineStyle(),
            entityKey,
        );
        const newState = EditorState.createWithContent(textWithEntity, decorator);
        setEditorState(newState);
    };

    const convertToHTMLContent = () => {
        const currentContent = editorState.getCurrentContent();
        const html = stateToHTML(currentContent);
        console.log(html); // You can use this HTML content as needed (e.g., save to database, display, etc.)
    };

    // Function to prevent modification of editor content
    const handleBeforeInput = () => 'handled';

    const handleReturn = () => 'handled';

    const handlePastedText = (text, html, editorState) => {
        // Example: Prevent pasting content
        return 'handled';
    };


    const CustomLink = ({ contentState, entityKey, children }) => {
        const { url } = contentState.getEntity(entityKey).getData();
        return (
            <a href={url + 'additions'} className="text-blue-600 underline hover:text-blue-800">
                {children}
            </a>
        );
    };

    const blockRendererFn = (contentBlock) => {
        const type = contentBlock.getType();
        switch (type) {
            case 'atomic':
                return {
                    component: () => null,
                    editable: false,
                };
            default:
                return null;
        }
    };

    const blockStyleFn = (contentBlock) => {

        return '';
    };


    // Custom onChange handler to prevent direct modification
    const handleEditorChange = (newState) => {
        // if (!editorState.getSelection().isCollapsed()) {
        //     setEditorState(editorState);
        //     return;
        // }
        setEditorState(newState);
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
                    blockRendererFn={blockRendererFn}
                    // blockStyleFn={blockStyleFn}
                    readOnly={false}
                    customDecorators={[decorator]}
                // ref={editorRef}
                />
            </div>

            <AddLinkModal
                isOpen={isLinkModalOpen}
                onClose={() => setLinkModalOpen(false)}
                onAddLink={addLink}
            />
        </div>
    );
};

export default LimitedEditor;
