import React from 'react';

import SearchBody from './SearchBody.jsx';
import SearchHeader from './SearchHeader.jsx';

const SearchScreen = () => {

  return (
      <div className='flex flex-col h-full'>
        <div className="flex-shrink-0">
          <SearchHeader />
        </div>
        <div className="flex-1">
          <SearchBody />
        </div>
      </div>
  );
};

export default SearchScreen;
