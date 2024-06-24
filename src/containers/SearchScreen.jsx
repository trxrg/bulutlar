import React, { useState, useEffect, useRef } from 'react';
import SplitPane from 'react-split-pane';

import { getAllArticles, getAllOwners, getAllTags } from '../backend-adapter/BackendAdapter';
import SearchResults from './SearchResults';
import SearchControls from './SearchControls';

const SearchScreen = ({ handleSearchResultClicked }) => {
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
    // <div className="parent-container bg-gray-200 p-4 h-screen flex items-center justify-center">
    //   <div className="child-div bg-white p-4 max-w-full max-h-full overflow-auto">
    //     {/* Example content that exceeds the height of child-div */}
    //     <p className="mb-4">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed commodo magna quis metus lacinia, sit amet convallis nunc consequat.</p>
    //     <p className="mb-4">Nulla fermentum velit sed ex suscipit, quis congue magna scelerisque. Vivamus ut libero eget sem finibus faucibus.</p>
    //     <p className="mb-4">Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Integer lobortis metus ac justo viverra efficitur.</p>
    //     <p className="mb-4">Duis vel dui lacinia, aliquet dui et, dapibus purus. Nulla at scelerisque dolor. Vivamus ultricies orci ut magna pretium convallis.</p>
    //     <p className="mb-4">Fusce vel risus a purus gravida semper nec non tortor. Nam scelerisque lorem ac nunc rutrum, ac venenatis felis laoreet.</p>
    //     <p className="mb-4">Proin et lorem non ligula pellentesque vestibulum. Suspendisse potenti. Nullam bibendum ante eu lacus pretium, ac mattis erat tempus.</p>
    //     <p className="mb-4">Fusce vel risus a purus gravida semper nec non tortor. Nam scelerisque lorem ac nunc rutrum, ac venenatis felis laoreet.</p>
    //     <p className="mb-4">Proin et lorem non ligula pellentesque vestibulum. Suspendisse potenti. Nullam bibendum ante eu lacus pretium, ac mattis erat tempus.</p>
    //     <p className="mb-4">Fusce vel risus a purus gravida semper nec non tortor. Nam scelerisque lorem ac nunc rutrum, ac venenatis felis laoreet.</p>
    //     <p className="mb-4">Proin et lorem non ligula pellentesque vestibulum. Suspendisse potenti. Nullam bibendum ante eu lacus pretium, ac mattis erat tempus.</p>
    //     <p className="mb-4">Fusce vel risus a purus gravida semper nec non tortor. Nam scelerisque lorem ac nunc rutrum, ac venenatis felis laoreet.</p>
    //     <p className="mb-4">Proin et lorem non ligula pellentesque vestibulum. Suspendisse potenti. Nullam bibendum ante eu lacus pretium, ac mattis erat tempus.</p>
    //     <p className="mb-4">Fusce vel risus a purus gravida semper nec non tortor. Nam scelerisque lorem ac nunc rutrum, ac venenatis felis laoreet.</p>
    //     <p className="mb-4">Proin et lorem non ligula pellentesque vestibulum. Suspendisse potenti. Nullam bibendum ante eu lacus pretium, ac mattis erat tempus.</p>
    //     <p className="mb-4">Fusce vel risus a purus gravida semper nec non tortor. Nam scelerisque lorem ac nunc rutrum, ac venenatis felis laoreet.</p>
    //     <p className="mb-4">Proin et lorem non ligula pellentesque vestibulum. Suspendisse potenti. Nullam bibendum ante eu lacus pretium, ac mattis erat tempus.</p>
    //   </div>
    // </div>
    // <div className= 'h-full border border-red-500'>
      <SplitPane
        split="vertical"
        defaultSize={paneSize}
        minSize={400}
        maxSize={600}
        onChange={handleResize}
        style={ {padding:'10px', top: 0,
        position: 'absolute',
        left: 0,
        overflow: 'hidden',
        height: '100%'}}
        paneStyle={{overflow: 'auto'}}
        resizerStyle={{ background: 'green', cursor: 'col-resize', width: '12px' }}
      >
        <div className="bg-pink-500">
          {ownersLoaded && tagsLoaded ? <SearchControls tags={tags} owners={owners} onFilterChanged={handleFilterChanged}></SearchControls> : "Loading..."}
        </div>
        <div className="bg-red-300">
          {articlesLoaded ? <SearchResults ref={searchResultsRef} articles={allArticles} handleClick={handleSearchResultClicked}></SearchResults> : "Loading..."}
        </div>
      </SplitPane>
    // </div>
  );
};

export default SearchScreen;
