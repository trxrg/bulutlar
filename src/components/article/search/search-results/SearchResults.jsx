import React from 'react';

import BodyWithFixedHeader from '../../../common/BodyWithFixedHeader.jsx';
import SearchResultsHeader from './SearchResultsHeader.jsx';
import SearchResultsBody from './SearchResultsBody.jsx';

const SearchResults = () => {
    return (
        <BodyWithFixedHeader>
            <SearchResultsHeader></SearchResultsHeader>
            <SearchResultsBody></SearchResultsBody>
        </BodyWithFixedHeader>
    );
};

export default SearchResults;
