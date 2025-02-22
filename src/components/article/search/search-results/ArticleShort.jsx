import parse from 'html-react-parser';
import TagButton from '../../../tag/TagButton';
import React, { useContext, useState, useEffect } from 'react';
import { DBContext } from '../../../../store/db-context';
import { AppContext } from '../../../../store/app-context';
import { SearchContext } from '../../../../store/search-context';
import { articleApi } from '../../../../backend-adapter/BackendAdapter';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import ArticleInfo from '../../ArticleInfo';

export default function ArticleShort({ article, keywords, handleClick }) {

    const [isSelected, setIsSelected] = useState(false);
    const { getCategoryById, getTagById, fetchArticleById } = useContext(DBContext);
    const { translate: t, normalizeText, htmlToText } = useContext(AppContext);
    const { areArticlesSelectable, allOrNoneSelected, selectAllOrNoneClicks, selectArticle, deselectArticle } = useContext(SearchContext);

    const numberOfTags = 3;
    const numberOfCharsForText = 400;

    const category = getCategoryById(article.categoryId);

    useEffect(() => {
        setIsSelected(allOrNoneSelected);
    }, [selectAllOrNoneClicks]);

    const highlightKeywords = (text, keywords) => {
        if (!text || text.length === 0)
            return '';
        const normalizedText = normalizeText(text);
        let highlightedText = text;
        const matches = [];

        keywords.forEach(keyword => {
            const normalizedKeyword = normalizeText(keyword);
            const regex = new RegExp(`(${normalizedKeyword})`, 'gi');
            let match;
            while ((match = regex.exec(normalizedText)) !== null) {
                matches.push({ start: match.index, end: regex.lastIndex });
            }
        });

        // Sort matches by start position
        matches.sort((a, b) => a.start - b.start);

        // Highlight the original text based on matches
        let offset = 0;
        matches.forEach(({ start, end }) => {
            const originalStart = start + offset;
            const originalEnd = end + offset;
            highlightedText = highlightedText.slice(0, originalStart) + '<mark>' + highlightedText.slice(originalStart, originalEnd) + '</mark>' + highlightedText.slice(originalEnd);
            offset += '<mark>'.length + '</mark>'.length;
        });

        return highlightedText;
    };

    const getToBeHighlightedParts = (text, keywords, contextLength = 50) => {
        const normalizedKeywords = keywords.map(keyword => normalizeText(keyword));
        const normalizedText = normalizeText(text);
        const regex = new RegExp(`(${normalizedKeywords.join('|')})`, 'gi');
        const matches = [];
        let match;

        // Find all matches in the normalized text
        while ((match = regex.exec(normalizedText)) !== null) {
            matches.push({ start: match.index, end: regex.lastIndex });
        }

        const highlightedParts = [];
        let lastIndex = 0;

        matches.forEach(({ start, end }) => {
            const originalStart = start;
            const originalEnd = end;

            // Extract context before the match
            let contextBefore = text.slice(Math.max(0, originalStart - contextLength), originalStart);
            // Ensure contextBefore ends at a word boundary
            if (contextBefore.length > 0 && contextBefore[0] !== ' ') {
                const lastSpaceBefore = contextBefore.indexOf(' ');
                if (lastSpaceBefore !== -1) {
                    contextBefore = contextBefore.slice(lastSpaceBefore + 1);
                }
            }

            // Extract context after the match
            let contextAfter = text.slice(originalEnd, Math.min(text.length, originalEnd + contextLength));
            // Ensure contextAfter ends at a word boundary
            if (contextAfter.length > 0 && contextAfter[contextAfter.length - 1] !== ' ') {
                const firstSpaceAfter = contextAfter.lastIndexOf(' ');
                if (firstSpaceAfter !== -1) {
                    contextAfter = contextAfter.slice(0, firstSpaceAfter);
                }
            }

            highlightedParts.push(`${contextBefore}${text.slice(originalStart, originalEnd)}${contextAfter}`);
            lastIndex = originalEnd;

        });
        return highlightedParts;
    };

    const handleCheckboxChange = (e) => {
        const checked = e.target.checked;
        setIsSelected(checked);
        checked ? selectArticle(article.id) : deselectArticle(article.id);
    };

    let highlightedTitle;
    let highlightedTextParts = [];
    let highlightedExplanation;
    let highlightedCommentParts = [];

    if (keywords) {
        highlightedTitle = highlightKeywords(article.title, keywords);
        highlightedExplanation = highlightKeywords(htmlToText(article.explanation), keywords);
        highlightedTextParts = getToBeHighlightedParts(htmlToText(article.text), keywords).map(part => highlightKeywords(part, keywords));
        highlightedCommentParts = getToBeHighlightedParts(article.comments[0] ? htmlToText(article.comments[0].text) : '', keywords).map(part => highlightKeywords(part, keywords));
    }

    const getSubstringUntilNextPeriod = (text, index) => {
        if (!text || index < 0) return '';
        if (text.length <= index) return text;
        const nextPeriodIndex = text.indexOf('.', index);
        return nextPeriodIndex !== -1 ? text.slice(0, nextPeriodIndex + 1) + '..' : text;
    };

    const handleStarClick = async (e) => {
        e.stopPropagation();
        await articleApi.setIsStarred(article.id, !article.isStarred);
        fetchArticleById(article.id);
    }

    return (
        <div className="rounded-md bg-stone-50 hover:bg-white border-4
         shadow-xl cursor-pointer flex flex-row w-full overflow-hidden"
            style={{ borderColor: category && category.color }}
        >
            {areArticlesSelectable && <div className='min-h-full flex items-center pl-5 cursor-normal' onClick={handleCheckboxChange}>
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={handleCheckboxChange}
                    className="form-checkbox h-6 w-6 text-blue-600 mr-2"
                />
            </div>}
            <div className='flex flex-1 flex-col overflow-hidden px-10 py-6 text-xl' onClick={(e) => handleClick(e, article.id)} >
                <div className='flex justify-between'>
                    <h2 className="text-2xl text-gray-700 font-bold hover:text-gray-600 break-words">{keywords ? parse(highlightedTitle) : article.title}</h2>
                    <div onClick={handleStarClick} className='cursor-default'>
                        {article.isStarred ? (
                            <StarIcon style={{ fontSize: '2rem', color: '#FFD700' }} className="hover:scale-125" />
                        ) : (
                            <StarBorderIcon style={{ fontSize: '2rem', color: '#B0B0B0' }} className="hover:scale-125" />
                        )}
                    </div>
                </div>
                <ArticleInfo article={article} isEditable={false} />
                {keywords &&
                    <article className='my-2'>
                        {parse(highlightedExplanation)}
                    </article>
                }
                <article className='my-2'>
                    {keywords ? highlightedTextParts.map(part => parse('<p>' + part + '</p><p>...</p>')) : (article.text && parse(getSubstringUntilNextPeriod(article.text, numberOfCharsForText)))}
                </article>
                {keywords &&
                    <article className='my-2'>
                        {highlightedCommentParts.length > 0 && <h3 className='font-bold'>{t('comment') + ':'}</h3>}
                        {highlightedCommentParts.map(part => parse('<p>' + part + '</p><p>...</p>'))}
                    </article>
                }
                <div className='flex flex-shrink-0'>
                    {article.tags.slice(0, numberOfTags).map(tag => {
                        const tagEntity = getTagById(tag.id);
                        return <TagButton key={tag.id} isCloseable={false} label={tagEntity.name} />
                    })}
                    {article.tags.length > numberOfTags ? <h4 className='inline-block'>...</h4> : undefined}
                </div>
            </div>
        </div >
    );
}
