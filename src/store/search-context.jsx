import React, { createContext, useState, useContext, useEffect } from 'react';
import { DBContext } from './db-context';
import { AppContext } from './app-context';

export const SearchContext = createContext();

export default function SearchContextProvider({ children }) {
    const { allArticles } = useContext(DBContext);
    const { fullScreen } = useContext(AppContext);

    const [filtering, setFiltering] = useState({});
    const [sidePanelCollapsed, setSidePanelCollapsed] = useState({});
    const [filteredArticles, setFilteredArticles] = useState([...allArticles]);

    useEffect(() => {
        if (fullScreen) {
            setSidePanelCollapsed(true);
        }
    }, [fullScreen]);

    const ctxValue = {
        filtering,
        setFiltering,
        filteredArticles,
        setFilteredArticles,
        sidePanelCollapsed,
        setSidePanelCollapsed,
    };

    return (
        <SearchContext.Provider value={ctxValue}>
            {children}
        </SearchContext.Provider>
    );
};