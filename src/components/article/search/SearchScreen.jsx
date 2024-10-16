import React from 'react';

import SearchContextProvider from '../../../store/search-context.jsx';
import SearchBody from './SearchBody.jsx';

const SearchScreen = () => {

  return (
    <SearchContextProvider>
      <SearchBody/>
    </SearchContextProvider>
  );
};

export default SearchScreen;
