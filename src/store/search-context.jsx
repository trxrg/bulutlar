import React, { createContext, useState, useContext } from 'react';
import { DBContext } from './db-context';

export const SearchContext = createContext();

export default function SearchContextProvider({ children }) {
    const { allArticles } = useContext(DBContext);
    const [filtering, setFiltering] = useState({});
    const [filteredArticles, setFilteredArticles] = useState([...allArticles]);

    const ctxValue = {
        filtering,
        setFiltering,
        filteredArticles,
        setFilteredArticles,
    };

    return (
        <SearchContext.Provider value={ctxValue}>
            {children}
        </SearchContext.Provider>
    );
};