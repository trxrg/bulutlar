import React, { useEffect, useContext, useMemo, useState, useRef, useCallback } from 'react';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import Tooltip from '@mui/material/Tooltip';

import ArticleShort from './ArticleShort.jsx';
import DateSectionHeader from './DateSectionHeader.jsx';
import { AppContext } from '../../../../store/app-context.jsx';
import { DBContext } from '../../../../store/db-context.jsx';
import { SearchContext } from '../../../../store/search-context.jsx';
import { normalizeText, htmlToText } from '../../../../utils/textUtils.js';
import toastr from 'toastr';

const SearchResultsBody = React.memo(() => {
    const { handleAddTab, translate: t } = useContext(AppContext);
    const { allArticles, getOwnerById, getTagById, getCategoryById, getGroupById, articleOrder } = useContext(DBContext);
    const { filtering, filteredArticles, setFilteredArticles,
        searchInTitle, searchInExplanation,
        searchInMainText, searchInComments } = useContext(SearchContext);

    const [showScrollTop, setShowScrollTop] = useState(false);
    const [currentDateSection, setCurrentDateSection] = useState(null);
    const [showStickyDate, setShowStickyDate] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        setFilteredArticles([...allArticles]);
    }, [allArticles]);

    useEffect(() => {
        applyFiltering(allArticles, filtering);
    }, [allArticles, filtering]);

    // Helper function to get month/year from article date
    const getMonthYear = useCallback((dateString) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return null;
        return { month: date.getMonth(), year: date.getFullYear() };
    }, []);

    // Reset sticky date state when sorting method changes
    useEffect(() => {
        if (articleOrder?.field !== 'date') {
            setShowStickyDate(false);
            setCurrentDateSection(null);
        }
    }, [articleOrder]);

    // Handle scroll event to show/hide scroll-to-top button and update sticky date
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const scrollableParent = container.parentElement;
        if (!scrollableParent) return;

        const handleScroll = (e) => {
            const scrollTop = e.target.scrollTop;
            setShowScrollTop(scrollTop > 200);

            // Only show sticky date when sorting by date and scrolled down
            if (articleOrder?.field !== 'date') {
                setShowStickyDate(false);
                return;
            }

            // Find which date section is currently in view
            const sections = container.querySelectorAll('[data-date-section]');
            let currentSection = null;

            sections.forEach(section => {
                const rect = section.getBoundingClientRect();
                const containerRect = scrollableParent.getBoundingClientRect();
                
                // Check if section is at or above the top of the visible area
                if (rect.top <= containerRect.top + 100) {
                    currentSection = section.getAttribute('data-date-section');
                }
            });

            if (currentSection && scrollTop > 100) {
                const [year, month] = currentSection.split('-').map(Number);
                setCurrentDateSection({ month, year });
                setShowStickyDate(true);
            } else {
                setShowStickyDate(false);
            }
        };

        scrollableParent.addEventListener('scroll', handleScroll);
        return () => scrollableParent.removeEventListener('scroll', handleScroll);
    }, [articleOrder]);

    const scrollToTop = () => {
        const container = containerRef.current;
        if (!container) return;

        const scrollableParent = container.parentElement;
        if (scrollableParent) {
            scrollableParent.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

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

        if (filtering.quickSearchTerm && filtering.quickSearchTerm.trim()) {
            const normalizedQuickSearch = normalizeText(filtering.quickSearchTerm.trim());
            localFilteredArticles = localFilteredArticles.filter(art => {
                // Search in text content (existing functionality)
                const textMatch = (normalizeText(htmlToText(art.title)).includes(normalizedQuickSearch)) ||
                    (normalizeText(htmlToText(art.text)).includes(normalizedQuickSearch)) ||
                    (normalizeText(htmlToText(art.explanation)).includes(normalizedQuickSearch)) ||
                    ((art.comments[0] && normalizeText(htmlToText(art.comments[0].text)).includes(normalizedQuickSearch)));

                // Search in tags
                const tagMatch = art.tags && art.tags.some(tag => {
                    const tagEntity = getTagById(tag.id);
                    return tagEntity && normalizeText(tagEntity.name).includes(normalizedQuickSearch);
                });

                // Search in category
                const categoryMatch = art.categoryId && (() => {
                    const categoryEntity = getCategoryById(art.categoryId);
                    return categoryEntity && normalizeText(categoryEntity.name).includes(normalizedQuickSearch);
                })();

                // Search in owner
                const ownerMatch = art.ownerId && (() => {
                    const ownerEntity = getOwnerById(art.ownerId);
                    return ownerEntity && normalizeText(ownerEntity.name).includes(normalizedQuickSearch);
                })();

                // Add groupMatch for searching within group name
                const groupMatch = art.groups && art.groups.some(group => {
                    const groupEntity = getGroupById(group.id);
                    return groupEntity && normalizeText(groupEntity.name).includes(normalizedQuickSearch);
                });

                return textMatch || tagMatch || categoryMatch || ownerMatch || groupMatch;
            });
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
                    const startDateObj = new Date(Date.UTC(
                        startDate.year || 0, (startDate.month || 1) - 1, startDate.day || 1, 0, 0, 0, 0
                    ));
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

                        if (articleMonth == startDate.month) {
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
                    const endDateObj = new Date(Date.UTC(
                        endDate.year || 9999, (endDate.month || 12) - 1, endDate.day || 31, 23, 59, 59, 999
                    ));
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

                        if (articleMonth == endDate.month) {
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

    // Memoize the article list rendering for better performance
    const articlesList = useMemo(() => {
        // Combine keywords and quick search term for highlighting
        let allKeywords = [];
        if (filtering.keywords && filtering.keywords.length) {
            allKeywords = [...filtering.keywords];
        }
        if (filtering.quickSearchTerm && filtering.quickSearchTerm.trim()) {
            allKeywords.push(filtering.quickSearchTerm.trim());
        }

        // If sorting by date, group articles by month/year
        if (articleOrder?.field === 'date') {
            const result = [];
            let lastMonthYear = null;
            let sectionIndex = 0;

            filteredArticles.forEach((art, index) => {
                const monthYear = getMonthYear(art.date);
                
                // Add date section header when month/year changes
                if (monthYear) {
                    const currentKey = `${monthYear.year}-${monthYear.month}`;
                    if (lastMonthYear !== currentKey) {
                        result.push(
                            <DateSectionHeader 
                                key={`section-${sectionIndex}-${currentKey}`} 
                                month={monthYear.month} 
                                year={monthYear.year}
                            />
                        );
                        lastMonthYear = currentKey;
                        sectionIndex++;
                    }
                }

                result.push(
                    <ArticleShort
                        handleClick={handleAddTab}
                        key={art.id}
                        article={art}
                        keywords={allKeywords.length > 0 ? allKeywords : null}
                        dangerouslySetInnerHTML={{ __html: art.title }}
                    />
                );
            });

            return result;
        }

        // Default rendering without date grouping
        return filteredArticles.map(art => (
            <ArticleShort
                handleClick={handleAddTab}
                key={art.id}
                article={art}
                keywords={allKeywords.length > 0 ? allKeywords : null}
                dangerouslySetInnerHTML={{ __html: art.title }}
            />
        ));
    }, [filteredArticles, handleAddTab, filtering.keywords, filtering.quickSearchTerm, articleOrder, getMonthYear]);

    return (
        <>
            {allArticles.length === 0 ?
                <div className='flex justify-center p-2 h-full'>
                    <p>{t('no articles')}</p>
                </div> :
                <div ref={containerRef} className='flex flex-col gap-5 p-5 relative'>
                    {articlesList}

                    {/* Sticky date header - shows current month/year while scrolling */}
                    {showStickyDate && currentDateSection && (
                        <DateSectionHeader 
                            month={currentDateSection.month} 
                            year={currentDateSection.year}
                            isSticky={true}
                        />
                    )}

                    {/* Scroll to top button */}
                    <Tooltip title={t('Scroll to top') || 'Scroll to top'} arrow placement="left">
                        <button
                            onClick={scrollToTop}
                            className={`fixed bottom-6 right-6 rounded-full p-2 shadow-lg transition-all duration-300 z-[9999] hover:scale-110 ${showScrollTop ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                            style={{
                                backgroundColor: 'var(--bg-secondary)',
                                color: 'var(--text-primary)',
                                border: '1px solid var(--border-primary)',
                                boxShadow: '0 10px 15px -3px var(--shadow), 0 4px 6px -2px var(--shadow)'
                            }}
                        >
                            <KeyboardArrowUpIcon style={{ fontSize: '2rem' }} />
                        </button>
                    </Tooltip>
                </div>}
        </>
    );
});

export default SearchResultsBody;
