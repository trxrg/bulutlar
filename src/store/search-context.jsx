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
        });
    }, [selectedOwnerNames, selectedTagNames, selectedCategoryNames]);

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
    };

    return (
        <SearchContext.Provider value={ctxValue}>
            {children}
        </SearchContext.Provider>
    );
};