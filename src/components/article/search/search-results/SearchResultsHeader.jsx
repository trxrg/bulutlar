import React, { useContext } from 'react';
import { SearchContext } from '../../../../store/search-context.jsx';

const SearchResultsHeader = () => {

    const { filteredArticles } = useContext(SearchContext);

    return (
        <div>
            <h3 className='text-xl text-gray-700 py-2 flex justify-center'>{filteredArticles.length + ' articles'}</h3>
        </div>
    );
};

export default SearchResultsHeader;