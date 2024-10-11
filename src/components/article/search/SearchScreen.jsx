import React, { useRef } from 'react';
import SplitPane from 'react-split-pane';

import SearchResults from './SearchResults.jsx';
import SearchControls from './SearchControls.jsx';

const SearchScreen = () => {

  const searchResultsRef = useRef();

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
      minSize={300}
      maxSize={600}
      size={'30%'}
      style={{
        position: 'absolute',
        left: 0,
        overflow: 'hidden',
        height: '100%'
      }}
      paneStyle={{ overflow: 'auto' }}
      resizerStyle={{ background: '#6b6969', cursor: 'col-resize', width: '12px' }}
    >
      <div className='bg-stone-50 h-full'>
        <SearchControls onFilterChanged={handleFilterChanged}></SearchControls>
      </div>
      <div>
        <SearchResults ref={searchResultsRef}></SearchResults>
      </div>
    </SplitPane>
  );
};

export default SearchScreen;
