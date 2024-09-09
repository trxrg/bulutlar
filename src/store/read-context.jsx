import { createContext, useState, useEffect, useContext } from 'react';

import { updateArticle } from '../backend-adapter/BackendAdapter.js';
import { AppContext } from './app-context.jsx';

export const ReadContext = createContext();

export default function ReadContextProvider({ children, article }) {

    const { syncArticleWithIdFromBE } = useContext(AppContext);

    const [explanationState, setExplanationState] = useState({html: article.explanation, json: article.explanationJson});
    const [mainTextState, setMainTextState] = useState({html: article.text, json: article.textJson});
    const [commentState, setCommentState] = useState({html: article.comments[0].text, json: article.comments[0].textJson});
    
    const saveArticle = async () => {
        const result = await updateArticle(article.id, {
            ...article,
            explanation: explanationState.html,
            explanationJson: explanationState.json,
            text: mainTextState.html,
            textJson: mainTextState.json,
            // comments: [{ text: commentState.html, textJson: commentState.json }],
            // tags: article.tags
        });
        console.log('article updated:');
        console.log(result);
        syncArticleWithIdFromBE(article.id);
    }

    useEffect(() => {
        saveArticle();
    }, [explanationState, mainTextState, commentState]);

    const ctxValue = {
        article,
        setExplanationState,
        setMainTextState,
        setCommentState
    };

    return <ReadContext.Provider value={ctxValue}>
        {children}
    </ReadContext.Provider>
}
