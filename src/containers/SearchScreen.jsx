import React, { useState, useEffect } from 'react';
import SplitPane from 'react-split-pane';

import { getAllArticles } from '../backend-adapter/BackendAdapter';
import SearchResults from './SearchResults';

const SearchScreen = () => {
  const [paneSize, setPaneSize] = useState('30%');
  const [allArticles, setAllArticles] = useState([]);

  const handleResize = (size) => {
    setPaneSize(size);
  };

  useEffect(() => {
    // Logic to execute after component initialization
    getArticles();
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

  return (
    <SplitPane
      split="vertical"
      defaultSize={paneSize}
      onChange={handleResize}
      paneStyle={{ overflow: 'auto' }}
      resizerStyle={{ background: '#ddd', cursor: 'col-resize', width: '8px' }}
    >
      <div className="bg-gray-200">
        <h2 className="text-lg font-bold text-gray-800 p-4">SEARCH CONTROLS</h2>
      </div>
      <div className="bg-gray-300">
        <SearchResults articles={allArticles}></SearchResults>
      </div>
    </SplitPane>
  );
};

export default SearchScreen;
