import React, { useState } from 'react';
import SplitPane from 'react-split-pane';
import ReadControls from './ReadControls';
import ReadContent from '../components/ReadContent';

const NewReadScreen = ({ article, allTags, onEditClicked, onLinkClicked, syncWithDB }) => {
  const [paneSize, setPaneSize] = useState('70%');


  const handleResize = (size) => {
    setPaneSize(size);
  };

  return (
    <SplitPane
      split="vertical"
      defaultSize={paneSize}
      minSize={400}
      maxSize={-200}
      onChange={handleResize}
      style={{
        // padding: '10px', top: 0,
        position: 'absolute',
        left: 0,
        overflow: 'hidden',
        height: '100%'
      }}
      paneStyle={{ overflow: 'auto' }}
      resizerStyle={{ background: '#6b6969', cursor: 'col-resize', width: '12px' }}
    >
      <div>
        <ReadContent article={article} onEditClicked={onEditClicked} onLinkClicked={onLinkClicked}></ReadContent>
      </div>
      <div>
        <ReadControls allTags={allTags} article={article} syncWithDB={syncWithDB}></ReadControls>
      </div>
    </SplitPane>
  );
};

export default NewReadScreen;
