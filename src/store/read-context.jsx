import { createContext, useRef, useState, useContext } from 'react';
import { updateArticleMainText, updateArticleExplanation, updateCommentText } from '../backend-adapter/BackendAdapter.js';
import { AppContext } from './app-context.jsx';

export const ReadContext = createContext();

export default function ReadContextProvider({ children, article }) {

    const { syncArticleWithIdFromBE } = useContext(AppContext);
    const [fontSize, setFontSize] = useState('text-base');
    const readBodyRef = useRef();

    const fonts = ['text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl'];

    const updateMainText = (html, json) => {
        updateArticleMainText(article.id, { html, json });
        syncArticleWithIdFromBE(article.id);
    }

    const updateExplanation = (html, json) => {
        updateArticleExplanation(article.id, { html, json });
        syncArticleWithIdFromBE(article.id);
    }

    const updateComment = (html, json) => {
        updateCommentText(article.comments[0].id, { html, json });
        syncArticleWithIdFromBE(article.id);
    }

    const increaseFontSize = () => {
        const index = fonts.indexOf(fontSize);

        if (index + 1 < fonts.length)
            setFontSize(fonts[index + 1]);
    }

    const decreaseFontSize = () => {
        const index = fonts.indexOf(fontSize);

        if (index > 0)
            setFontSize(fonts[index - 1]);
    }

    const ctxValue = {
        article,
        readBodyRef,
        updateMainText,
        updateExplanation,
        updateComment,
        fontSize,
        increaseFontSize,
        decreaseFontSize,
    };

    return <ReadContext.Provider value={ctxValue}>
        {children}
    </ReadContext.Provider>
}
