import parse from 'html-react-parser';
import TagButton from '../../../tag/TagButton';
import React, { useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { DBContext } from '../../../../store/db-context';
import { AppContext } from '../../../../store/app-context';
import { SearchContext } from '../../../../store/search-context';
import { normalizeText, normalizeTextWithMapping, normalizedRangeToOriginal, htmlToText, escapeRegExp } from '../../../../utils/textUtils.js';
import { articleApi } from '../../../../backend-adapter/BackendAdapter';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ArticleInfo from '../../ArticleInfo';

const ArticleShort = React.memo(({ article, keywords, handleClick }) => {

    const [isSelected, setIsSelected] = useState(false);
    const { getCategoryById, getTagById, fetchArticleById } = useContext(DBContext);
    const { translate: t } = useContext(AppContext);
    const { areArticlesSelectable, allOrNoneSelected, selectAllOrNoneClicks, selectArticle, deselectArticle } = useContext(SearchContext);

    const numberOfTags = 3;
    const numberOfCharsForText = 400;

    // Memoize category lookup for performance
    const category = useMemo(() => getCategoryById(article.categoryId), [getCategoryById, article.categoryId]);

    useEffect(() => {
        setIsSelected(allOrNoneSelected);
    }, [selectAllOrNoneClicks]);

    // Memoize the highlight function for better performance
    const highlightKeywords = useCallback((text, keywords) => {
        if (!text || text.length === 0)
            return '';
        const { normalized: normalizedText, normalizedToOriginalStart } = normalizeTextWithMapping(text);
        let highlightedText = text;
        const matches = [];

        keywords.forEach(keyword => {
            const normalizedKeyword = normalizeText(keyword);
            const escapedKeyword = escapeRegExp(normalizedKeyword);
            const regex = new RegExp(`(${escapedKeyword})`, 'gi');
            let match;
            while ((match = regex.exec(normalizedText)) !== null) {
                matches.push({ start: match.index, end: regex.lastIndex });
            }
        });

        // Sort matches by start position
        matches.sort((a, b) => a.start - b.start);

        // Highlight the original text: convert normalized match ranges to original indices
        let offset = 0;
        matches.forEach(({ start, end }) => {
            const [originalStart, originalEnd] = normalizedRangeToOriginal(normalizedToOriginalStart, start, end, text.length);
            const startWithOffset = originalStart + offset;
            const endWithOffset = originalEnd + offset;
            highlightedText = highlightedText.slice(0, startWithOffset) + '<mark>' + highlightedText.slice(startWithOffset, endWithOffset) + '</mark>' + highlightedText.slice(endWithOffset);
            offset += '<mark>'.length + '</mark>'.length;
        });

        return highlightedText;
    }, [normalizeText, normalizeTextWithMapping, normalizedRangeToOriginal, escapeRegExp]);

    const getToBeHighlightedParts = useCallback((text, keywords, contextLength = 50) => {
        const normalizedKeywords = keywords.map(keyword => normalizeText(keyword));
        const escapedKeywords = normalizedKeywords.map(keyword => escapeRegExp(keyword));
        const { normalized: normalizedText, normalizedToOriginalStart } = normalizeTextWithMapping(text);
        const regex = new RegExp(`(${escapedKeywords.join('|')})`, 'gi');
        const matches = [];
        let match;

        // Find all matches in the normalized text
        while ((match = regex.exec(normalizedText)) !== null) {
            matches.push({ start: match.index, end: regex.lastIndex });
        }

        const highlightedParts = [];

        matches.forEach(({ start, end }) => {
            const [originalStart, originalEnd] = normalizedRangeToOriginal(normalizedToOriginalStart, start, end, text.length);

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
        });
        return highlightedParts;
    }, [normalizeText, normalizeTextWithMapping, normalizedRangeToOriginal, escapeRegExp]);

    const handleCheckboxChange = useCallback((e) => {
        const checked = e.target.checked;
        setIsSelected(checked);
        checked ? selectArticle(article.id) : deselectArticle(article.id);
    }, [selectArticle, deselectArticle, article.id]);

    const toggleStar = useCallback(async (e) => {
        e.stopPropagation();
        try {
            await articleApi.setIsStarred(article.id, !article.isStarred);
            await fetchArticleById(article.id);
        } catch (error) {
            console.error('Error updating star status:', error);
        }
    }, [article.id, article.isStarred, fetchArticleById]);

    const toggleRead = useCallback(async (e) => {
        e.stopPropagation();
        try {
            await articleApi.setIsRead(article.id, !article.isRead);
            await fetchArticleById(article.id);
        } catch (error) {
            console.error('Error updating read status:', error);
        }
    }, [article.id, article.isRead, fetchArticleById]);

    // Memoize highlighted content for performance
    const highlightedContent = useMemo(() => {
        if (!keywords) {
            return {
                title: article.title,
                explanation: htmlToText(article.explanation),
                textParts: [],
                commentParts: []
            };
        }

        return {
            title: highlightKeywords(article.title, keywords),
            explanation: highlightKeywords(htmlToText(article.explanation), keywords),
            textParts: getToBeHighlightedParts(htmlToText(article.text), keywords).map(part => highlightKeywords(part, keywords)),
            commentParts: getToBeHighlightedParts(article.comments[0] ? htmlToText(article.comments[0].text) : '', keywords).map(part => highlightKeywords(part, keywords))
        };
    }, [article.title, article.explanation, article.text, article.comments, keywords, highlightKeywords, getToBeHighlightedParts, htmlToText]);

    let highlightedTitle = highlightedContent.title;
    let highlightedTextParts = highlightedContent.textParts;
    let highlightedExplanation = highlightedContent.explanation;
    let highlightedCommentParts = highlightedContent.commentParts;

    const getSubstringUntilNextPeriod = (text, index) => {
        if (!text || index < 0) return '';
        if (text.length <= index) return text;
        const nextPeriodIndex = text.indexOf('.', index);
        const result = nextPeriodIndex !== -1 ? text.slice(0, nextPeriodIndex + 1) + '..' : text;
        return result.trim();
    };

    const handleStarClick = async (e) => {
        e.stopPropagation();
        await articleApi.setIsStarred(article.id, !article.isStarred);
        fetchArticleById(article.id);
    }

    return (
        <div className="article-short-hover rounded-md border-4
         shadow-xl cursor-pointer flex flex-row w-full overflow-hidden"
            style={{ 
                borderColor: category && category.color
            }}
        >
            {areArticlesSelectable && <div className='min-h-full flex items-center pl-5 cursor-normal' onClick={handleCheckboxChange}>
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={handleCheckboxChange}
                    className="form-checkbox h-6 w-6 text-blue-600 mr-2"
                />
            </div>}
            <div className='flex flex-1 flex-col overflow-hidden px-10 py-6 text-xl' onClick={(e) => handleClick(e, article.id)} style={{ color: 'var(--text-primary)' }}>
                <div className='flex justify-between'>
                    <h2 className="text-2xl font-bold break-words" style={{ color: 'var(--text-primary)' }}>{keywords ? parse(highlightedTitle) : article.title}</h2>
                    <div className='flex gap-2 flex-shrink-0'>
                        <div onClick={toggleStar} className='cursor-pointer' title={t('starred')}>
                            {article.isStarred ? (
                                <StarIcon style={{ fontSize: '2rem', color: '#FFD700' }} className="hover:scale-125" />
                            ) : (
                                <StarBorderIcon style={{ fontSize: '2rem', color: '#B0B0B0' }} className="hover:scale-125" />
                            )}
                        </div>
                        <div onClick={toggleRead} className='cursor-pointer' title={article.isRead ? t('mark as unread') : t('mark as read')}>
                            {article.isRead ? (
                                <CheckCircleIcon style={{ fontSize: '2rem', color: '#4CAF50' }} className="hover:scale-125" />
                            ) : (
                                <CheckCircleOutlineIcon style={{ fontSize: '2rem', color: '#B0B0B0' }} className="hover:scale-125" />
                            )}
                        </div>
                    </div>
                </div>
                <ArticleInfo article={article} isEditable={false} showReadTime={true} />
                {keywords &&
                    <article className='my-2'>
                        {parse(highlightedExplanation)}
                    </article>
                }
                <article className='my-2'>
                    {keywords ? highlightedTextParts.map(part => parse('<p>' + part + '</p><p>...</p>')) : (article.text && parse(getSubstringUntilNextPeriod(htmlToText(article.text), numberOfCharsForText)))}
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
                        return <TagButton key={tag.id} isCloseable={false} label={tagEntity?.name} />
                    })}
                    {article.tags.length > numberOfTags ? <h4 className='inline-block'>...</h4> : undefined}
                </div>
            </div>
        </div >
    );
});

export default ArticleShort;
