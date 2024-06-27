import React, { useState, useEffect, useRef } from 'react';
import SplitPane from 'react-split-pane';

import { getAllOwners, getAllTags } from '../backend-adapter/BackendAdapter';
import SearchResults from './SearchResults';
import SearchControls from './SearchControls';

const SearchScreen = ({ handleSearchResultClicked, allArticles }) => {
  const [paneSize, setPaneSize] = useState('30%');
  const [owners, setOwners] = useState([]);
  const [ownersLoaded, setOwnersLoaded] = useState(false);
  const [tags, setTags] = useState([]);
  const [tagsLoaded, setTagsLoaded] = useState(false);

  const searchResultsRef = useRef();

  const handleResize = (size) => {
    setPaneSize(size);
  };

  useEffect(() => {
    // Logic to execute after component initialization
    getOwners();
    getTags();
  }, []);

  const getOwners = async () => {
    try {
      const response = await getAllOwners();
      setOwners(response.map((owner) => owner.name));
      setOwnersLoaded(true);
    } catch (err) {
      console.error(err);
    }
  }

  const getTags = async () => {
    try {
      const response = await getAllTags();
      setTags(response.map((tag) => tag.name));
      setTagsLoaded(true);
    } catch (err) {
      console.error(err);
    }
  }

  const handleFilterChanged = (filtering) => {
    try {
      searchResultsRef.current.filter(filtering);
    } catch (e) {
      // console.error(e);
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
      resizerStyle={{ background: 'green', cursor: 'col-resize', width: '12px' }}
    >
      <div className="bg-green-500">
        {ownersLoaded && tagsLoaded ? <SearchControls tags={tags} owners={owners} onFilterChanged={handleFilterChanged}></SearchControls> : "Loading..."}
      </div>
      <div className="bg-green-200">
        <SearchResults ref={searchResultsRef} articles={allArticles} handleClick={handleSearchResultClicked}></SearchResults>
      </div>
    </SplitPane>
  );
};

export default SearchScreen;
