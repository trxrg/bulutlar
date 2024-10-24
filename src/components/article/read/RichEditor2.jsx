import React, { useState } from 'react';
import { Editor, EditorState, AtomicBlockUtils } from 'draft-js';
import { ResizableBox } from 'react-resizable';
import Draggable from 'react-draggable';
import { stateFromHTML } from 'draft-js-import-html';
import 'draft-js/dist/Draft.css';
import 'react-resizable/css/styles.css';

// Function to add an image entity to the editor state
const addImage = (editorState, url) => {
    const contentState = editorState.getCurrentContent();
    const contentStateWithEntity = contentState.createEntity('IMAGE', 'IMMUTABLE', { src: url });
    const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
    const newEditorState = AtomicBlockUtils.insertAtomicBlock(editorState, entityKey, ' ');
    return EditorState.forceSelection(newEditorState, newEditorState.getCurrentContent().getSelectionAfter());
};

// Custom component to render the image entity
const ImageComponent = (props) => {
    const { block, contentState } = props;
    const entity = contentState.getEntity(block.getEntityAt(0));
    const { src } = entity.getData();
    const [dimensions, setDimensions] = useState({ width: 200, height: 'auto' });

    const onResize = (event, { size }) => {
        console.log(size);
        if (size.width > 800) {
            console.log('width > 800');
            return;
        }
        setDimensions({
            width: Math.min(size.width, 800),
            height: 'auto',
        });
    };

    return (
        // <Draggable>
            <div style={{ display: 'inline-block', margin: '0 10px 10px 0', position: 'relative' }}>
                <ResizableBox
                max-width={800}
                    width={dimensions.width}
                    height={dimensions.height}
                    onResize={onResize}
                    resizeHandles={['se', 'sw', 'ne', 'nw', 'n', 's', 'e', 'w']}
                    style={{ width: dimensions.width }}
                >
                    <img src={src} alt="Editor Image" style={{ width: '100%', height: 'auto' }} />
                </ResizableBox>
            </div>
        // </Draggable>
    );
};

// Custom block renderer function
const blockRendererFn = (block) => {
    if (block.getType() === 'atomic') {
        return {
            component: ImageComponent,
            editable: false,
        };
    }
    return null;
};

// Main RichEditor component
const RichEditor2 = () => {
    const contentState = stateFromHTML("<p>The ocean covers over 70% of our planet, yet much of it remains uncharted and unexplored. From vibrant coral reefs teeming with life to the dark abyss where unique creatures thrive, the ocean is a treasure trove of biodiversity. Scientists estimate that more than 90% of marine species are still undiscovered, highlighting the importance of ocean conservation. As we delve deeper, we uncover secrets that could change our understanding of biology and ecology.</p>");
    const [editorState, setEditorState] = useState(EditorState.createWithContent(contentState));

    const handleEditorChange = (newEditorState) => {
        setEditorState(newEditorState);
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const url = e.target.result;
                const newEditorState = addImage(editorState, url);
                setEditorState(newEditorState);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="mx-auto flex justify-center w-full max-w-4xl">
            <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="bg-blue-500"
            />
            <div className="relative w-full max-w-4xl">
                <Editor
                    editorState={editorState}
                    onChange={handleEditorChange}
                    blockRendererFn={blockRendererFn}
                />
            </div>
        </div>
    );
};

export default RichEditor2;