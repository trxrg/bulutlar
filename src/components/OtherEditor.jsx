import React, { useState } from 'react';
import { Editor, EditorState, ContentState, convertFromHTML, RichUtils, convertToRaw, convertFromRaw } from 'draft-js';
import { stateToHTML } from 'draft-js-export-html';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';

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
const OtherEditor = () => {
    const [editorState, setEditorState] = useState(() => createEditorStateFromHTML('<p>hello</p>'));
    const [isLinkModalOpen, setLinkModalOpen] = useState(false);

    const handleKeyCommand = (command) => {
        const newState = RichUtils.handleKeyCommand(editorState, command);
        if (newState) {
            setEditorState(newState);
            return 'handled';
        }
        return 'not-handled';
    };

    const blockRendererFn = (contentBlock) => {
        const type = contentBlock.getType();
        if (type === 'atomic') {
            return {
                component: () => null, // Render nothing for atomic blocks (like images)
                editable: false,
            };
        }
        return null;
    };

    // Function to prevent modification of editor content
    const handleBeforeInput = () => 'handled';

    const handleReturn = () => 'handled';

    const toggleInlineStyle = (style) => {
        setEditorState(RichUtils.toggleInlineStyle(editorState, style));
    };

    const toggleFontSize = (fontSize) => {
        // const contentState = editorState.getCurrentContent();
        // const selection = editorState.getSelection();

        // const nextContentState = Object.keys(fontSize.styles).reduce((contentState, style) => {
        //   return Modifier.removeInlineStyle(contentState, selection, style);
        // }, contentState);

        // setEditorState(EditorState.push(editorState, nextContentState, 'change-inline-style'));
    };

    const addLink = (url) => {
        const contentState = editorState.getCurrentContent();
        const contentStateWithEntity = contentState.createEntity('LINK', 'MUTABLE', { url });
        const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
        const newEditorState = EditorState.set(editorState, { currentContent: contentStateWithEntity });

        setEditorState(RichUtils.toggleLink(
            newEditorState,
            newEditorState.getSelection(),
            entityKey
        ));
    };

    const convertToHTMLContent = () => {
        const currentContent = editorState.getCurrentContent();
        const html = stateToHTML(currentContent);
        console.log(html); // You can use this HTML content as needed (e.g., save to database, display, etc.)
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
                <button
                    className="mr-2 px-2 py-1 rounded-md bg-gray-200 hover:bg-gray-300 focus:outline-none"
                    onClick={() => toggleFontSize('16px')}
                >
                    Font Size 16
                </button>
                <button
                    className="mr-2 px-2 py-1 rounded-md bg-gray-200 hover:bg-gray-300 focus:outline-none"
                    onClick={() => toggleFontSize('24px')}
                >
                    Font Size 24
                </button>
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
            <div className="border border-gray-300 p-2">
                <Editor
                    editorState={editorState}
                    onChange={setEditorState}
                    handleBeforeInput={handleBeforeInput}
                    handleReturn={handleReturn}
                    handleKeyCommand={handleKeyCommand}
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

export default OtherEditor;
