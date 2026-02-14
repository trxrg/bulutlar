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

// --- Pure helper functions (defined outside the component to avoid re-creation) ---

/** Parse a date boundary object into a form with presence flags */
const parseDateBoundary = (dateObj) => {
    if (!dateObj) return null;
    const yearPresent = dateObj.year !== '';
    const monthPresent = dateObj.month !== '';
    const dayPresent = dateObj.day !== '';
    if (!yearPresent && !monthPresent && !dayPresent) return null;
    return { ...dateObj, yearPresent, monthPresent, dayPresent };
};

/** Check if an article's date passes a start-date filter */
const passesStartDate = (art, field, info) => {
    if (!info) return true;
    if (art.isDateUncertain) return false;
    const { yearPresent, monthPresent, dayPresent } = info;

    if (yearPresent && monthPresent) {
        const startDateObj = new Date(Date.UTC(
            info.year || 0, (info.month || 1) - 1, info.day || 1, 0, 0, 0, 0
        ));
        return new Date(art[field]) >= startDateObj;
    }

    if ((yearPresent || monthPresent || dayPresent) && !(monthPresent && dayPresent)) {
        const articleDate = new Date(art[field]);
        let result = true;
        if (yearPresent) result = result && articleDate.getFullYear() >= info.year;
        if (monthPresent) result = result && (articleDate.getMonth() + 1) >= info.month;
        if (dayPresent) result = result && articleDate.getDate() >= info.day;
        return result;
    }

    if (monthPresent && dayPresent) {
        const articleDate = new Date(art[field]);
        const articleMonth = articleDate.getMonth() + 1;
        const articleDay = articleDate.getDate();
        return articleMonth == info.month ? articleDay >= info.day : articleMonth >= info.month;
    }

    return true;
};

/** Check if an article's date passes an end-date filter */
const passesEndDate = (art, field, info) => {
    if (!info) return true;
    if (art.isDateUncertain) return false;
    const { yearPresent, monthPresent, dayPresent } = info;

    if (yearPresent && monthPresent) {
        const endDateObj = new Date(Date.UTC(
            info.year || 9999, (info.month || 12) - 1, info.day || 31, 23, 59, 59, 999
        ));
        return new Date(art[field]) <= endDateObj;
    }

    if ((yearPresent || monthPresent || dayPresent) && !(monthPresent && dayPresent)) {
        const articleDate = new Date(art[field]);
        let result = true;
        if (yearPresent) result = result && articleDate.getFullYear() <= info.year;
        if (monthPresent) result = result && (articleDate.getMonth() + 1) <= info.month;
        if (dayPresent) result = result && articleDate.getDate() <= info.day;
        return result;
    }

    if (monthPresent && dayPresent) {
        const articleDate = new Date(art[field]);
        const articleMonth = articleDate.getMonth() + 1;
        const articleDay = articleDate.getDate();
        return articleMonth == info.month ? articleDay <= info.day : articleMonth <= info.month;
    }

    return true;
};

/** Get month/year from a date string */
const getMonthYear = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    return { month: date.getMonth(), year: date.getFullYear() };
};

const SearchResultsBody = React.memo(() => {
    const { handleAddTab, translate: t } = useContext(AppContext);
    const { allArticles, getOwnerById, getTagById, getCategoryById, getGroupById, articleOrder } = useContext(DBContext);
    const { filtering, filteredArticles, setFilteredArticles,
        searchInTitle, searchInExplanation,
        searchInMainText, searchInComments } = useContext(SearchContext);

    const [showScrollTop, setShowScrollTop] = useState(false);
    const containerRef = useRef(null);

    // --- Optimized single-pass filtering with useCallback and proper dependencies ---
    const applyFiltering = useCallback((articles, filtering) => {
        try {
            // Pre-compute Sets for O(1) lookups instead of Array.includes O(n)
            const ownerNameSet = filtering.ownerNames?.length ? new Set(filtering.ownerNames) : null;
            const tagNameSet = filtering.tagNames?.length ? new Set(filtering.tagNames) : null;
            const groupNameSet = filtering.groupNames?.length ? new Set(filtering.groupNames) : null;
            const categoryNameSet = filtering.categoryNames?.length ? new Set(filtering.categoryNames) : null;
            const number1Set = filtering.numbers1?.length ? new Set(filtering.numbers1) : null;
            const number2Set = filtering.numbers2?.length ? new Set(filtering.numbers2) : null;

            // Pre-normalize keywords once (instead of per-article-per-keyword)
            const normalizedKeywords = filtering.keywords?.length
                ? filtering.keywords.map(k => normalizeText(k))
                : null;
            const normalizedQuickSearch = filtering.quickSearchTerm?.trim()
                ? normalizeText(filtering.quickSearchTerm.trim())
                : null;

            // Pre-compute date boundary info once
            const startDateInfo = parseDateBoundary(filtering.startDate);
            const endDateInfo = parseDateBoundary(filtering.endDate);
            const startDate2Info = parseDateBoundary(filtering.startDate2);
            const endDate2Info = parseDateBoundary(filtering.endDate2);

            const needsTextNormalization = normalizedKeywords || normalizedQuickSearch;

            // Single-pass filter: all conditions combined into one predicate
            const result = articles.filter(art => {
                // Starred
                if (filtering.filterStarred && !art.isStarred) return false;

                // Read/unread
                if (filtering.filterShowRead && !filtering.filterShowUnread && !art.isRead) return false;
                if (!filtering.filterShowRead && filtering.filterShowUnread && art.isRead) return false;

                // Owner (Set lookup instead of Array.includes)
                if (ownerNameSet) {
                    if (!art.ownerId) return false;
                    const owner = getOwnerById(art.ownerId);
                    if (!owner || !ownerNameSet.has(owner.name)) return false;
                }

                // Tags (Set lookup with .some(); no intermediate .map().includes())
                if (tagNameSet) {
                    if (!art.tags.some(artTag => {
                        const tag = getTagById(artTag.id);
                        return tag && tagNameSet.has(tag.name);
                    })) return false;
                }

                // Groups
                if (groupNameSet) {
                    if (!art.groups.some(artGroup => {
                        const group = getGroupById(artGroup.id);
                        return group && groupNameSet.has(group.name);
                    })) return false;
                }

                // Category
                if (categoryNameSet) {
                    if (!art.categoryId) return false;
                    const category = getCategoryById(art.categoryId);
                    if (!category || !categoryNameSet.has(category.name)) return false;
                }

                // Date filters
                if (startDateInfo || endDateInfo) {
                    if (!passesStartDate(art, 'date', startDateInfo)) return false;
                    if (!passesEndDate(art, 'date', endDateInfo)) return false;
                }
                if (startDate2Info || endDate2Info) {
                    if (!passesStartDate(art, 'date2', startDate2Info)) return false;
                    if (!passesEndDate(art, 'date2', endDate2Info)) return false;
                }

                // Number filters
                if (number1Set && (art.isDateUncertain || !number1Set.has(String(art.number)))) return false;
                if (number2Set && (art.isDateUncertain || !number2Set.has(String(art.number2)))) return false;

                // Text search: normalize each article's text fields ONCE,
                // shared by both keyword and quickSearch filters
                if (needsTextNormalization) {
                    const normalizedTitle = normalizeText(htmlToText(art.title));
                    const normalizedMainText = normalizeText(htmlToText(art.text));
                    const normalizedExplanation = normalizeText(htmlToText(art.explanation));
                    const normalizedComment = art.comments[0]
                        ? normalizeText(htmlToText(art.comments[0].text)) : '';

                    // Keyword filter (respects searchIn* flags)
                    if (normalizedKeywords) {
                        const hasMatch = normalizedKeywords.some(nk =>
                            (searchInTitle && normalizedTitle.includes(nk)) ||
                            (searchInMainText && normalizedMainText.includes(nk)) ||
                            (searchInExplanation && normalizedExplanation.includes(nk)) ||
                            (searchInComments && normalizedComment.includes(nk))
                        );
                        if (!hasMatch) return false;
                    }

                    // Quick search (all text fields + entity names, with short-circuit evaluation)
                    if (normalizedQuickSearch) {
                        const textMatch =
                            normalizedTitle.includes(normalizedQuickSearch) ||
                            normalizedMainText.includes(normalizedQuickSearch) ||
                            normalizedExplanation.includes(normalizedQuickSearch) ||
                            normalizedComment.includes(normalizedQuickSearch);

                        if (!textMatch) {
                            const tagMatch = art.tags?.some(tag => {
                                const tagEntity = getTagById(tag.id);
                                return tagEntity && normalizeText(tagEntity.name).includes(normalizedQuickSearch);
                            });

                            if (!tagMatch) {
                                const categoryEntity = art.categoryId && getCategoryById(art.categoryId);
                                const categoryMatch = categoryEntity && normalizeText(categoryEntity.name).includes(normalizedQuickSearch);

                                if (!categoryMatch) {
                                    const ownerEntity = art.ownerId && getOwnerById(art.ownerId);
                                    const ownerMatch = ownerEntity && normalizeText(ownerEntity.name).includes(normalizedQuickSearch);

                                    if (!ownerMatch) {
                                        const groupMatch = art.groups?.some(group => {
                                            const groupEntity = getGroupById(group.id);
                                            return groupEntity && normalizeText(groupEntity.name).includes(normalizedQuickSearch);
                                        });
                                        if (!groupMatch) return false;
                                    }
                                }
                            }
                        }
                    }
                }

                return true;
            });

            setFilteredArticles(result);
        } catch (error) {
            console.error('Error in applyFiltering', error);
            toastr.error('Error in applyFiltering');
        }
    }, [getOwnerById, getTagById, getCategoryById, getGroupById,
        searchInTitle, searchInExplanation, searchInMainText, searchInComments,
        setFilteredArticles]);

    // Single effect to apply filtering (removed the redundant useEffect that just copied allArticles)
    useEffect(() => {
        applyFiltering(allArticles, filtering);
    }, [allArticles, filtering, applyFiltering]);

    // Throttled scroll handler for scroll-to-top button visibility
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const scrollableParent = container.parentElement;
        if (!scrollableParent) return;

        let rafId = null;
        const handleScroll = () => {
            if (rafId) return; // throttle: skip if a frame is already pending
            rafId = requestAnimationFrame(() => {
                const scrollTop = scrollableParent.scrollTop;
                setShowScrollTop(scrollTop > 200);
                rafId = null;
            });
        };

        scrollableParent.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            scrollableParent.removeEventListener('scroll', handleScroll);
            if (rafId) cancelAnimationFrame(rafId);
        };
    }, []);

    const scrollToTop = useCallback(() => {
        const container = containerRef.current;
        if (!container) return;
        const scrollableParent = container.parentElement;
        if (scrollableParent) {
            scrollableParent.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, []);

    // Keywords for highlighting, shared across all ArticleShort instances
    const allKeywords = useMemo(() => {
        const kws = [];
        if (filtering.keywords?.length) kws.push(...filtering.keywords);
        if (filtering.quickSearchTerm?.trim()) kws.push(filtering.quickSearchTerm.trim());
        return kws.length > 0 ? kws : null;
    }, [filtering.keywords, filtering.quickSearchTerm]);

    // Memoize the article list rendering
    const articlesList = useMemo(() => {
        // If sorting by date, group articles by month/year
        if (articleOrder?.field === 'date') {
            const result = [];
            let lastMonthYear = null;
            let sectionIndex = 0;

            filteredArticles.forEach((art) => {
                const monthYear = getMonthYear(art.date);

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
                        keywords={allKeywords}
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
                keywords={allKeywords}
            />
        ));
    }, [filteredArticles, handleAddTab, allKeywords, articleOrder]);

    return (
        <>
            {allArticles.length === 0 ?
                <div className='flex justify-center p-2 h-full'>
                    <p>{t('no articles')}</p>
                </div> :
                <div ref={containerRef} className='flex flex-col gap-5 p-5 relative'>
                    {articlesList}

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
