import React, { useState } from 'react';

import ArticleShort from '../components/ArticleShort';

const SearchResults = React.forwardRef(({ handleClick, allArticles }, ref) => {

    const[filteredArticles, setFilteredArticles] = useState([...allArticles]);

    React.useImperativeHandle(ref, () => ({
        filter
    }));

    const filter = (filtering) => {
        applyFiltering(allArticles, filtering);
    }

    const applyFiltering = (allArticles, filtering) => {
        if (filtering.owners.length)
            setFilteredArticles(allArticles.filter(art => filtering.owners.includes(art.owner.name)));
        else
            setFilteredArticles(allArticles);
    }

    return (
        <div>
            {filteredArticles.map(art => <ArticleShort handleClick={handleClick} key={art.id} article={art}></ArticleShort>)}
        </div>
    );
});

export default SearchResults;
