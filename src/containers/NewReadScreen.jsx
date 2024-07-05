import React, { useState } from 'react';
import SplitPane from 'react-split-pane';
import ArticleRead from '../components/ArticleRead';
import ReadControls from './ReadControls';
import LinkModal from '../components/LinkModal';

import { Editor, EditorState, RichUtils, ContentState, convertFromHTML } from 'draft-js';
import 'draft-js/dist/Draft.css';
import MyEditor from '../components/MyEditor';
import QuillEditor from '../components/QuillEditor';
import OtherEditor from '../components/OtherEditor';

const NewReadScreen = ({ article, allTags, onEditClicked, onLinkClicked, syncWithDB }) => {
  const [paneSize, setPaneSize] = useState('70%');


  const handleResize = (size) => {
    setPaneSize(size);
  };




  return (
    // <OtherEditor></OtherEditor>
    <MyEditor></MyEditor>
    // <QuillEditor></QuillEditor>
  );

  // return (
  //   <div>
  //     <button onClick={addContent}>Add Content</button>
  //     <button onClick={handleInsertLink}>Insert Link</button>
  //     <div className="editor">
  //       <Editor editorState={editorState} onChange={setEditorState} />
  //     </div>
  //   </div>
  // );
};

// return (
//   <SplitPane
//     split="vertical"
//     defaultSize={paneSize}
//     minSize={400}
//     maxSize={-200}
//     onChange={handleResize}
//     style={{
//       // padding: '10px', top: 0,
//       position: 'absolute',
//       left: 0,
//       overflow: 'hidden',
//       height: '100%'
//     }}
//     paneStyle={{ overflow: 'auto' }}
//     resizerStyle={{ background: '#6b6969', cursor: 'col-resize', width: '12px' }}
//   >
//     <div>
//       <ArticleRead article={article} onEditClicked={onEditClicked} onLinkClicked={onLinkClicked}></ArticleRead>
//     </div>
//     <div>
//       <ReadControls allTags={allTags} article={article} syncWithDB={syncWithDB}></ReadControls>
//     </div>
//   </SplitPane>
// );
// };

export default NewReadScreen;
