import React, { useState, useEffect, useRef } from 'react';
import SplitPane from 'react-split-pane';

import { getAllArticles, getAllOwners } from '../backend-adapter/BackendAdapter';
import SearchResults from './SearchResults';
import SearchControls from './SearchControls';

const SearchScreen = () => {
  const [paneSize, setPaneSize] = useState('30%');
  const [allArticles, setAllArticles] = useState([]);
  const [owners, setOwners] = useState([]);

  const searchResultsRef = useRef();

  const handleResize = (size) => {
    setPaneSize(size);
  };

  useEffect(() => {
    // Logic to execute after component initialization
    getArticles();
    getOwners();
    console.log('SearchScreen initialized');
  }, []);


  const getArticles = async () => {
    try {
      const response = await getAllArticles();
      setAllArticles(response);
    } catch (err) {
      console.error(err);
    }
  }

  const getOwners = async () => {
    try {
      const response = await getAllOwners();
      setOwners(response.map((owner) => owner.name));
    } catch (err) {
      console.error(err);
    }
  }

  const handleFilterChanged = (filtering) => {
    searchResultsRef.current.filter(filtering);
  }

  return (
    <SplitPane
      split="vertical"
      defaultSize={paneSize}
      onChange={handleResize}
      paneStyle={{ overflow: 'auto' }}
      resizerStyle={{ background: '#ddd', cursor: 'col-resize', width: '8px' }}
    >
      <div className="bg-gray-200">
        <SearchControls owners={owners} onFilterChanged={handleFilterChanged}></SearchControls>
      </div>
      <div className="bg-gray-300">
        <SearchResults ref={searchResultsRef} allArticles={allArticles}></SearchResults>
      </div>
    </SplitPane>
  );
};

export default SearchScreen;
