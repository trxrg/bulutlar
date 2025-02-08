import React, { createContext, useState, useContext, useEffect } from 'react';
import { DBContext } from './db-context';
import { AppContext } from './app-context';

export const SearchContext = createContext();

export default function SearchContextProvider({ children }) {
    const { allArticles } = useContext(DBContext);
    const { fullScreen } = useContext(AppContext);

    const [filtering, setFiltering] = useState({});
    const [sidePanelCollapsed, setSidePanelCollapsed] = useState(false);
    const [filteredArticles, setFilteredArticles] = useState([...allArticles]);

    const [selectedOwnerNames, setSelectedOwnerNames] = useState([]);
    const [selectedTagNames, setSelectedTagNames] = useState([]);
    const [selectedCategoryNames, setSelectedCategoryNames] = useState([]);
    const [selectedNumbers1, setSelectedNumbers1] = useState([]);
    const [selectedNumbers2, setSelectedNumbers2] = useState([]);
    const [keywords, setKeywords] = useState([]);
    const [searchInTitle, setSearchInTitle] = useState(true);
    const [searchInExplanation, setSearchInExplanation] = useState(true);
    const [searchInMainText, setSearchInMainText] = useState(true);
    const [searchInComments, setSearchInComments] = useState(true);
    const [startDate, setStartDate] = useState({ day: null, month: null, year: null });
    const [endDate, setEndDate] = useState({ day: null, month: null, year: null });
    const [startDate2, setStartDate2] = useState({ day: null, month: null, year: null });
    const [endDate2, setEndDate2] = useState({ day: null, month: null, year: null });

    const [areArticlesSelectable, setArticlesSelectable] = useState(false);
    const [allOrNoneSelected, setAllOrNoneSelected] = useState(false);
    const [selectAllOrNoneClicks, setSelectAllOrNoneClicks] = useState(0);

    const toggleArticlesSelectable = () => {
        setArticlesSelectable(currentState => !currentState);
    };

    const selectAllOrNone = (selectAll) => {
        setSelectAllOrNoneClicks(currentClicks => currentClicks + 1);
        setAllOrNoneSelected(selectAll);
    };

    useEffect(() => {
        if (fullScreen) {
            setSidePanelCollapsed(true);
        }
    }, [fullScreen]);

    useEffect(() => {
        setFiltering({
            ownerNames: selectedOwnerNames,
            tagNames: selectedTagNames,
            categoryNames: selectedCategoryNames,
            keywords: keywords,
            startDate: startDate,
            endDate: endDate,
            startDate2: startDate2,
            endDate2: endDate2,
            numbers1: selectedNumbers1,
            numbers2: selectedNumbers2,
        });
    }, [selectedOwnerNames, selectedTagNames, selectedCategoryNames,
        selectedNumbers1, selectedNumbers2, keywords, startDate,
        endDate, startDate2, endDate2,
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
        keywords,
        setKeywords,
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
    };

    return (
        <SearchContext.Provider value={ctxValue}>
            {children}
        </SearchContext.Provider>
    );
};