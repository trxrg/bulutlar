import React, { useState, useRef, useContext } from 'react';
import SplitPane from 'react-split-pane';

import SearchResults from './SearchResults.jsx';
import SearchControls from './SearchControls.jsx';
import { AppContext } from '../../store/app-context.jsx'

const SearchScreen = () => {

  const { allOwnersLoaded, allTagsLoaded } = useContext(AppContext);

  const [paneSize, setPaneSize] = useState('300');

  const searchResultsRef = useRef();

  const handleResize = (size) => {
    setPaneSize(size);
  };

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
      defaultSize={paneSize}
      minSize={300}
      maxSize={600}
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
