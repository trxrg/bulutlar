import React, { useState } from 'react';
import SplitPane from 'react-split-pane';
import ArticleRead from '../components/ArticleRead';
import ReadControls from './ReadControls';

const ReadScreen = ({  article, onEditClicked, onLinkClicked }) => {
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
        <ArticleRead article={article} onEditClicked={onEditClicked} onLinkClicked={onLinkClicked}></ArticleRead>
      </div>
      <div>
        <ReadControls tags={article.tags}></ReadControls>
      </div>
    </SplitPane>
  );
};

export default ReadScreen;
