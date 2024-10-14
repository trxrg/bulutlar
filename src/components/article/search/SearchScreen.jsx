import React, { useRef, useState, useEffect } from 'react';
import SplitPane from 'react-split-pane';

import SearchResults from './SearchResults.jsx';
import SearchControls from './SearchControls.jsx';

const SearchScreen = () => {

  const searchResultsRef = useRef();

  const [containerWidth, setContainerWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      setContainerWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleFilterChanged = (filtering) => {
    try {
      searchResultsRef.current.filter(filtering);
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <SplitPane
      split="vertical"
      minSize={containerWidth * 0.2}
      maxSize={containerWidth * 0.6}
      size={containerWidth * 0.3}
      style={{
        position: 'absolute',
        left: 0,
        overflow: 'hidden',
        height: '100%'
      }}
      paneStyle={{ overflow: 'auto' }}
      resizerStyle={{ background: '#6b6969', cursor: 'col-resize', width: '12px' }}
    >
      <SearchControls onFilterChanged={handleFilterChanged}></SearchControls>
      <SearchResults ref={searchResultsRef}></SearchResults>
    </SplitPane>
  );
};

export default SearchScreen;
