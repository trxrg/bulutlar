import React, { useState } from 'react';

import ArticleShort from '../components/ArticleShort';

const SearchResults = React.forwardRef(({ handleClick, articles }, ref) => {

    const[filteredArticles, setFilteredArticles] = useState([...articles]);

    React.useImperativeHandle(ref, () => ({
        filter
    }));

    const filter = (filtering) => {
        applyFiltering(articles, filtering);
    }

    const applyFiltering = (allArticles, filtering) => {
        let localFilteredArticles = allArticles;

        if (filtering.owners.length)
            localFilteredArticles = localFilteredArticles.filter(art => filtering.owners.includes(art.owner.name));

        if (filtering.tags.length)
            localFilteredArticles = localFilteredArticles.filter(art => filtering.tags.some(filterTag => art.tags.map(artTag => artTag.name).includes(filterTag)));
        
        
        setFilteredArticles(localFilteredArticles);
    }

    return (
        <div className='overflow-hidden'>
            {filteredArticles.map(art => <ArticleShort handleClick={handleClick} key={art.id} article={art}></ArticleShort>)}
        </div>
    );
});

export default SearchResults;
