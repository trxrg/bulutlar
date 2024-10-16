import React, { useState, useEffect } from 'react';
import SplitPane from 'react-split-pane';

import SearchResults from './search-results/SearchResults.jsx';
import SearchControls from './SearchControls.jsx';
import SearchContextProvider from '../../../store/search-context.jsx';

const SearchScreen = () => {

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

  return (
    <SearchContextProvider>
      <SplitPane
        split="vertical"
        minSize={containerWidth * 0.2}
        maxSize={containerWidth * 0.6}
        size={containerWidth * 0.3}
        paneStyle={{ overflow: 'auto' }}
        resizerStyle={{ background: '#6b6969', cursor: 'col-resize', width: '12px' }}
      >
        <SearchControls></SearchControls>
        <SearchResults></SearchResults>
      </SplitPane>
    </SearchContextProvider>
  );
};

export default SearchScreen;
