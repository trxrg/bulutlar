import React, { useState, useEffect, useRef } from 'react';
import SplitPane from 'react-split-pane';

import { getAllArticles, getAllOwners, getAllTags } from '../backend-adapter/BackendAdapter';
import SearchResults from './SearchResults';
import SearchControls from './SearchControls';

const SearchScreen = () => {
  const [paneSize, setPaneSize] = useState('30%');
  const [allArticles, setAllArticles] = useState([]);
  const [articlesLoaded, setArticlesLoaded] = useState(false);
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
    getArticles();
    getOwners();
    getTags();
  }, []);

  const getArticles = async () => {
    try {
      const response = await getAllArticles();
      setAllArticles(response);
      setArticlesLoaded(true);
    } catch (err) {
      console.error(err);
    }
  }

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
      onChange={handleResize}
      paneStyle={{ overflow: 'auto' }}
      resizerStyle={{ background: '#ddd', cursor: 'col-resize', width: '8px' }}
    >
      <div className="bg-gray-200">
        {ownersLoaded && tagsLoaded ? <SearchControls tags={tags} owners={owners} onFilterChanged={handleFilterChanged}></SearchControls> : "Loading..."}
      </div>
      <div className="bg-gray-300">
        {articlesLoaded ? <SearchResults ref={searchResultsRef} articles={allArticles}></SearchResults> : "Loading..."}
      </div>
    </SplitPane>
  );
};

export default SearchScreen;
