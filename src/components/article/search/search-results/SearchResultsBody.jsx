import React, { useState, useEffect, useContext } from 'react';

import ArticleShort from './ArticleShort.jsx';
import { AppContext } from '../../../../store/app-context.jsx';
import { DBContext } from '../../../../store/db-context.jsx';
import { SearchContext } from '../../../../store/search-context.jsx';

const SearchResultsBody = () => {
    const { handleAddTab } = useContext(AppContext);
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
            const turkishMap = {'ç': 'c', 'ğ': 'g', 'ı': 'i', 'İ': 'I', 'ö': 'o', 'ş': 's', 'ü': 'u',};
            return text.toLowerCase().split('').map(char => turkishMap[char] || char).join('');
        };

        const highlightKeywords = (text, keywords) => {
            const normalizedText = normalizeText(text);
            let highlightedText = text;
            const matches = [];
        
            keywords.forEach(keyword => {
                const normalizedKeyword = normalizeText(keyword);
                const regex = new RegExp(`(${normalizedKeyword})`, 'gi');
                let match;
                while ((match = regex.exec(normalizedText)) !== null) {
                    matches.push({ start: match.index, end: regex.lastIndex });
                }
            });
        
            // Sort matches by start position
            matches.sort((a, b) => a.start - b.start);
        
            // Highlight the original text based on matches
            let offset = 0;
            matches.forEach(({ start, end }) => {
                const originalStart = start + offset;
                const originalEnd = end + offset;
                highlightedText = highlightedText.slice(0, originalStart) + '<mark>' + highlightedText.slice(originalStart, originalEnd) + '</mark>' + highlightedText.slice(originalEnd);
                offset += '<mark>'.length + '</mark>'.length;
            });
        
            return highlightedText;
        };
        

        if (filtering.ownerNames && filtering.ownerNames.length)
            localFilteredArticles = localFilteredArticles.filter(art => filtering.ownerNames.includes(getOwnerById(art.ownerId).name));

        if (filtering.tagNames && filtering.tagNames.length)
            localFilteredArticles = localFilteredArticles.filter(art => filtering.tagNames.some(filterTagName => art.tags.map(artTag => getTagById(artTag.id).name).includes(filterTagName)));

        if (filtering.categoryNames && filtering.categoryNames.length)
            localFilteredArticles = localFilteredArticles.filter(art => filtering.categoryNames.includes(getCategoryById(art.categoryId).name));

        if (filtering.keywords && filtering.keywords.length) {
            localFilteredArticles = localFilteredArticles.map(art => {
                const highlightedTitle = highlightKeywords(art.title, filtering.keywords);
                const highlightedText = highlightKeywords(art.text, filtering.keywords);
                const highlightedExplanation = highlightKeywords(art.explanation, filtering.keywords);
                const highlightedComments = art.comments.map(comment => ({
                    ...comment,
                    text: highlightKeywords(comment.text, filtering.keywords)
                }));

                return {
                    ...art,
                    title: highlightedTitle,
                    text: highlightedText,
                    explanation: highlightedExplanation,
                    comments: highlightedComments
                };
            });

            localFilteredArticles = localFilteredArticles.filter(art => filtering.keywords.some(keyword => {
                const normalizedKeyword = normalizeText(keyword);
                console.log('normalizedKeyword:');
                console.log(normalizedKeyword);
                return normalizeText(art.title).includes(normalizedKeyword) || 
                       normalizeText(art.text).includes(normalizedKeyword) ||
                       normalizeText(art.explanation).includes(normalizedKeyword) ||
                       (art.comments[0] && normalizeText(art.comments[0].text).includes(normalizedKeyword));
            }));
        }

        setFilteredArticles(localFilteredArticles);
    };

    return (
        <div className='flex flex-col gap-5 p-5 relative'>
            {filteredArticles.map(art => (
                <ArticleShort 
                    handleClick={handleAddTab} 
                    key={art.id} 
                    article={art} 
                    dangerouslySetInnerHTML={{ __html: art.title }}
                />
            ))}
        </div>
    );
};

export default SearchResultsBody;