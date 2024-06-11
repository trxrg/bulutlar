import React, { useState } from 'react';
import SplitPane from 'react-split-pane';

const Sketch = () => {
  const [paneSize, setPaneSize] = useState('50%');

  const handleResize = (size) => {
    setPaneSize(size);
  };

  return (
    <SplitPane
      split="vertical"
      defaultSize={paneSize}
      onChange={handleResize}
      paneStyle={{ overflow: 'auto' }}
      resizerStyle={{ background: '#ddd', cursor: 'col-resize', width: '8px' }}
    >
      <div className="bg-gray-200">
        <h2 className="text-lg font-bold text-gray-800 p-4">Left Pane</h2>
      </div>
      <div className="bg-gray-300">
        <h2 className="text-lg font-bold text-gray-800 p-4">Right Pane</h2>
      </div>
    </SplitPane>
  );
};

export default Sketch;
