import { createContext, useState, useEffect, useContext } from 'react';
import { updateArticleMainText, updateArticleExplanation, updateCommentText } from '../backend-adapter/BackendAdapter.js';
import { AppContext } from './app-context.jsx';

export const ReadContext = createContext();

export default function ReadContextProvider({ children, article }) {

    const { syncArticleWithIdFromBE } = useContext(AppContext);
    
    const updateMainText = (html, json) => {
        updateArticleMainText(article.id, { html, json });
        syncArticleWithIdFromBE(article.id);
    }
    
    const updateExplanation = (html, json) => {
        updateArticleExplanation(article.id, {html, json});
        syncArticleWithIdFromBE(article.id);
    }
    
    const updateComment = (html, json) => {
        updateCommentText(article.comments[0].id, {html, json});
        syncArticleWithIdFromBE(article.id);
    }
    
    const ctxValue = {
        article,
        updateMainText,
        updateExplanation,
        updateComment,
    };

    return <ReadContext.Provider value={ctxValue}>
        {children}
    </ReadContext.Provider>
}
