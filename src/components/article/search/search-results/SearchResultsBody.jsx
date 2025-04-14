import React, { useEffect, useContext } from 'react';

import ArticleShort from './ArticleShort.jsx';
import { AppContext } from '../../../../store/app-context.jsx';
import { DBContext } from '../../../../store/db-context.jsx';
import { SearchContext } from '../../../../store/search-context.jsx';
import toastr from 'toastr';

const SearchResultsBody = () => {
    const { handleAddTab, translate: t, normalizeText, htmlToText } = useContext(AppContext);
    const { allArticles, getOwnerById, getTagById, getCategoryById, getGroupById } = useContext(DBContext);
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

        if (filtering.filterStarred)
            localFilteredArticles = localFilteredArticles.filter(art => art.isStarred);

        if (filtering.ownerNames && filtering.ownerNames.length)
            localFilteredArticles = localFilteredArticles.filter(art => art.ownerId && filtering.ownerNames.includes(getOwnerById(art.ownerId).name));

        if (filtering.tagNames && filtering.tagNames.length)
            localFilteredArticles = localFilteredArticles.filter(art => filtering.tagNames.some(filterTagName => art.tags.map(artTag => getTagById(artTag.id).name).includes(filterTagName)));

        if (filtering.groupNames && filtering.groupNames.length)
            localFilteredArticles = localFilteredArticles.filter(art => filtering.groupNames.some(filterGroupName => art.groups.map(artGroup => getGroupById(artGroup.id).name).includes(filterGroupName)));

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
                const yearPresent = startDate.year !== '';
                const monthPresent = startDate.month !== '';
                const dayPresent = startDate.day !== '';
                // date comparison
                if (yearPresent && monthPresent) {
                    const startDateObj = new Date();
                    startDateObj.setFullYear(startDate.year || 0, (startDate.month || 1) - 1, startDate.day || 1);
                    localFilteredArticles = localFilteredArticles.filter(art => {
                        const articleDate = new Date(art[field]);
                        return !art.isDateUncertain && articleDate >= startDateObj;
                    });
                // compare field by field
                } else if ((yearPresent || monthPresent || dayPresent) && !(monthPresent && dayPresent)) {
                    localFilteredArticles = localFilteredArticles.filter(art => {
                        if (art.isDateUncertain) return false;
                        const articleDate = new Date(art[field]);
                        let result = true;
                        if (yearPresent)
                            result &&= articleDate.getFullYear() >= startDate.year;
                        if (monthPresent)
                            result &&= articleDate.getMonth() + 1 >= startDate.month;
                        if (dayPresent)
                            result &&= articleDate.getDate() >= startDate.day;
                        return result;
                    });
                // a specific solution for the case of only month and day present
                } else if (monthPresent && dayPresent) {
                    localFilteredArticles = localFilteredArticles.filter(art => {
                        if (art.isDateUncertain) return false;
                        const articleDate = new Date(art[field]);
                        const articleMonth = articleDate.getMonth() + 1;
                        const articleDay = articleDate.getDate();
                        
                        if (articleMonth === startDate.month) {
                            return articleDay >= startDate.day;
                        } else {
                            return articleMonth >= startDate.month;
                        }
                    });
                }
            }

            if (endDate) {
                const yearPresent = endDate.year !== '';
                const monthPresent = endDate.month !== '';
                const dayPresent = endDate.day !== '';
                // date comparison
                if (yearPresent && monthPresent) {
                    const endDateObj = new Date();
                    endDateObj.setFullYear(endDate.year || 0, (endDate.month || 1) - 1, endDate.day || 1);
                    localFilteredArticles = localFilteredArticles.filter(art => {
                        const articleDate = new Date(art[field]);
                        return !art.isDateUncertain && articleDate <= endDateObj;
                    });
                // compare field by field
                } else if ((yearPresent || monthPresent || dayPresent) && !(monthPresent && dayPresent)) {
                    localFilteredArticles = localFilteredArticles.filter(art => {
                        if (art.isDateUncertain) return false;
                        const articleDate = new Date(art[field]);
                        let result = true;
                        if (yearPresent)
                            result &&= articleDate.getFullYear() <= endDate.year;
                        if (monthPresent)
                            result &&= articleDate.getMonth() + 1 <= endDate.month;
                        if (dayPresent)
                            result &&= articleDate.getDate() <= endDate.day;
                        return result;
                    });
                // a specific solution for the case of only month and day present
                } else if (monthPresent && dayPresent) {
                    localFilteredArticles = localFilteredArticles.filter(art => {
                        if (art.isDateUncertain) return false;
                        
                        const articleDate = new Date(art[field]);
                        const articleMonth = articleDate.getMonth() + 1;
                        const articleDay = articleDate.getDate();
                                                
                        if (articleMonth === endDate.month) {
                            return articleDay <= endDate.day;
                        } else {
                            return articleMonth <= endDate.month;
                        }
                    });
                }
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
