import React, { useState, useRef } from 'react';
import SplitPane from 'react-split-pane';

import SearchResults from './SearchResults';
import SearchControls from './SearchControls';

const SearchScreen = ({ handleSearchResultClicked, allArticles, allOwners, allOwnersLoaded, allTags, allTagsLoaded }) => {
  const [paneSize, setPaneSize] = useState('30%');

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
      minSize={400}
      maxSize={600}
      onChange={handleResize}
      style={{
        padding: '10px', top: 0,
        position: 'absolute',
        left: 0,
        overflow: 'hidden',
        height: '100%'
      }}
      paneStyle={{ overflow: 'auto' }}
      resizerStyle={{ background: '#6b6969', cursor: 'col-resize', width: '12px' }}
    >
      <div>
        {allOwnersLoaded && allTagsLoaded ? <SearchControls tagNames={allTags.map(tag=>tag.name)} ownerNames={allOwners.map(owner=>owner.name)} onFilterChanged={handleFilterChanged}></SearchControls> : "Loading..."}
      </div>
      <div>
        <SearchResults ref={searchResultsRef} articles={allArticles} handleClick={handleSearchResultClicked}></SearchResults>
      </div>
    </SplitPane>
  );
};

export default SearchScreen;
