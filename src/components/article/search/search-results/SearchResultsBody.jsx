import React, { useState, useEffect, useContext } from 'react';

import ArticleShort from './ArticleShort.jsx';
import { AppContext } from '../../../../store/app-context.jsx';
import { DBContext } from '../../../../store/db-context.jsx';
import { SearchContext } from '../../../../store/search-context.jsx';

const SearchResultsBody = () => {

    const { handleAddTab } = useContext(AppContext);
    const { allArticles, getOwnerById, getTagById } = useContext(DBContext);
    const { filtering, filteredArticles, setFilteredArticles } = useContext(SearchContext);

    useEffect(() => {
        setFilteredArticles([...allArticles]);
    }, [allArticles]);

    useEffect(() => {
        applyFiltering(allArticles, filtering);
    }, [allArticles, filtering]);

    const applyFiltering = (allArticles, filtering) => {
        let localFilteredArticles = allArticles;

        if (filtering.ownerNames && filtering.ownerNames.length)
            localFilteredArticles = localFilteredArticles.filter(art => filtering.ownerNames.includes(getOwnerById(art.ownerId).name));

        if (filtering.tagNames && filtering.tagNames.length)
            localFilteredArticles = localFilteredArticles.filter(art => filtering.tagNames.some(filterTagName => art.tags.map(artTag => getTagById(artTag.id).name).includes(filterTagName)));


        setFilteredArticles(localFilteredArticles);
    }

    return (
        <div className='flex flex-col gap-5 px-5 mt-5'>
            {filteredArticles.map(art => <ArticleShort handleClick={handleAddTab} key={art.id} article={art}></ArticleShort>)}
        </div>
    );
};

export default SearchResultsBody;