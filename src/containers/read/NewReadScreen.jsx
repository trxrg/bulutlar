import React, { useState } from 'react';
import SplitPane from 'react-split-pane';
import ReadContent from './ReadContent';
import ReadSidePanel from './ReadSidePanel';

const NewReadScreen = () => {

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
        position: 'absolute',
        left: 0,
        overflow: 'hidden',
        height: '100%'
      }}
      paneStyle={{ overflow: 'auto' }}
      resizerStyle={{ background: '#6b6969', cursor: 'col-resize', width: '12px' }}
    >
      <div>
        <ReadContent></ReadContent>
      </div>
      <div>
        <ReadSidePanel></ReadSidePanel>
      </div>
    </SplitPane>
  );
};

export default NewReadScreen;
