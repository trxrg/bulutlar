import React, { useState, useEffect } from 'react';
import { EditorState, AtomicBlockUtils, ContentState, convertToRaw, Modifier } from 'draft-js';
import Editor from 'draft-js-plugins-editor';
import { Map } from 'immutable';
import 'draft-js/dist/Draft.css';

// Sample content for the editor
const initialText = "This is a sample text to demonstrate the Draft.js editor with an image. You can drag the image within the editor, and it should move accordingly. ";

// Custom image component with drag handlers
const ImageComponent = (props) => {
  const { src } = props.contentState.getEntity(props.block.getEntityAt(0)).getData();

  const handleDragStart = (event) => {
    event.dataTransfer.setData("text/plain", props.block.getKey());
  };

  return (
    <div>
      <img src={src} alt="editor"/>
    </div>
  );
};

// Block renderer function to identify and render atomic blocks for images
const blockRendererFn = (contentBlock) => {
  if (contentBlock.getType() === 'atomic') {
    return {
      component: ImageComponent,
      editable: false,
    };
  }
  return null;
};

const MyEditor = () => {
  const contentState = ContentState.createFromText(initialText);
  const [editorState, setEditorState] = useState(EditorState.createWithContent(contentState));

  const handleEditorChange = (newEditorState) => {
    setEditorState(newEditorState);
  };

  const addImage = (url) => {
    const contentState = editorState.getCurrentContent();
    const contentStateWithEntity = contentState.createEntity('IMAGE', 'IMMUTABLE', { src: url });
    const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
    const newEditorState = AtomicBlockUtils.insertAtomicBlock(editorState, entityKey, ' ');
    setEditorState(newEditorState);
  };

  // Insert an initial image for testing
  const handleAddInitialImage = () => {
    addImage("https://i.pinimg.com/originals/9e/24/f3/9e24f370de74e8d1e351abd4f0ef3b54.png");
  };

  useEffect(() => {
    handleAddInitialImage();
  }, []);

  const handleAddImage = () => {
    // const imageUrl = prompt("Enter image URL");
    // if (imageUrl) {
      addImage("https://i.pinimg.com/originals/9e/24/f3/9e24f370de74e8d1e351abd4f0ef3b54.png");
    // }
  };

  const handleDrop = (event) => {
    event.preventDefault();

    const sourceBlockKey = event.dataTransfer.getData("text/plain");
    const targetBlockKey = editorState.getSelection().getStartKey();

    if (sourceBlockKey && sourceBlockKey !== targetBlockKey) {
      const contentState = editorState.getCurrentContent();
      const blockMap = contentState.getBlockMap();

      const reorderedBlockMap = blockMap
        .delete(sourceBlockKey)
        .toSeq()
        .splice(blockMap.keySeq().indexOf(targetBlockKey), 0, [[sourceBlockKey, blockMap.get(sourceBlockKey)]])
        .toOrderedMap();

      const newContentState = contentState.merge({
        blockMap: reorderedBlockMap,
        selectionAfter: editorState.getSelection(),
      });

      const newEditorState = EditorState.push(editorState, newContentState, 'move-block');
      setEditorState(newEditorState);
    }
  };

  return (
    <div>
      <button onClick={handleAddImage}>Add Image</button>
      <div
        style={{ border: '1px solid #ccc', padding: '10px', minHeight: '200px' }}
        onDrop={handleDrop}
        onDragOver={(event) => event.preventDefault()}
      >
        <Editor
          editorState={editorState}
          onChange={handleEditorChange}
          blockRendererFn={blockRendererFn}
        />
      </div>
      <button
        onClick={() => console.log(JSON.stringify(convertToRaw(editorState.getCurrentContent()), null, 2))}
        style={{ marginTop: '10px' }}
      >
        Log Content State
      </button>
    </div>
  );
};

export default MyEditor;
