import React, { createContext, useState, useContext, useEffect } from 'react';
import { DBContext } from './db-context';
import { AppContext } from './app-context';
import { usePersistentState } from '../hooks/usePersistentState';
import toastr from 'toastr';

export const SearchContext = createContext();

export default function SearchContextProvider({ children }) {
    const { allArticles } = useContext(DBContext);
    const { translate: t } = useContext(AppContext);

    const [filtering, setFiltering] = useState({});
    const [sidePanelCollapsed, setSidePanelCollapsed] = usePersistentState('sidePanelCollapsed', false);
    const [filteredArticles, setFilteredArticles] = useState([...allArticles]);
    const [selectedArticles, setSelectedArticles] = useState([]);

    const [selectedOwnerNames, setSelectedOwnerNames] = usePersistentState('selectedOwnerNames', []);
    const [selectedTagNames, setSelectedTagNames] = usePersistentState('selectedTagNames', []);
    const [selectedCategoryNames, setSelectedCategoryNames] = usePersistentState('selectedCategoryNames', []);
    const [selectedGroupNames, setSelectedGroupNames] = usePersistentState('selectedGroupNames', []);
    const [selectedNumbers1, setSelectedNumbers1] = usePersistentState('selectedNumbers1', []);
    const [selectedNumbers2, setSelectedNumbers2] = usePersistentState('selectedNumbers2', []);
    const [keywords, setKeywords] = usePersistentState('keywords', []);
    const [quickSearchTerm, setQuickSearchTerm] = usePersistentState('quickSearchTerm', '');
    const [searchInTitle, setSearchInTitle] = usePersistentState('searchInTitle', true);
    const [searchInExplanation, setSearchInExplanation] = usePersistentState('searchInExplanation', true);
    const [searchInMainText, setSearchInMainText] = usePersistentState('searchInMainText', true);
    const [searchInComments, setSearchInComments] = usePersistentState('searchInComments', true);
    const [startDate, setStartDate] = usePersistentState('startDate', { day: '', month: '', year: '' });
    const [endDate, setEndDate] = usePersistentState('endDate', { day: '', month: '', year: '' });
    const [startDate2, setStartDate2] = usePersistentState('startDate2', { day: '', month: '', year: '' });
    const [endDate2, setEndDate2] = usePersistentState('endDate2', { day: '', month: '', year: '' });
    const [filterStarred, setFilterStarred] = usePersistentState('filterStarred', false);

    const [areArticlesSelectable, setArticlesSelectable] = useState(false);
    const [allOrNoneSelected, setAllOrNoneSelected] = useState(false);
    const [selectAllOrNoneClicks, setSelectAllOrNoneClicks] = useState(0);

    const selectOnlyATag = (tagName) => {
        resetFilters();
        setSelectedTagNames([tagName]);
    }

    const selectOnlyAnOwner = (ownerName) => {
        resetFilters();
        setSelectedOwnerNames([ownerName]);
    }

    const selectOnlyACategory = (categoryName) => {
        resetFilters();
        setSelectedCategoryNames([categoryName]);
    };

    const selectOnlyAGroup = (groupName) => {
        resetFilters();
        setSelectedGroupNames([groupName]);
    };

    const resetFilters = () => {
        setSelectedGroupNames([]);
        setSelectedCategoryNames([]);
        setSelectedTagNames([]);
        setSelectedOwnerNames([]);
        setSelectedNumbers1([]);
        setSelectedNumbers2([]);
        setKeywords([]);
        setQuickSearchTerm('');
        setStartDate({ day: '', month: '', year: '' });
        setEndDate({ day: '', month: '', year: '' });
        setStartDate2({ day: '', month: '', year: '' });
        setEndDate2({ day: '', month: '', year: '' });
        setFilterStarred(false);
    };

    const toggleArticlesSelectable = () => {
        setArticlesSelectable(currentState => !currentState);
    };

    const selectAllOrNone = (selectAll) => {
        setSelectAllOrNoneClicks(currentClicks => currentClicks + 1);
        setAllOrNoneSelected(selectAll);
        setSelectedArticles(selectAll ? filteredArticles.map(art => art.id) : []);
    };    

    useEffect(() => {
        selectAllOrNone(false);
    }, [filteredArticles]);

    const generatePDFOfSelectedArticles = () => {
        console.log('generatePDFOfSelectedArticles not implemented yet');
        toastr.warning(t('pdf not implemented yet'));
    }

    const selectArticle = (articleId) => {
        if (!selectedArticles.includes(articleId)) {
            setSelectedArticles([...selectedArticles, articleId]);
        }
    }

    const deselectArticle = (articleId) => {
        setSelectedArticles(selectedArticles.filter(id => id !== articleId));
    }

    useEffect(() => {
        setFiltering({
            ownerNames: selectedOwnerNames,
            tagNames: selectedTagNames,
            categoryNames: selectedCategoryNames,
            groupNames: selectedGroupNames,
            keywords: keywords,
            quickSearchTerm: quickSearchTerm,
            startDate: startDate,
            endDate: endDate,
            startDate2: startDate2,
            endDate2: endDate2,
            numbers1: selectedNumbers1,
            numbers2: selectedNumbers2,
            filterStarred: filterStarred,
        });
    }, [selectedOwnerNames, selectedTagNames, selectedCategoryNames,
        selectedGroupNames, selectedNumbers1, selectedNumbers2, keywords, quickSearchTerm, startDate,
        endDate, startDate2, endDate2, filterStarred,
        searchInTitle, searchInExplanation, searchInMainText, searchInComments]);

    const ctxValue = {
        filtering,
        setFiltering,
        filteredArticles,
        setFilteredArticles,
        sidePanelCollapsed,
        setSidePanelCollapsed,
        selectedOwnerNames,
        setSelectedOwnerNames,
        selectedTagNames,
        setSelectedTagNames,
        selectedCategoryNames,
        setSelectedCategoryNames,
        selectedGroupNames,
        setSelectedGroupNames,
        keywords,
        setKeywords,
        quickSearchTerm,
        setQuickSearchTerm,
        areArticlesSelectable,
        setArticlesSelectable,
        toggleArticlesSelectable,
        selectAllOrNone,
        selectAllOrNoneClicks,
        allOrNoneSelected,
        startDate,
        setStartDate,
        endDate,
        setEndDate,
        startDate2,
        setStartDate2,
        endDate2,
        setEndDate2,
        selectedNumbers1,
        setSelectedNumbers1,
        selectedNumbers2,
        setSelectedNumbers2,
        searchInTitle,
        setSearchInTitle,
        searchInExplanation,
        setSearchInExplanation,
        searchInMainText,
        setSearchInMainText,
        searchInComments,
        setSearchInComments,
        filterStarred,
        setFilterStarred,
        generatePDFOfSelectedArticles,
        selectArticle,
        deselectArticle,
        selectedArticles,
        selectOnlyATag,
        selectOnlyAnOwner,
        selectOnlyACategory,
        selectOnlyAGroup,
    };

    return (
        <SearchContext.Provider value={ctxValue}>
            {children}
        </SearchContext.Provider>
    );
};