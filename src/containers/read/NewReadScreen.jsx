import React, { useState, useRef } from 'react';
import SplitPane from 'react-split-pane';
import ReadControls from './ReadControls';
import ReadContent from './ReadContent';
import ReadContextProvider from '../../store/read-context';

const NewReadScreen = ({ article }) => {
  const [paneSize, setPaneSize] = useState('70%');

  const readContentRef = useRef();

  const handleResize = (size) => {
    setPaneSize(size);
  };

  const handleAddLink = (url) => {
    console.log('url: ' + url);
    readContentRef.current.addLink(url);
  }

  const handleToggleBold = () => {
    readContentRef.current.toggleBold();
  }

  const handleToggleUnderline = () => {
    readContentRef.current.toggleUnderline();
  }

  // const saveArticle = async () => {
  //   const result = await updateArticle(article.id, {
  //     title: article.title,
  //     date: article.date,
  //     explanation: readContentRef.current.getExplanation(),
  //     text: readContentRef.current.getMainText(),
  //     owner: { name: article.owner.name },
  //     category: { name: article.category.name },
  //     comments: [{ text: readContentRef.current.getComment() }],
  //     tags: article.tags
  //   });
  //   console.log('article updated:');
  //   console.log(result);
  // }

  return (
    <ReadContextProvider>
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
          <ReadContent article={article} ref={readContentRef}></ReadContent>
        </div>
        <div>
          <ReadControls article={article} onAddLink={handleAddLink} onToggleBold={handleToggleBold} onToggleUnderline={handleToggleUnderline}></ReadControls>
        </div>
      </SplitPane>
    </ReadContextProvider>
  );
};

export default NewReadScreen;
