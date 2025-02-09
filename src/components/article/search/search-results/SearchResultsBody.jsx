import React, { useEffect, useContext } from 'react';

import ArticleShort from './ArticleShort.jsx';
import { AppContext } from '../../../../store/app-context.jsx';
import { DBContext } from '../../../../store/db-context.jsx';
import { SearchContext } from '../../../../store/search-context.jsx';
import toastr from 'toastr';

const SearchResultsBody = () => {
    const { handleAddTab, translate: t, normalizeText, htmlToText } = useContext(AppContext);
    const { allArticles, getOwnerById, getTagById, getCategoryById } = useContext(DBContext);
    const { filtering, filteredArticles, setFilteredArticles,
        searchInTitle, searchInExplanation,
        searchInMainText, searchInComments } = useContext(SearchContext);

    useEffect(() => {
        setFilteredArticles([...allArticles]);
    }, [allArticles]);

    useEffect(() => {
        applyFiltering(allArticles, filtering);
    }, [allArticles, filtering]);

    const applyFiltering = (allArticles, filtering) => {
        let localFilteredArticles = allArticles;

        if (filtering.ownerNames && filtering.ownerNames.length)
            localFilteredArticles = localFilteredArticles.filter(art => art.ownerId && filtering.ownerNames.includes(getOwnerById(art.ownerId).name));

        if (filtering.tagNames && filtering.tagNames.length)
            localFilteredArticles = localFilteredArticles.filter(art => filtering.tagNames.some(filterTagName => art.tags.map(artTag => getTagById(artTag.id).name).includes(filterTagName)));

        if (filtering.categoryNames && filtering.categoryNames.length)
            localFilteredArticles = localFilteredArticles.filter(art => art.categoryId && filtering.categoryNames.includes(getCategoryById(art.categoryId).name));

        if (filtering.startDate || filtering.endDate)
            localFilteredArticles = applyDateFiltering(localFilteredArticles, 'date', filtering.startDate, filtering.endDate);

        if (filtering.startDate2 || filtering.endDate2)
            localFilteredArticles = applyDateFiltering(localFilteredArticles, 'date2', filtering.startDate2, filtering.endDate2);

        if (filtering.numbers1 && filtering.numbers1.length)
            localFilteredArticles = localFilteredArticles.filter(art => !art.isDateUncertain && filtering.numbers1.includes(String(art.number)));

        if (filtering.numbers2 && filtering.numbers2.length)
            localFilteredArticles = localFilteredArticles.filter(art => !art.isDateUncertain && filtering.numbers2.includes(String(art.number2)));

        if (filtering.keywords && filtering.keywords.length) {
            localFilteredArticles = localFilteredArticles.filter(art => filtering.keywords.some(keyword => {
                const normalizedKeyword = normalizeText(keyword);
                return (searchInTitle && normalizeText(htmlToText(art.title)).includes(normalizedKeyword)) ||
                    (searchInMainText && normalizeText(htmlToText(art.text)).includes(normalizedKeyword)) ||
                    (searchInExplanation && normalizeText(htmlToText(art.explanation)).includes(normalizedKeyword)) ||
                    (searchInComments && (art.comments[0] && normalizeText(htmlToText(art.comments[0].text)).includes(normalizedKeyword)));
            }));
        }

        setFilteredArticles(localFilteredArticles);
    };

    const applyDateFiltering = (filteredArticles, field, startDate, endDate) => {
        let localFilteredArticles = filteredArticles;

        try {
            if (startDate) {
                if (startDate.day)
                    localFilteredArticles = localFilteredArticles.filter(art => !art.isDateUncertain && parseInt(new Date(art[field]).getDate()) >= startDate.day);
                if (startDate.month)
                    localFilteredArticles = localFilteredArticles.filter(art => !art.isDateUncertain && parseInt(new Date(art[field]).getMonth()) >= startDate.month - 1);
                if (startDate.year)
                    localFilteredArticles = localFilteredArticles.filter(art => !art.isDateUncertain && parseInt(new Date(art[field]).getFullYear()) >= startDate.year);
            }

            if (endDate) {
                if (endDate.day)
                    localFilteredArticles = localFilteredArticles.filter(art => !art.isDateUncertain && parseInt(new Date(art[field]).getDate()) <= endDate.day);
                if (endDate.month)
                    localFilteredArticles = localFilteredArticles.filter(art => !art.isDateUncertain && parseInt(new Date(art[field]).getMonth()) <= endDate.month - 1);
                if (endDate.year)
                    localFilteredArticles = localFilteredArticles.filter(art => !art.isDateUncertain && parseInt(new Date(art[field]).getFullYear()) <= endDate.year);
            }

            return localFilteredArticles;
        } catch (error) {
            console.error('Error in applyDateFiltering', error);
            toastr.error('Error in applyDateFiltering');
            return filteredArticles;
        }
    }

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
