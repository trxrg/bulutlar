import React, { useState, useEffect } from 'react';

import ArticleShort from '../components/ArticleShort';

const SearchResults = React.forwardRef(({ handleClick, articles }, ref) => {

    /* when articles prop changes filteredArticles are not set (useState)
        so i added useEffect to set articles to filteredArticles
        but this causes double render each time articles prop changes
    */
    const [filteredArticles, setFilteredArticles] = useState([...articles]);
    
    useEffect(() => {
        setFilteredArticles([...articles]);
    }, [articles]);

    React.useImperativeHandle(ref, () => ({
        filter
    }));

    const filter = (filtering) => {
        applyFiltering(articles, filtering);
    }

    const applyFiltering = (allArticles, filtering) => {
        let localFilteredArticles = allArticles;

        if (filtering.ownerNames.length)
            localFilteredArticles = localFilteredArticles.filter(art => filtering.ownerNames.includes(art.owner.name));

        if (filtering.tagNames.length)
            localFilteredArticles = localFilteredArticles.filter(art => filtering.tagNames.some(filterTagName => art.tags.map(artTag => artTag.name).includes(filterTagName)));


        setFilteredArticles(localFilteredArticles);
    }

    return (
        <div className='overflow-hidden'>
            <div className='flex justify-center'>
                <h3 className='text-xl text-gray-700'>{filteredArticles.length + ' articles'}</h3>
            </div>
            {filteredArticles.map(art => <ArticleShort handleClick={handleClick} key={art.id} article={art}></ArticleShort>)}
        </div>
    );
});

export default SearchResults;
