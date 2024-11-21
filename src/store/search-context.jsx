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
    const [keywords, setKeywords] = useState([]);

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
        });
    }, [selectedOwnerNames, selectedTagNames, selectedCategoryNames, keywords]);

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
    };

    return (
        <SearchContext.Provider value={ctxValue}>
            {children}
        </SearchContext.Provider>
    );
};