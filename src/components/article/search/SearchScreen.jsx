import React from 'react';

import SearchContextProvider from '../../../store/search-context.jsx';
import SearchBody from './SearchBody.jsx';
import SearchHeader from './SearchHeader.jsx';

const SearchScreen = () => {

  return (
    <SearchContextProvider>
      <div className='flex flex-col h-full'>
        <div className="flex-shrink-0">
          <SearchHeader />
        </div>
        <div className="flex-1">
          <SearchBody />
        </div>
      </div>
    </SearchContextProvider>
  );
};

export default SearchScreen;
