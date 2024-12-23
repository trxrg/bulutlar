import React, { useEffect, useContext } from 'react';

import ArticleShort from './ArticleShort.jsx';
import { AppContext } from '../../../../store/app-context.jsx';
import { DBContext } from '../../../../store/db-context.jsx';
import { SearchContext } from '../../../../store/search-context.jsx';

const SearchResultsBody = () => {
    const { handleAddTab, translate: t } = useContext(AppContext);
    const { allArticles, getOwnerById, getTagById, getCategoryById } = useContext(DBContext);
    const { filtering, filteredArticles, setFilteredArticles } = useContext(SearchContext);

    useEffect(() => {
        setFilteredArticles([...allArticles]);
    }, [allArticles]);

    useEffect(() => {
        applyFiltering(allArticles, filtering);
    }, [allArticles, filtering]);

    const applyFiltering = (allArticles, filtering) => {
        let localFilteredArticles = allArticles;

        // alternative normalize function
        // const normalizeText = (text) => {
        //     return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/ı/g, 'i');
        // };

        const normalizeText = (text) => {
            if (!text)
                return '';
            const turkishMap = { 
                'ç': 'c', 'Ç': 'C', 
                'ğ': 'g', 'Ğ': 'G', 
                'ı': 'i', 'İ': 'I', 
                'ö': 'o', 'Ö': 'O', 
                'ş': 's', 'Ş': 'S', 
                'ü': 'u', 'Ü': 'U' 
            };
            const result = text.split('').map(char => turkishMap[char] || char).join('').toLowerCase();
            return result;
        };

        if (filtering.ownerNames && filtering.ownerNames.length)
            localFilteredArticles = localFilteredArticles.filter(art => art.ownerId && filtering.ownerNames.includes(getOwnerById(art.ownerId).name));

        if (filtering.tagNames && filtering.tagNames.length)
            localFilteredArticles = localFilteredArticles.filter(art => filtering.tagNames.some(filterTagName => art.tags.map(artTag => getTagById(artTag.id).name).includes(filterTagName)));

        if (filtering.categoryNames && filtering.categoryNames.length)
            localFilteredArticles = localFilteredArticles.filter(art => art.categoryId && filtering.categoryNames.includes(getCategoryById(art.categoryId).name));

        if (filtering.keywords && filtering.keywords.length) {
            localFilteredArticles = localFilteredArticles.filter(art => filtering.keywords.some(keyword => {
                const normalizedKeyword = normalizeText(keyword);
                return normalizeText(art.title).includes(normalizedKeyword) ||
                    normalizeText(art.text).includes(normalizedKeyword) ||
                    normalizeText(art.explanation).includes(normalizedKeyword) ||
                    (art.comments[0] && normalizeText(art.comments[0].text).includes(normalizedKeyword));
            }));
        }

        setFilteredArticles(localFilteredArticles);
    };

    return (
        <>
            {allArticles.length === 0 ?
                <div className='flex justify-center p-2 h-full'>
                    <p>{t('no articles')}</p>
                </div> :
                <div className='flex flex-col gap-5 p-5 relative'>
                    {filteredArticles.map(art => (
                        <ArticleShort
                            handleClick={handleAddTab}
                            key={art.id}
                            article={art}
                            keywords={(filtering.keywords && filtering.keywords.length) ? filtering.keywords : null}
                            dangerouslySetInnerHTML={{ __html: art.title }}
                        />
                    ))}
                </div>}
        </>
    );
};

export default SearchResultsBody;
